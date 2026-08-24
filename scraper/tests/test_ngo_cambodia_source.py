"""Tests for scraper/sources/ngo_cambodia.py (ReliefWeb v2 adapter).

Fixtures:
- reliefweb_api_403_appname_required.json: REAL 403 body captured 2026-08-23 —
  ReliefWeb rejects unregistered appnames.
- reliefweb_v2_shape_fixture.json: SYNTHETIC envelope in the documented v2
  response shape, used to exercise the parser offline (no approved appname yet,
  so a live capture is not possible).

The adapter must NEVER emit fabricated notices: any API failure yields [].
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from conftest import load_json, load_text

from scraper.sources.base import RawTenderData
from scraper.sources.ngo_cambodia import NGOCambodiaSource

SHAPE = "ngo_cambodia/reliefweb_v2_shape_fixture.json"
EVIDENCE_403 = "ngo_cambodia/reliefweb_api_403_appname_required.json"


def _mock_response(status=200, json_body=None):
    resp = MagicMock()
    resp.status_code = status
    if json_body is not None:
        resp.json.return_value = json_body
    return resp


class TestDriftEvidence:
    def test_real_403_documents_appname_requirement(self):
        body = load_text(EVIDENCE_403)
        assert "appname" in body.lower()

    def test_shape_fixture_is_labelled_synthetic(self):
        raw = load_json(SHAPE)
        assert "SYNTHETIC" in raw["_comment"]


class TestFetchRaw:
    def setup_method(self):
        self.source = NGOCambodiaSource()

    def test_posts_to_v2_endpoint_with_appname_and_khm_filter(self):
        with patch("scraper.sources.ngo_cambodia.requests.post",
                   return_value=_mock_response(200, {"data": []})) as mock_post:
            self.source.fetch_raw()
        url = mock_post.call_args.args[0]
        assert url.startswith("https://api.reliefweb.int/v2/jobs?appname=")
        body = mock_post.call_args.kwargs["json"]
        conditions = body["filter"]["conditions"]
        assert {"field": "country.iso3", "value": ["KHM"]} in conditions

    def test_parses_documented_v2_envelope(self):
        payload = load_json(SHAPE)
        payload.pop("_comment")
        with patch("scraper.sources.ngo_cambodia.requests.post",
                   return_value=_mock_response(200, payload)):
            items = self.source.fetch_raw()
        assert [i.external_id for i in items] == ["NGO-KH-RW-424242", "NGO-KH-RW-424243"]
        assert items[0].title.startswith("Invitation to Bid")
        assert items[0].source_url.endswith("invitation-bid-supply-and-delivery-school-furniture")
        assert items[0].raw_payload["published"] == "2026-08-20T09:30:00+00:00"

    def test_unapproved_appname_403_returns_empty_list(self):
        # The documented reality until RELIEFWEB_APPNAME is registered.
        with patch("scraper.sources.ngo_cambodia.requests.post",
                   return_value=_mock_response(403)):
            assert self.source.fetch_raw() == []

    def test_network_error_returns_empty_list(self):
        with patch("scraper.sources.ngo_cambodia.requests.post",
                   side_effect=ConnectionError("offline")):
            assert self.source.fetch_raw() == []

    def test_rows_missing_id_or_title_are_skipped(self):
        payload = load_json(SHAPE)
        payload.pop("_comment")
        payload["data"].append({"id": 99, "fields": {"id": 99, "title": ""}})
        with patch("scraper.sources.ngo_cambodia.requests.post",
                   return_value=_mock_response(200, payload)):
            items = self.source.fetch_raw()
        assert len(items) == 2


class TestParseAndNormalize:
    def setup_method(self):
        self.source = NGOCambodiaSource()

    def _synthetic(self, title="Invitation for Bids: Borehole Drilling Works", **payload_extra):
        payload = {
            "id": "NGO-KH-RW-1",
            "title": title,
            "url": "https://reliefweb.int/job/1",
            "published": "2026-08-20T09:30:00+00:00",
            "source": "example-ngo",
        }
        payload.update(payload_extra)
        return RawTenderData(
            source_code="ngo_cambodia",
            external_id=payload["id"],
            source_url=payload["url"],
            title=title,
            description=None,
            raw_payload=payload,
        )

    def test_published_parsed_to_utc_datetime(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.published_at.utcoffset() == timezone.utc.utcoffset(None)
        assert n.published_at.replace(tzinfo=None) == datetime(2026, 8, 20, 9, 30)

    def test_no_deadline_key_means_no_invented_deadline(self):
        assert self.source.parse_and_normalize(self._synthetic()).deadline is None

    def test_malformed_deadline_is_dropped_not_faked(self):
        n = self.source.parse_and_normalize(self._synthetic(deadline="next Friday"))
        assert n.deadline is None

    def test_category_water_branch(self):
        n = self.source.parse_and_normalize(
            self._synthetic(title="ITB: Drilling of Boreholes with Solar Pumps"))
        assert n.category_slug == "agriculture-water"

    def test_category_education_branch(self):
        n = self.source.parse_and_normalize(
            self._synthetic(title="RFQ: STEM Learning Kits Distribution"))
        assert n.category_slug == "education-training"

    def test_category_defaults_to_consulting_services(self):
        n = self.source.parse_and_normalize(
            self._synthetic(title="Audit Services Framework"))
        assert n.category_slug == "consulting-services"

    def test_organization_slug_from_source_shortname(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.organization_slug == "wateraid-cambodia"

    def test_slug_format(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.slug.startswith("ngo-kh-invitation-for-bids-borehole-drilling-wor")
        assert n.slug.endswith("rw-1")

    def test_summary_truncation_boundary(self):
        long_desc = "x" * 300
        n = self.source.parse_and_normalize(
            RawTenderData(
                source_code="ngo_cambodia",
                external_id="NGO-KH-RW-2",
                source_url="u",
                title="t",
                description=long_desc,
                raw_payload={"id": "NGO-KH-RW-2", "title": "t"},
            ))
        assert len(n.summary) == 243 and n.summary.endswith("...")

    def test_products_and_requirements_default_empty(self):
        n = self.source.parse_and_normalize(self._synthetic())
        assert n.products_services == []
        assert n.requirements == []
