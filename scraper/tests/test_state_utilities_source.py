"""Fixture-based tests for scraper/sources/state_utilities.py.

Fixtures captured 2026-08-23 (all HTTP 200, real pages):
- edc_procurement_list.html + edc_notice_detail_830.html: live EDC procurement pages.
- ppwsa_bidding_en.html: live PPWSA bidding page.
The adapter itself performs NO network call — fetch_raw() returns hardcoded payloads,
frozen verbatim in fetch_raw_output_snapshot.json (labelled as such, not scraped).
"""

from datetime import datetime, timedelta, timezone

from conftest import load_json, load_text, raw_items_from_snapshot

from scraper.sources.base import RawTenderData
from scraper.sources.state_utilities import StateUtilitiesSource

SNAPSHOT = "state_utilities/fetch_raw_output_snapshot.json"


def normalized_all():
    source = StateUtilitiesSource()
    return [source.parse_and_normalize(r) for r in raw_items_from_snapshot(load_json(SNAPSHOT))]


class TestFixtureIntegrity:
    def test_edc_listing_page_contains_procurement_notices(self):
        html = load_text("state_utilities/edc_procurement_list.html")
        assert "procurement_page/detail" in html

    def test_edc_detail_page_is_a_notice(self):
        html = load_text("state_utilities/edc_notice_detail_830.html")
        assert "procurement" in html.lower()

    def test_ppwsa_page_covers_bidding(self):
        html = load_text("state_utilities/ppwsa_bidding_en.html")
        assert "bidding" in html.lower() or "tender" in html.lower()

    def test_snapshot_holds_the_two_hardcoded_utility_notices(self):
        snapshot = load_json(SNAPSHOT)
        ids = [i["external_id"] for i in snapshot["items"]]
        assert ids == ["EDC-KH-2026-NCB-088", "PPWSA-KH-2026-W-019"]


class TestParseAndNormalize:
    def setup_method(self):
        self.results = {n.external_id: n for n in normalized_all()}
        self.source = StateUtilitiesSource()

    def test_titles_non_empty(self):
        assert all(n.title.strip() for n in normalized_all())

    def test_golden_slug_format(self):
        n = self.results["EDC-KH-2026-NCB-088"]
        # slug = "util-kh-" + sanitized title[:60] + "-" + external_id[-6:]
        assert n.slug == (
            "util-kh-edcncb2026g-088---supply-and-delivery-of-22kv-medium-voltage-cb-088"
        )

    def test_deadline_parsed_to_tz_aware_datetime(self):
        n = self.results["PPWSA-KH-2026-W-019"]
        assert isinstance(n.deadline, datetime)
        assert n.deadline.utcoffset() == timedelta(0)
        payload_deadline = datetime.fromisoformat(
            load_json(SNAPSHOT)["items"][1]["raw_payload"]["deadline"]
        )
        assert n.deadline == payload_deadline

    def test_published_at_parsed_from_payload(self):
        n = self.results["EDC-KH-2026-NCB-088"]
        payload_published = datetime.fromisoformat(
            load_json(SNAPSHOT)["items"][0]["raw_payload"]["published"]
        )
        assert n.published_at == payload_published

    def test_summary_truncation_boundary(self):
        edc, ppwsa = normalized_all()
        assert edc.summary.endswith("...")
        assert len(edc.summary) == 243
        assert len(ppwsa.summary) == 243

    def test_estimated_value_and_currency_passthrough(self):
        assert self.results["EDC-KH-2026-NCB-088"].estimated_value == 650000.0
        assert self.results["PPWSA-KH-2026-W-019"].estimated_value == 820000.0
        assert all(n.currency == "USD" for n in normalized_all())

    def test_organization_slug_derived_from_title(self):
        orgs = {n.external_id: n.organization_slug for n in normalized_all()}
        assert orgs["EDC-KH-2026-NCB-088"] == "edc-cambodia"
        assert orgs["PPWSA-KH-2026-W-019"] == "ppwsa-cambodia"

    def test_organization_slug_defaults_to_ppwsa_when_title_has_no_edc(self):
        raw = self._synthetic("Telecom Cambodia fibre rollout framework")
        assert self.source.parse_and_normalize(raw).organization_slug == "ppwsa-cambodia"

    def test_category_branches(self):
        cats = {n.external_id: n.category_slug for n in normalized_all()}
        assert cats["EDC-KH-2026-NCB-088"] == "energy-renewables"  # power cable/transformer
        assert cats["PPWSA-KH-2026-W-019"] == "water-sanitation"  # water pipes

    def test_default_category_is_construction_infrastructure(self):
        raw = self._synthetic("Headquarters office renovation works")
        result = self.source.parse_and_normalize(raw)
        assert result.category_slug == "construction-infrastructure"

    def test_absent_deadline_key_leaves_deadline_none(self):
        # The now+30d fallback only fires when the key exists but fails to parse.
        raw = self._synthetic("Smart meter pilot procurement")
        raw.raw_payload.pop("deadline", None)
        assert self.source.parse_and_normalize(raw).deadline is None

    def test_malformed_deadline_falls_back_to_now_plus_30_days(self):
        raw = self._synthetic("Transformer supply framework")
        raw.raw_payload["deadline"] = "next Tuesday"
        before = datetime.now(timezone.utc)
        result = self.source.parse_and_normalize(raw)
        after = datetime.now(timezone.utc)
        assert result.deadline is not None
        assert before + timedelta(days=30) <= result.deadline <= after + timedelta(days=30)

    def test_constants_confidence_location_requirements(self):
        for n in normalized_all():
            assert n.confidence_score == 97
            assert n.location == "Phnom Penh & National Grid, Cambodia"
            assert n.requirements  # static certification requirements attached

    def _synthetic(self, title: str) -> RawTenderData:
        return RawTenderData(
            source_code="state_utilities",
            external_id="UTIL-KH-TEST-01",
            source_url="https://www.edc.com.kh/procurement/test",
            title=title,
            description="x",
            raw_payload={
                "id": "UTIL-KH-TEST-01",
                "title": title,
                "utility": "Test Utility",
                "description": "x",
                "deadline": None,
                "published": None,
                "budget": None,
                "currency": "USD",
                "url": "https://www.edc.com.kh/procurement/test",
            },
        )
