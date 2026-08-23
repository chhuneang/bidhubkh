"""Fixture-based tests for scraper/sources/adb.py.

Fixtures captured 2026-08-23:
- fetch_raw_output_snapshot.json: the adapter's ACTUAL fetch_raw() output. Its live
  API request (https://www.adb.org/api/tenders?country=CAM&type=all&page=0) returned
  HTTP 404, so production currently always ingests the hardcoded fallback items —
  this snapshot freezes exactly those.
- api_tenders_404.html: verbatim excerpt of the real 404 body (drift evidence).
- tenders_listing.html: the REAL current ADB tender listing page (HTTP 200 at
  https://www.adb.org/projects/tenders), documenting where the data actually lives.
"""

from datetime import datetime, timedelta

from conftest import load_json, load_text, raw_items_from_snapshot

from scraper.sources.adb import ADBCambodiaSource

SNAPSHOT = "adb_kh/fetch_raw_output_snapshot.json"


def normalized_all():
    source = ADBCambodiaSource()
    return [source.parse_and_normalize(r) for r in raw_items_from_snapshot(load_json(SNAPSHOT))]


class TestFetchRawDrift:
    def test_api_endpoint_returns_error_page_in_real_capture(self):
        body = load_text("adb_kh/api_tenders_404.html")
        # Verbatim head of the HTTP 404 body returned by /api/tenders on 2026-08-23.
        assert "We are sorry but the page you are looking for" in body[:1200]
        assert "404" in body or "no longer available" in body

    def test_snapshot_items_are_the_documented_fallback_ids(self):
        # Because the API is dead, fetch_raw() can only ever produce these two items.
        items = raw_items_from_snapshot(load_json(SNAPSHOT))
        assert [i.external_id for i in items] == ["ADB-CAM-53240-002", "ADB-CAM-48218-CW03"]

    def test_real_listing_page_is_alive_and_lists_tenders(self):
        html = load_text("adb_kh/tenders_listing.html")
        assert "/projects/tenders" in html


class TestParseAndNormalize:
    def setup_method(self):
        self.results = {n.external_id: n for n in normalized_all()}

    def test_titles_are_never_empty(self):
        assert all(n.title.strip() for n in self.results.values())

    def test_estimated_value_extracted_from_payload(self):
        assert self.results["ADB-CAM-53240-002"].estimated_value == 3500000.0
        assert self.results["ADB-CAM-48218-CW03"].estimated_value == 2100000.0

    def test_published_parsed_to_utc_aware_datetime(self):
        solar = self.results["ADB-CAM-53240-002"]
        assert isinstance(solar.published_at, datetime)
        assert solar.published_at.utcoffset() == timedelta(0)
        assert solar.published_at.replace(tzinfo=None) == datetime(2026, 8, 15, 0, 0, 0)

    def test_deadline_parsed_to_utc_aware_datetime(self):
        solar = self.results["ADB-CAM-53240-002"]
        assert isinstance(solar.deadline, datetime)
        assert solar.deadline.utcoffset() == timedelta(0)
        assert solar.deadline.replace(tzinfo=None) == datetime(2026, 9, 30, 17, 0, 0)

    def test_reference_number_uses_project_number(self):
        assert self.results["ADB-CAM-53240-002"].reference_number == "53240-002"
        assert self.results["ADB-CAM-48218-CW03"].reference_number == "48218-003"

    def test_slug_is_hyphenated_lowercase_with_external_id_suffix(self):
        solar = self.results["ADB-CAM-53240-002"]
        # The title contains " - " which collapses to "--" after sanitisation;
        # pinned verbatim so any slug-algorithm change surfaces here.
        assert solar.slug.startswith("cambodia-energy-transition-sector-project---grid-solar")
        assert solar.slug.endswith("-ADB-CAM-53240-002")
        title_part = solar.slug.rsplit("-ADB-", 1)[0]
        assert " " not in title_part
        assert title_part == title_part.lower()

    def test_category_energy_branch(self):
        assert self.results["ADB-CAM-53240-002"].category_slug == "electrical-energy"

    def test_category_defaults_to_construction_civil_for_works(self):
        # Bridge/drainage title matches none of energy/it/consulting keywords.
        assert self.results["ADB-CAM-48218-CW03"].category_slug == "construction-civil"

    def test_procurement_method_from_payload_type(self):
        assert (
            self.results["ADB-CAM-53240-002"].procurement_method
            == "International Competitive Bidding (ICB)"
        )
        assert (
            self.results["ADB-CAM-48218-CW03"].procurement_method
            == "National Competitive Bidding (NCB)"
        )

    def test_currency_hardcoded_usd(self):
        assert all(n.currency == "USD" for n in self.results.values())

    def test_confidence_score_is_96(self):
        assert all(n.confidence_score == 96 for n in self.results.values())

    def test_missing_dates_fall_back_to_now_and_none(self):
        source = ADBCambodiaSource()
        base = raw_items_from_snapshot(load_json(SNAPSHOT))[0]
        stripped = base.model_copy(deep=True)
        stripped.raw_payload.pop("published", None)
        stripped.raw_payload.pop("deadline", None)

        before = datetime.utcnow()
        result = source.parse_and_normalize(stripped)
        after = datetime.utcnow()

        assert result.deadline is None
        assert before <= result.published_at.replace(tzinfo=None) <= after

    def test_malformed_deadline_string_is_dropped_silently(self):
        source = ADBCambodiaSource()
        base = raw_items_from_snapshot(load_json(SNAPSHOT))[0]
        broken = base.model_copy(deep=True)
        broken.raw_payload["deadline"] = "not-a-date"
        assert source.parse_and_normalize(broken).deadline is None
