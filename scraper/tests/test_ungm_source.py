"""Fixture-based tests for scraper/sources/ungm.py.

Fixture status (captured 2026-08-23): UNGM has NO server-rendered JSON API any more —
every known API path 302-redirects to /API/GenericError (see ungm/api_probe_evidence.txt)
and the public site is a client-side SPA (public_notice_spa_shell.html). More
fundamentally, scraper/sources/ungm.py performs no HTTP call at all: fetch_raw()
returns hardcoded payloads. fetch_raw_output_snapshot.json freezes that real runtime
output; it is NOT scraped from the wire.
"""

from datetime import datetime, timedelta, timezone

from conftest import load_json, load_text, raw_items_from_snapshot

from scraper.sources.base import RawTenderData
from scraper.sources.ungm import UNGMCambodiaSource

SNAPSHOT = "ungm/fetch_raw_output_snapshot.json"


def normalized_all():
    source = UNGMCambodiaSource()
    return [source.parse_and_normalize(r) for r in raw_items_from_snapshot(load_json(SNAPSHOT))]


class TestFixtureIntegrity:
    def test_legacy_api_decommission_documented(self):
        evidence = load_text("ungm/api_probe_evidence.txt")
        assert "GenericError" in evidence

    def test_snapshot_holds_three_notices(self):
        snapshot = load_json(SNAPSHOT)
        ids = [i["external_id"] for i in snapshot["items"]]
        assert ids == ["UNGM-KH-2026-091", "UNGM-KH-2026-092", "UNGM-KH-2026-093"]


class TestParseAndNormalize:
    def setup_method(self):
        self.results = {n.external_id: n for n in normalized_all()}
        self.source = UNGMCambodiaSource()

    def test_titles_non_empty_and_external_ids_stable(self):
        for n in normalized_all():
            assert n.title.strip()
            assert n.external_id.startswith("UNGM-KH-2026-")

    def test_golden_slug_truncated_prefix_plus_external_id_tail(self):
        # slug = "ungm-kh-" + sanitized-title[:60] + "-" + external_id[-6:]
        n = self.results["UNGM-KH-2026-091"]
        assert n.slug == (
            "ungm-kh-undpkhmrfp202608---provision-of-solar-mini-grid-systems-for--26-091"
        )
        prefix = n.slug[len("ungm-kh-") :].rsplit("-26-091", 1)[0]
        assert len(prefix) <= 60

    def test_deadline_parsed_to_tz_aware_datetime_from_iso_payload(self):
        n = self.results["UNGM-KH-2026-091"]
        assert isinstance(n.deadline, datetime)
        assert n.deadline.utcoffset() == timedelta(0)
        payload_deadline = datetime.fromisoformat(
            load_json(SNAPSHOT)["items"][0]["raw_payload"]["deadline"]
        )
        assert n.deadline == payload_deadline

    def test_published_at_parsed_from_payload(self):
        n = self.results["UNGM-KH-2026-092"]
        payload_published = datetime.fromisoformat(
            load_json(SNAPSHOT)["items"][1]["raw_payload"]["published"]
        )
        assert n.published_at == payload_published

    def test_summary_truncates_long_descriptions_with_ellipsis(self):
        for n in normalized_all():
            if len(n.description) > 240:
                assert n.summary.endswith("...")
                assert len(n.summary) == 243  # 240 chars + "..."

    def test_estimated_value_and_currency_passthrough(self):
        assert self.results["UNGM-KH-2026-091"].estimated_value == 320000.0
        assert self.results["UNGM-KH-2026-092"].estimated_value == 185000.0
        assert all(n.currency == "USD" for n in normalized_all())

    def test_category_mapping_order_on_real_records(self):
        cats = {n.external_id: n.category_slug for n in normalized_all()}
        # Solar mini-grid title -> energy branch wins first.
        assert cats["UNGM-KH-2026-091"] == "energy-renewables"
        # Nutrition kits and LIMS both hit the health branch.
        assert cats["UNGM-KH-2026-092"] == "health-medical"
        assert cats["UNGM-KH-2026-093"] == "health-medical"

    def test_it_branch_only_when_no_health_keyword(self):
        raw = self._synthetic("RFP 2026 - National Software Development Framework")
        assert self.source.parse_and_normalize(raw).category_slug == "it-telecom"

    def test_default_category_is_consulting_services(self):
        # Avoid any word containing "it"/"system" etc. — naive substring matching
        # ("furniture") would otherwise land in an earlier keyword branch.
        raw = self._synthetic("Provision of office chairs and desks")
        assert self.source.parse_and_normalize(raw).category_slug == "consulting-services"

    def test_missing_deadline_key_leaves_deadline_none(self):
        raw = self._synthetic("Some UN procurement notice")
        raw.raw_payload.pop("deadline", None)
        assert self.source.parse_and_normalize(raw).deadline is None

    def test_malformed_deadline_falls_back_to_now_plus_25_days(self):
        raw = self._synthetic("Broken deadline notice")
        raw.raw_payload["deadline"] = "31/12/2026"
        before = datetime.now(timezone.utc)
        result = self.source.parse_and_normalize(raw)
        after = datetime.now(timezone.utc)
        assert result.deadline.tzinfo is not None
        assert before + timedelta(days=25) <= result.deadline <= after + timedelta(days=25)

    def test_constants_confidence_location_products(self):
        for n in normalized_all():
            assert n.confidence_score == 96
            assert n.organization_slug == "ungm-cambodia"
            assert n.location == "Cambodia (Multi-Provincial)"
            assert n.products_services  # static product list attached

    def _synthetic(self, title: str) -> RawTenderData:
        return RawTenderData(
            source_code="ungm",
            external_id="UNGM-KH-TEST-01",
            source_url="https://www.ungm.org/Public/Notice/UNGM-KH-TEST-01",
            title=title,
            description="x",
            raw_payload={
                "id": "UNGM-KH-TEST-01",
                "title": title,
                "deadline": None,
                "published": None,
                "budget": None,
                "currency": "USD",
                "url": "https://www.ungm.org/Public/Notice/UNGM-KH-TEST-01",
            },
        )
