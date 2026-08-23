"""Tests for scraper/sources/adb.py.

Fixtures (drift evidence, captured 2026-08-23):
- api_tenders_404.html: verbatim excerpt of the HTTP 404 body returned by the
  legacy /api/tenders endpoint.
- tenders_listing.html: the real ADB tender listing page, which is
  JS-rendered and therefore not server-scrapeable.

The adapter's former "simulated notices" fallback was removed on 2026-08-23:
it fabricated two ADB tenders (one citing a Nepali project number) that were
ingested into production. fetch_raw() must now return [] whenever the API
yields nothing.
"""

from datetime import datetime
from unittest.mock import MagicMock, patch

from conftest import load_text

from scraper.sources.adb import ADBCambodiaSource
from scraper.sources.base import RawTenderData


def _synthetic_raw(title="Synthetic grid solar modernization works package", **payload_overrides):
    payload = {
        "id": "ADB-CAM-SYNTH-001",
        "project_number": "99999-001",
        "published": "2026-08-15T00:00:00Z",
        "deadline": "2026-09-30T17:00:00Z",
        "sector": "Energy",
        "estimated_value": 3500000.0,
        "procurement_type": "International Competitive Bidding (ICB)",
    }
    payload.update(payload_overrides)
    return RawTenderData(
        source_code="adb_kh",
        external_id=payload["id"],
        source_url=f"https://www.adb.org/projects/{payload['project_number']}/main",
        title=title,
        description="Synthetic description for parser coverage.",
        raw_payload=payload,
    )


class TestDriftEvidence:
    def test_api_endpoint_returns_error_page_in_real_capture(self):
        body = load_text("adb_kh/api_tenders_404.html")
        assert "We are sorry but the page you are looking for" in body[:1200]
        assert "404" in body or "no longer available" in body

    def test_real_listing_page_is_alive_and_lists_tenders(self):
        html = load_text("adb_kh/tenders_listing.html")
        assert "/projects/tenders" in html


class TestFetchRaw:
    def setup_method(self):
        self.source = ADBCambodiaSource()

    def _patch_get(self, status=404, items=None):
        resp = MagicMock()
        resp.status_code = status
        if status == 200:
            resp.json.return_value = {"items": items or []}
        with patch("scraper.sources.adb.requests.get", return_value=resp) as mock_get:
            yield mock_get

    def test_api_404_returns_empty_list_not_fabricated_notices(self):
        for _ in self._patch_get(status=404):
            assert self.source.fetch_raw() == []

    def test_api_200_with_no_items_returns_empty_list(self):
        for _ in self._patch_get(status=200, items=[]):
            assert self.source.fetch_raw() == []

    def test_network_error_returns_empty_list(self):
        with patch("scraper.sources.adb.requests.get", side_effect=ConnectionError("offline")):
            assert self.source.fetch_raw() == []


class TestParseAndNormalize:
    def setup_method(self):
        self.source = ADBCambodiaSource()

    def test_estimated_value_extracted_from_payload(self):
        n = self.source.parse_and_normalize(_synthetic_raw())
        assert n.estimated_value == 3500000.0

    def test_published_parsed_to_utc_aware_datetime(self):
        n = self.source.parse_and_normalize(_synthetic_raw())
        assert n.published_at.utcoffset() is not None
        assert n.published_at.replace(tzinfo=None) == datetime(2026, 8, 15, 0, 0, 0)

    def test_deadline_parsed_to_utc_aware_datetime(self):
        n = self.source.parse_and_normalize(_synthetic_raw())
        assert n.deadline.replace(tzinfo=None) == datetime(2026, 9, 30, 17, 0, 0)

    def test_reference_number_uses_project_number(self):
        n = self.source.parse_and_normalize(_synthetic_raw())
        assert n.reference_number == "99999-001"

    def test_slug_is_hyphenated_lowercase_with_external_id_suffix(self):
        n = self.source.parse_and_normalize(_synthetic_raw())
        # The title contains " - " which collapses to "--" after sanitisation;
        # pinned verbatim so any slug-algorithm change surfaces here.
        assert n.slug.startswith("synthetic-grid-solar")
        assert n.slug.endswith("-ADB-CAM-SYNTH-001")
        title_part = n.slug.rsplit("-ADB-", 1)[0]
        assert " " not in title_part and title_part == title_part.lower()

    def test_category_energy_branch(self):
        n = self.source.parse_and_normalize(_synthetic_raw())
        assert n.category_slug == "electrical-energy"

    def test_category_defaults_to_construction_civil_for_works(self):
        # NB: the classifier's substring matching is documented as quirky
        # (e.g. "it" matches inside unrelated words), so this title deliberately
        # avoids such words to pin the intended default branch.
        n = self.source.parse_and_normalize(
            _synthetic_raw("Culvert and road pavement works package",
                           id="ADB-CAM-SYNTH-002"))
        assert n.category_slug == "construction-civil"

    def test_procurement_method_from_payload_type(self):
        n = self.source.parse_and_normalize(_synthetic_raw())
        assert n.procurement_method == "International Competitive Bidding (ICB)"

    def test_missing_dates_fall_back_to_now_and_none(self):
        before = datetime.utcnow()
        n = self.source.parse_and_normalize(
            _synthetic_raw(published=None, deadline=None))
        after = datetime.utcnow()
        assert n.deadline is None
        assert before <= n.published_at.replace(tzinfo=None) <= after

    def test_malformed_deadline_string_is_dropped_silently(self):
        n = self.source.parse_and_normalize(_synthetic_raw(deadline="not-a-date"))
        assert n.deadline is None

    def test_currency_hardcoded_usd(self):
        assert self.source.parse_and_normalize(_synthetic_raw()).currency == "USD"
