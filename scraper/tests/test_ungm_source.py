"""Tests for scraper/sources/ungm.py.

Fixtures (drift evidence, captured 2026-08-23):
- api_probe_evidence.txt: REAL probe results — every anonymous UNGM JSON API
  path redirects to /API/GenericError.
- public_notice_spa_shell.html: the public notice page is an Angular SPA shell.

The adapter's former hardcoded `sample_notices` (three invented UN notices that
reached production) were removed on 2026-08-23; fetch_raw() probes the public
endpoint each run and returns [] when nothing server-rendered comes back.
"""

from datetime import datetime
from unittest.mock import MagicMock, patch

from conftest import load_text

from scraper.sources.base import RawTenderData
from scraper.sources.ungm import UNGMCambodiaSource

SYNTHETIC_API_PAYLOAD = {
    "_note": "synthetic shape fixture for parser coverage only",
    "data": [
        {"id": "111", "title": "Synthetic RFP for water testing kits",
         "url": "https://www.ungm.org/Public/Notice/111"},
        {"id": "112", "title": "Synthetic ITB for solar equipment",
         "url": None},
    ],
}


def _mock_response(status=200, json_body=None):
    resp = MagicMock()
    resp.status_code = status
    if json_body is not None:
        resp.json.return_value = json_body
    return resp


class TestDriftEvidence:
    def test_probe_documents_generic_error_redirects(self):
        body = load_text("ungm/api_probe_evidence.txt")
        assert "/API/GenericError" in body

    def test_public_notice_page_ships_no_server_rendered_notices(self):
        html = load_text("ungm/public_notice_spa_shell.html")
        # Content is assembled client-side from script bundles; the served
        # markup itself carries no notice identifiers at all.
        assert "/bundles/ungmcommon" in html
        assert "UNGM-" not in html


class TestFetchRaw:
    def setup_method(self):
        self.source = UNGMCambodiaSource()

    def test_api_redirect_status_returns_empty_list_not_samples(self):
        with patch("scraper.sources.ungm.requests.get", return_value=_mock_response(302)):
            assert self.source.fetch_raw() == []

    def test_network_error_returns_empty_list(self):
        with patch("scraper.sources.ungm.requests.get",
                   side_effect=ConnectionError("offline")):
            assert self.source.fetch_raw() == []

    def test_parses_rows_when_api_ever_returns_data(self):
        payload = {k: v for k, v in SYNTHETIC_API_PAYLOAD.items()}
        payload.pop("_note")
        with patch("scraper.sources.ungm.requests.get",
                   return_value=_mock_response(200, payload)):
            items = self.source.fetch_raw()
        assert [i.external_id for i in items] == ["UNGM-111", "UNGM-112"]
        # Missing url falls back to the canonical notice path.
        assert items[1].source_url == "https://www.ungm.org/Public/Notice/112"


class TestParseAndNormalize:
    def setup_method(self):
        self.source = UNGMCambodiaSource()

    def _synthetic(self, title="Synthetic RFP for laboratory equipment", **payload_extra):
        payload = {
            "id": "UNGM-SYNTH-1",
            "title": title,
            "published": "2026-08-18T10:00:00+00:00",
        }
        payload.update(payload_extra)
        return RawTenderData(
            source_code="ungm",
            external_id=payload["id"],
            source_url="https://www.ungm.org/Public/Notice/SYNTH-1",
            title=title,
            description=None,
            raw_payload=payload,
        )

    def test_published_parsed_from_payload(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.published_at.replace(tzinfo=None) == datetime(2026, 8, 18, 10, 0)

    def test_no_deadline_key_means_no_invented_deadline(self):
        assert self.source.parse_and_normalize(self._synthetic()).deadline is None

    def test_malformed_deadline_is_dropped_not_faked(self):
        n = self.source.parse_and_normalize(self._synthetic(deadline="whenever"))
        assert n.deadline is None

    def test_category_energy_branch(self):
        n = self.source.parse_and_normalize(
            self._synthetic(title="Solar mini-grid supply and installation"))
        assert n.category_slug == "electrical-energy"

    def test_category_health_branch(self):
        n = self.source.parse_and_normalize(
            self._synthetic(title="Nutrition kits and medical scales LTA"))
        assert n.category_slug == "medical-healthcare"

    def test_category_it_branch_and_default(self):
        it = self.source.parse_and_normalize(
            self._synthetic(title="Digital system modernization consultancy"))
        default = self.source.parse_and_normalize(
            self._synthetic(title="Framework evaluation services"))
        assert it.category_slug == "it-telecom"
        assert default.category_slug == "consulting-services"

    def test_slug_format(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.slug.startswith("ungm-kh-synthetic-rfp-for-laboratory-eq")
        assert n.slug.endswith("-ynth-1")

    def test_products_and_requirements_default_empty(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.products_services == []
        assert n.requirements == []
