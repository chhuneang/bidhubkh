"""Tests for scraper/sources/state_utilities.py.

Fixtures captured 2026-08-23 (all HTTP 200, real pages):
- edc_procurement_list.html + edc_notice_detail_830.html: live EDC procurement
  pages — the listing IS server-rendered, so fetch_raw() now scrapes it for real.
- ppwsa_bidding_en.html: live PPWSA bidding page (parser not yet implemented;
  documented, not faked).

The adapter's former hardcoded `sample_notices` (two invented EDC/PPWSA awards
with deadlines computed off the clock) were removed on 2026-08-23 after live
checks showed their URLs are EDC error pages. Any scrape failure yields [].
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from conftest import load_text

from scraper.sources.base import RawTenderData
from scraper.sources.state_utilities import StateUtilitiesSource


def _mock_response(status=200, html=""):
    resp = MagicMock()
    resp.status_code = status
    resp.text = html
    return resp


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


class TestFetchRaw:
    def setup_method(self):
        self.source = StateUtilitiesSource()

    def test_scrapes_real_captured_edc_listing(self):
        html = load_text("state_utilities/edc_procurement_list.html")
        with patch("scraper.sources.state_utilities.requests.get",
                   return_value=_mock_response(200, html)):
            items = self.source.fetch_raw()
        assert len(items) > 0
        # Every item traces to a real detail URL from the captured page...
        assert all("/procurement_page/detail/" in i.source_url for i in items)
        # ...and carries no fabricated fixed ids.
        assert all(i.external_id.startswith("EDC-KH-DETAIL-") for i in items)
        # Titles are the on-page <h3.procure-title> texts (Khmer included).
        assert all(i.title.strip() for i in items)

    def test_no_duplicate_urls_in_scrape_output(self):
        html = load_text("state_utilities/edc_procurement_list.html")
        with patch("scraper.sources.state_utilities.requests.get",
                   return_value=_mock_response(200, html)):
            items = self.source.fetch_raw()
        urls = [i.source_url for i in items]
        assert len(urls) == len(set(urls))

    def test_network_error_returns_empty_list_not_samples(self):
        with patch("scraper.sources.state_utilities.requests.get",
                   side_effect=ConnectionError("offline")):
            assert self.source.fetch_raw() == []

    def test_error_page_status_returns_empty_list(self):
        with patch("scraper.sources.state_utilities.requests.get",
                   return_value=_mock_response(200, "<html><body>error</body></html>")):
            assert self.source.fetch_raw() == []


class TestParseAndNormalize:
    def setup_method(self):
        self.source = StateUtilitiesSource()

    def _synthetic(self, title="Synthetic transformer supply notice", url=None, **payload_extra):
        payload = {
            "id": "EDC-KH-DETAIL-999",
            "title": title,
            "url": url or "https://www.edc.com.kh/procurement_page/detail/999",
        }
        payload.update(payload_extra)
        return RawTenderData(
            source_code="state_utilities",
            external_id=payload["id"],
            source_url=payload["url"],
            title=title,
            description=None,
            raw_payload=payload,
        )

    def test_golden_slug_format(self):
        n = self.source.parse_and_normalize(
            self._synthetic(title="EDC/NCB/2026/G-001 - Cable Supply"))
        # slug = "util-kh-" + sanitized title[:60] + "-" + external_id[-6:]
        assert n.slug.endswith("-il-999")
        assert n.slug.startswith("util-kh-edcncb2026g-001---cable-supply")

    def test_deadline_none_when_payload_has_no_dates(self):
        # Scraped EDC cards expose no machine-readable deadline; none is invented.
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.deadline is None
        assert n.estimated_value is None

    def test_malformed_deadline_is_dropped_not_faked(self):
        n = self.source.parse_and_normalize(self._synthetic(deadline="next Tuesday"))
        assert n.deadline is None

    def test_published_defaults_to_now(self):
        before = datetime.now(timezone.utc)
        n = self.source.parse_and_normalize(self._synthetic())
        after = datetime.now(timezone.utc)
        assert before <= n.published_at <= after

    def test_organization_slug_follows_source_url(self):
        edc = self.source.parse_and_normalize(self._synthetic())
        assert edc.organization_slug == "edc"
        ppwsa = self.source.parse_and_normalize(
            self._synthetic(title="Water main works", url="https://www.ppwsa.com.kh/t/1"))
        assert ppwsa.organization_slug == "ppwsa"

    def test_category_branches(self):
        energy = self.source.parse_and_normalize(
            self._synthetic(title="Transformer and cable supply"))
        water = self.source.parse_and_normalize(
            self._synthetic(title="Ductile iron pipe delivery", url="https://www.ppwsa.com.kh/t/2"))
        other = self.source.parse_and_normalize(
            self._synthetic(title="Headquarters renovation"))
        assert energy.category_slug == "electrical-energy"
        assert water.category_slug == "agriculture-water"
        assert other.category_slug == "construction-civil"

    def test_products_and_requirements_default_empty(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.products_services == []
        assert n.requirements == []

    def test_currency_defaults_usd(self):
        assert self.source.parse_and_normalize(self._synthetic()).currency == "USD"
