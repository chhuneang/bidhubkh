"""Fixture-based tests for scraper/sources/ngo_cambodia.py.

Fixture status (captured 2026-08-23): the adapter's website_url points at ReliefWeb,
whose public API v1 is decommissioned and v2 rejects every generic appname with HTTP 403
(see ngo_cambodia/reliefweb_api_403_appname_required.json — a real API response).
Regardless, scraper/sources/ngo_cambodia.py performs no HTTP call at all: fetch_raw()
returns hardcoded payloads. fetch_raw_output_snapshot.json freezes that real runtime
output; it is NOT scraped from the wire.
"""

from datetime import datetime, timedelta, timezone

from conftest import load_json, load_text, raw_items_from_snapshot

from scraper.sources.base import RawTenderData
from scraper.sources.ngo_cambodia import NGOCambodiaSource

SNAPSHOT = "ngo_cambodia/fetch_raw_output_snapshot.json"


def normalized_all():
    source = NGOCambodiaSource()
    return [source.parse_and_normalize(r) for r in raw_items_from_snapshot(load_json(SNAPSHOT))]


class TestFixtureIntegrity:
    def test_reliefweb_api_rejection_documented(self):
        body = load_text("ngo_cambodia/reliefweb_api_403_appname_required.json")
        assert "appname" in body

    def test_snapshot_holds_the_two_hardcoded_notices(self):
        snapshot = load_json(SNAPSHOT)
        ids = [i["external_id"] for i in snapshot["items"]]
        assert ids == ["NGO-KH-2026-041", "NGO-KH-2026-042"]


class TestParseAndNormalize:
    def setup_method(self):
        self.results = {n.external_id: n for n in normalized_all()}
        self.source = NGOCambodiaSource()

    def test_titles_non_empty(self):
        assert all(n.title.strip() for n in normalized_all())

    def test_golden_slug_format(self):
        n = self.results["NGO-KH-2026-041"]
        # slug = "ngo-kh-" + sanitized title[:60] + "-" + external_id[-6:]
        assert n.slug == (
            "ngo-kh-rfp-cw-2026-03---construction-of-18-deep-groundwater-communi-26-041"
        )

    def test_deadline_parsed_to_tz_aware_datetime(self):
        n = self.results["NGO-KH-2026-041"]
        assert isinstance(n.deadline, datetime)
        assert n.deadline.utcoffset() == timedelta(0)
        payload_deadline = datetime.fromisoformat(
            load_json(SNAPSHOT)["items"][0]["raw_payload"]["deadline"]
        )
        assert n.deadline == payload_deadline

    def test_published_at_parsed_from_payload(self):
        n = self.results["NGO-KH-2026-042"]
        payload_published = datetime.fromisoformat(
            load_json(SNAPSHOT)["items"][1]["raw_payload"]["published"]
        )
        assert n.published_at == payload_published

    def test_summary_truncation_boundary(self):
        long_desc, short_desc = normalized_all()
        assert long_desc.summary.endswith("...")
        assert len(long_desc.summary) == 243
        assert short_desc.summary == short_desc.description  # under 240 chars: untouched

    def test_estimated_value_and_currency_passthrough(self):
        assert self.results["NGO-KH-2026-041"].estimated_value == 145000.0
        assert self.results["NGO-KH-2026-042"].estimated_value == 98000.0
        assert all(n.currency == "USD" for n in normalized_all())

    def test_category_branches_on_real_records(self):
        cats = {n.external_id: n.category_slug for n in normalized_all()}
        assert cats["NGO-KH-2026-041"] == "water-sanitation"  # boreholes / construction
        assert cats["NGO-KH-2026-042"] == "education-training"  # STEM kits / tablets

    def test_default_category_is_consulting_services(self):
        raw = self._synthetic("Consultancy for baseline survey", {})
        assert self.source.parse_and_normalize(raw).category_slug == "consulting-services"

    def test_absent_deadline_key_leaves_deadline_none(self):
        # The now+20d fallback only fires when the key exists but fails to parse.
        raw = self._synthetic("Rapid response relief supplies", {"deadline": None})
        raw.raw_payload.pop("deadline", None)
        assert self.source.parse_and_normalize(raw).deadline is None

    def test_malformed_deadline_falls_back_to_now_plus_20_days(self):
        raw = self._synthetic("Relief supplies tender", {"deadline": "15/09/2026"})
        before = datetime.now(timezone.utc)
        result = self.source.parse_and_normalize(raw)
        after = datetime.now(timezone.utc)
        assert result.deadline is not None
        assert before + timedelta(days=20) <= result.deadline <= after + timedelta(days=20)

    def test_missing_published_falls_back_to_now_utc(self):
        raw = self._synthetic("Emergency distribution tender", {"deadline": None})
        before = datetime.now(timezone.utc)
        result = self.source.parse_and_normalize(raw)
        after = datetime.now(timezone.utc)
        assert before - timedelta(seconds=5) <= result.published_at <= after

    def test_currency_defaults_to_usd_when_payload_lacks_it(self):
        raw = self._synthetic("Agricultural tools procurement", {})
        # NOTE: an explicit currency=None would crash pydantic validation, because
        # payload.get("currency", "USD") only defaults on a MISSING key.
        raw.raw_payload.pop("currency")
        assert self.source.parse_and_normalize(raw).currency == "USD"

    def test_constants_confidence_org_location(self):
        for n in normalized_all():
            assert n.confidence_score == 94
            assert n.organization_slug == "ngo-cambodia"
            assert n.location == "Kampong Thom & Multi-Provincial, Cambodia"

    def _synthetic(self, title: str, payload_overrides: dict) -> RawTenderData:
        payload = {
            "id": "NGO-KH-TEST-01",
            "title": title,
            "deadline": None,
            "published": None,
            "budget": None,
            "currency": "USD",
            "url": "https://reliefweb.int/job/cambodia/test",
        }
        payload.update(payload_overrides)
        return RawTenderData(
            source_code="ngo_cambodia",
            external_id="NGO-KH-TEST-01",
            source_url="https://reliefweb.int/job/cambodia/test",
            title=title,
            description="x",
            raw_payload=payload,
        )
