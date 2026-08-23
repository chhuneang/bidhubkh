"""Fixture-based tests for scraper/sources/world_bank.py.

Fixtures are real captures of the World Bank procnotices API taken 2026-08-23:
- procnotices_cambodia.json: rows sorted by proc_notice_date desc + qterm=Cambodia
  (the only working way to obtain Cambodia notices — see TestCountryFilterDrift).
- procnotices_countrycode_ignored.json: the EXACT request the adapter sends,
  kept as evidence that ``countrycode_exact=KH`` is silently ignored upstream.
"""

import re
from datetime import datetime

from conftest import load_json

from scraper.sources.base import RawTenderData
from scraper.sources.world_bank import WorldBankCambodiaSource

CAMBODIA_FIXTURE = "world_bank_kh/procnotices_cambodia.json"


def fetch_raw_equivalent(body: dict) -> list[RawTenderData]:
    """Replicates the transformation loop of WorldBankCambodiaSource.fetch_raw
    against a captured JSON body, including the Cambodia country post-filter."""
    raw_items = []
    notices = body.get("procnotices", [])

    notice_list = []
    if isinstance(notices, dict):
        notice_list = list(notices.values())
    elif isinstance(notices, list):
        notice_list = notices

    for notice in notice_list:
        if not isinstance(notice, dict):
            continue
        country = notice.get("project_ctry_name")
        if country is not None and country != "Cambodia":
            continue
        external_id = notice.get("id") or notice.get("notice_id") or str(len(raw_items) + 1)
        title = notice.get("notice_title") or notice.get("project_name") or "World Bank Tender Notice"
        doc_url = notice.get("url") or (
            f"https://projects.worldbank.org/en/projects-operations/procurement-detail/{external_id}"
        )
        raw_items.append(
            RawTenderData(
                source_code="world_bank_kh",
                external_id=str(external_id),
                source_url=doc_url,
                title=title,
                description=notice.get("notice_text") or notice.get("project_name"),
                raw_payload=notice,
            )
        )
    return raw_items


def build_all():
    body = load_json(CAMBODIA_FIXTURE)
    return fetch_raw_equivalent(body)


class TestFetchRawEquivalence:
    def test_every_captured_notice_becomes_a_raw_item(self):
        # 4 captured; 1 ("East Asia and Pacific" regional notice) is dropped
        # by the country post-filter, leaving the 3 Cambodia notices.
        body = load_json(CAMBODIA_FIXTURE)
        items = build_all()
        assert len(body["procnotices"]) == 4
        assert len(items) == 3

    def test_country_post_filter_drops_non_cambodia_keeps_missing(self):
        polluted = {"procnotices": [
            {"id": "X1", "project_ctry_name": "Guinea", "project_name": "Guinea notice"},
            {"id": "X2", "project_ctry_name": "Cambodia", "project_name": "KH notice"},
            {"id": "X3", "project_name": "no country field"},
        ]}
        ids = [i.external_id for i in fetch_raw_equivalent(polluted)]
        assert ids == ["X2", "X3"]

    def test_title_falls_back_to_project_name(self):
        # Real capture has NO notice_title on any record; the parser must use project_name.
        for item in build_all():
            assert item.title == item.raw_payload["project_name"]
            assert item.title.strip() != ""

    def test_external_id_comes_from_notice_id_and_is_stable(self):
        ids = [item.external_id for item in build_all()]
        assert ids == ["OP00462995", "OP00463743", "OP00463715"]

    def test_source_url_falls_back_when_notice_has_no_url_field(self):
        # None of the captured Cambodia records carry a top-level "url" key.
        item = build_all()[0]
        assert item.source_url == (
            "https://projects.worldbank.org/en/projects-operations/procurement-detail/OP00462995"
        )

    def test_handles_dict_shaped_procnotices_container(self):
        # The adapter accepts {"procnotices": {key: notice, ...}} as well as a list.
        body = load_json(CAMBODIA_FIXTURE)
        wrapped = {"procnotices": {n["id"]: n for n in body["procnotices"]}}
        assert len(fetch_raw_equivalent(wrapped)) == 3

    def test_non_dict_entries_are_skipped(self):
        body = load_json(CAMBODIA_FIXTURE)
        polluted = {"procnotices": ["garbage", None, body["procnotices"][0]]}
        assert len(fetch_raw_equivalent(polluted)) == 1


class TestParseAndNormalize:
    def setup_method(self):
        self.source = WorldBankCambodiaSource()
        self.raws = build_all()
        self.normalized = [self.source.parse_and_normalize(r) for r in self.raws]

    def test_titles_are_never_empty(self):
        assert all(n.title.strip() for n in self.normalized)

    def test_published_at_parsed_from_noticedate_dd_mon_yyyy(self):
        # payload carries noticedate as "17-Aug-2026" (dd-Mon-yyyy); before the
        # dedicated format branch this silently fell back to utcnow().
        first = self.normalized[0]
        assert isinstance(first.published_at, datetime)
        assert first.published_at.isoformat().startswith("2026-08-17T00:00:00")

    def test_deadline_parsed_from_iso_z_submission_deadline(self):
        # One of the two captured deadline-bearing notices was the regional
        # ("East Asia and Pacific") record dropped by the country filter.
        with_deadline = [n for n in self.normalized if n.deadline is not None]
        assert len(with_deadline) == 1
        assert with_deadline[0].deadline.isoformat().startswith("2026-09-01T00:00:00")

    def test_missing_deadline_stays_none(self):
        without = [n for n in self.normalized if n.deadline is None]
        assert {n.external_id for n in without} == {"OP00463743", "OP00463715"}

    def test_slug_format_lowercase_hyphenated_with_external_id_suffix(self):
        slug = self.normalized[0].slug
        assert slug == (
            "water-supply-and-sanitation-acceleration-project-OP00462995"
        )
        assert " " not in slug
        assert slug.endswith("-OP00462995")

    def test_slug_strips_punctuation_from_title(self):
        clean = re.sub(r"[^a-z0-9-]", "", self.normalized[0].slug.lower())
        assert clean == self.normalized[0].slug.lower()

    def test_reference_number_prefers_bid_description(self):
        # Quirk worth pinning: reference_number receives the long bid_description
        # text rather than a compact identifier when bid_description is present.
        assert self.normalized[0].reference_number.startswith("National Water Supply Strategi")
        assert self.normalized[0].reference_number != f"WB/KH/{self.normalized[0].external_id}"

    def test_reference_number_falls_back_to_wb_prefix_without_bid_description(self):
        raw = self.raws[1].model_copy(deep=True)
        raw.raw_payload.pop("bid_description", None)
        result = self.source.parse_and_normalize(raw)
        assert result.reference_number == "WB/KH/OP00463743"

    def test_estimated_value_is_deferred_to_extraction_stage(self):
        # The API carries no value field; the adapter intentionally leaves it to the AI pass.
        assert all(n.estimated_value is None for n in self.normalized)

    def test_currency_is_hardcoded_usd(self):
        assert all(n.currency == "USD" for n in self.normalized)

    def test_confidence_score_is_95_for_all_records(self):
        assert all(n.confidence_score == 95 for n in self.normalized)

    def test_category_defaults_to_consulting_services_without_keywords(self):
        by_id = {n.external_id: n.category_slug for n in self.normalized}
        assert by_id["OP00463743"] == "consulting-services"

    def test_naive_substring_keyword_matches_sanitation_as_it_telecom(self):
        # Documents current behaviour: keyword checks are naive substring matches,
        # so "sanitation" contains "it" and maps this WASH project to it-telecom.
        by_id = {n.external_id: n.category_slug for n in self.normalized}
        assert by_id["OP00462995"] == "it-telecom"  # "Water Supply and Sanitation..."

    def test_synthetic_title_category_branches(self):
        # Direct unit coverage of each mapping branch using realistic titles.
        base = self.raws[0]

        def category_for(title: str) -> str:
            raw = base.model_copy(update={"title": title})
            return self.source.parse_and_normalize(raw).category_slug

        assert category_for("Supply of 40 laptops and servers for schools") == "it-telecom"
        # NOTE: titles must avoid words containing "it" ("rehabilitation",
        # "sanitation", "transition") because the naive substring match
        # classifies them as it-telecom first — e.g. an "...Energy Transition
        # Program" notice is classified it-telecom (see the sanitation test).
        assert category_for("Energy transition programme support") == "it-telecom"
        assert category_for("Road paving and bridge works package two") == "construction-civil"
        # Even "hospital" contains "it" — pick medical wording without any IT keyword.
        assert category_for("Pharmaceutical and medical supplies for rural clinics") == (
            "medical-healthcare"
        )
        assert category_for("Delivery of one ambulance truck and motor vehicles") == (
            "vehicles-transport"
        )


class TestCountryFilterDrift:
    def test_adapter_request_returns_zero_cambodia_notices(self):
        """Canary documenting a live bug (scraper/sources/world_bank.py:24).

        The v2 procnotices endpoint ignores ``countrycode_exact=KH``: this file IS
        the exact response the adapter's fetch_raw() request returned on
        2026-08-23, and not one notice is Cambodian. If this test starts failing
        because Cambodia rows appear, upstream fixed the filter.
        """
        body = load_json("world_bank_kh/procnotices_countrycode_ignored.json")
        countries = {
            n.get("project_ctry_name") for n in body["procnotices"] if isinstance(n, dict)
        }
        assert countries == {"Guinea", "Cote d'Ivoire", "Pakistan"}
        assert "Cambodia" not in countries
