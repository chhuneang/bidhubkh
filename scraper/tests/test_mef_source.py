"""Tests for scraper/sources/mef.py.

Fixture:
- live_endpoint_evidence.txt: REAL probe results captured 2026-08-23 — the GDPP
  portal's DNS does not resolve and www.mef.gov.kh blocks non-browser clients,
  so the scrape branch can rarely run. The adapter's former
  `_get_active_ministry_tenders()` fallback (four invented ministry tenders that
  reached production) was removed; failures must yield [].

The scrape-success path below uses a tiny SYNTHETIC HTML snippet to exercise the
selector loop — it is markup shaped like the selectors expect, not a capture of
any real MEF page.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from conftest import load_text

from scraper.sources.base import RawTenderData
from scraper.sources.mef import MEFSource

SYNTHETIC_PORTAL_HTML = """
<html><body><table>
  <tr class="table-row">
    <td><a class="title" href="/notices/example-1">Synthetic ministry notice one</a></td>
  </tr>
  <tr class="table-row">
    <td><a class="title" href="https://gdpp.mef.gov.kh/notices/example-2">Synthetic ministry notice two</a></td>
  </tr>
</table></body></html>
"""


def _mock_response(status=200, html=""):
    resp = MagicMock()
    resp.status_code = status
    resp.text = html
    return resp


class TestDriftEvidence:
    def test_probe_documents_dns_and_cloudflare_blocks(self):
        body = load_text("mef_gdipp/live_endpoint_evidence.txt")
        assert "Could not resolve host" in body
        assert "403" in body


class TestFetchRaw:
    def setup_method(self):
        self.source = MEFSource()

    def test_unreachable_portal_returns_empty_list_not_curated_tenders(self):
        with patch("scraper.sources.mef.requests.get",
                   side_effect=Exception("Could not resolve host: gdpp.mef.gov.kh")):
            assert self.source.fetch_raw() == []

    def test_portal_403_returns_empty_list(self):
        with patch("scraper.sources.mef.requests.get", return_value=_mock_response(403)):
            assert self.source.fetch_raw() == []

    def test_scrape_parses_synthetic_rows_with_relative_link_resolution(self):
        with patch("scraper.sources.mef.requests.get",
                   return_value=_mock_response(200, SYNTHETIC_PORTAL_HTML)):
            items = self.source.fetch_raw()
        assert [i.title for i in items] == [
            "Synthetic ministry notice one",
            "Synthetic ministry notice two",
        ]
        # Relative hrefs resolve against the portal base; absolute pass through.
        assert items[0].source_url == "https://gdpp.mef.gov.kh/notices/example-1"
        assert items[1].source_url == "https://gdpp.mef.gov.kh/notices/example-2"
        assert items[0].external_id == "MEF-KH-2026-1001"

    def test_rows_without_any_title_element_are_skipped(self):
        html = '<table><tr class="table-row"><td>no title elem here</td></tr></table>'
        with patch("scraper.sources.mef.requests.get", return_value=_mock_response(200, html)):
            items = self.source.fetch_raw()
        assert len(items) == 1  # generic "MEF Public Procurement Notice N" title
        assert items[0].title.startswith("MEF Public Procurement Notice")


class TestParseAndNormalize:
    def setup_method(self):
        self.source = MEFSource()

    def _synthetic(self, **payload_extra):
        payload = {"title": "Synthetic notice", "url": "https://gdpp.mef.gov.kh/notices/x", "index": 0}
        payload.update(payload_extra)
        return RawTenderData(
            source_code="mef_gdipp",
            external_id="MEF-KH-2026-1001",
            source_url=payload["url"],
            title=payload["title"],
            description="Synthetic description.",
            raw_payload=payload,
        )

    def test_no_deadline_key_means_no_invented_deadline(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.deadline is None

    def test_payload_deadline_parsed_when_present(self):
        n = self.source.parse_and_normalize(
            self._synthetic(deadline="2026-10-01T09:00:00+00:00"))
        assert n.deadline is not None
        assert n.deadline.utcoffset() == timezone.utc.utcoffset(None)
        assert n.deadline.replace(tzinfo=None) == datetime(2026, 10, 1, 9, 0)

    def test_malformed_deadline_is_dropped_not_faked(self):
        n = self.source.parse_and_normalize(self._synthetic(deadline="soon"))
        assert n.deadline is None

    def test_published_defaults_to_now_without_backdating(self):
        before = datetime.utcnow()
        n = self.source.parse_and_normalize(self._synthetic())
        after = datetime.utcnow()
        assert before <= n.published_at.replace(tzinfo=None) <= after

    def test_reference_number_from_ref_key_else_external_id(self):
        n = self.source.parse_and_normalize(self._synthetic(ref="SYN/2026/G-001"))
        assert n.reference_number == "SYN/2026/G-001"
        n2 = self.source.parse_and_normalize(self._synthetic())
        assert n2.reference_number == "MEF-KH-2026-1001"

    def test_slug_format(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.slug == "synthetic-notice-mef-kh-2026-1001"

    def test_organization_and_category_defaults(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.organization_slug == "mef"
        assert n.category_slug == "consulting-services"

    def test_category_from_payload_when_provided(self):
        n = self.source.parse_and_normalize(self._synthetic(category="it-telecom"))
        assert n.category_slug == "it-telecom"
