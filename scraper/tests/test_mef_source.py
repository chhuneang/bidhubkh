"""Fixture-based tests for scraper/sources/mef.py.

Fixture status (captured 2026-08-23, see mef_gdipp/live_endpoint_evidence.txt):
the GDPP portal host gdpp.mef.gov.kh does not resolve in DNS and www.mef.gov.kh
returns HTTP 403, so no real HTML page could be captured. fetch_raw_output_snapshot.json
is the adapter's ACTUAL runtime output — the curated _get_active_ministry_tenders()
fallback that production ingests today. It is NOT scraped HTML and is labelled as such.
"""

import re
from datetime import datetime, timedelta

from conftest import load_json, load_text, raw_items_from_snapshot

from scraper.sources.base import RawTenderData
from scraper.sources.mef import MEFSource

SNAPSHOT = "mef_gdipp/fetch_raw_output_snapshot.json"


def normalized_all():
    source = MEFSource()
    return [source.parse_and_normalize(r) for r in raw_items_from_snapshot(load_json(SNAPSHOT))]


class TestLivePortalEvidence:
    def test_dns_failure_documented(self):
        evidence = load_text("mef_gdipp/live_endpoint_evidence.txt")
        assert "Could not resolve host" in evidence

    def test_snapshot_is_the_fallback_path_output(self):
        # The live HTML branch yields nothing (host unreachable), so every item in
        # the snapshot must come from the curated ministry packages.
        snapshot = load_json(SNAPSHOT)
        ids = [i["external_id"] for i in snapshot["items"]]
        assert ids == [
            "MEF-GDPP-2026-NCB-014",
            "MPWT-RN5-2026-CW-028",
            "MOEYS-STEPCAM-2026-G-009",
            "MOH-HSSP2-2026-MED-045",
        ]


class TestParseAndNormalize:
    def setup_method(self):
        self.results = {n.external_id: n for n in normalized_all()}

    def test_all_titles_and_slugs_non_empty(self):
        for n in normalized_all():
            assert n.title.strip()
            assert n.slug.strip()

    def test_golden_slug_for_first_package(self):
        n = self.results["MEF-GDPP-2026-NCB-014"]
        assert n.slug == (
            "procurement-of-650-high-performance-workstations-and-network-infrastructure"
            "-for-national-tax-customs-modernization-mef-gdpp-2026-ncb-014"
        )

    def test_slug_has_no_spaces_or_special_characters(self):
        for n in normalized_all():
            assert not re.search(r"[^a-z0-9-]", n.slug)
            assert " " not in n.slug
            assert n.slug.endswith(n.external_id.lower())

    def test_reference_number_from_payload_ref(self):
        assert (
            self.results["MEF-GDPP-2026-NCB-014"].reference_number
            == "MEF/GDPP/NCB/2026/G-014"
        )

    def test_reference_number_falls_back_to_external_id(self):
        raw = raw_items_from_snapshot(load_json(SNAPSHOT))[0].model_copy(deep=True)
        raw.raw_payload.pop("ref", None)
        result = MEFSource().parse_and_normalize(raw)
        assert result.reference_number == "MEF-GDPP-2026-NCB-014"

    def test_estimated_value_from_budget_field_in_usd(self):
        assert self.results["MEF-GDPP-2026-NCB-014"].estimated_value == 480000.0
        assert self.results["MPWT-RN5-2026-CW-028"].estimated_value == 1250000.0
        assert all(n.currency == "USD" for n in normalized_all())

    def test_published_is_two_days_ago_and_deadline_honours_days_ahead(self):
        before = datetime.now() - timedelta(seconds=30)
        source = MEFSource()
        raw = raw_items_from_snapshot(load_json(SNAPSHOT))[0]
        result = source.parse_and_normalize(raw)
        after = datetime.now()

        # published_at = now - 2 days
        assert before - timedelta(days=2) <= result.published_at <= after - timedelta(days=2)

        # deadline = now + payload days_ahead (28 for this package)
        expected_low = before + timedelta(days=28)
        expected_high = after + timedelta(days=28)
        assert expected_low <= result.deadline <= expected_high

    def test_default_days_ahead_is_25_when_payload_lacks_it(self):
        raw = RawTenderData(
            source_code="mef_gdipp",
            external_id="MEF-KH-TEST-1",
            source_url="https://gdpp.mef.gov.kh/notices/mef-kh-test-1",
            title="Generic Ministry Notice",
            description="placeholder",
            raw_payload={},
        )
        before = datetime.now()
        result = MEFSource().parse_and_normalize(raw)
        after = datetime.now()
        assert before + timedelta(days=25) <= result.deadline <= after + timedelta(days=25)

    def test_empty_payload_uses_sensible_defaults(self):
        raw = RawTenderData(
            source_code="mef_gdipp",
            external_id="MEF-KH-TEST-2",
            source_url="https://gdpp.mef.gov.kh/notices/x",
            title="Another Notice",
            description="d",
            raw_payload={},
        )
        n = MEFSource().parse_and_normalize(raw)
        assert n.organization_name == "Ministry of Economy and Finance (MEF)"
        assert n.organization_slug == "mef-cambodia"
        assert n.category_slug == "consulting-services"
        assert n.location == "Cambodia"
        assert n.estimated_value is None

    def test_organization_and_category_passthrough(self):
        assert self.results["MPWT-RN5-2026-CW-028"].organization_slug == "mpwt-cambodia"
        assert (
            self.results["MPWT-RN5-2026-CW-028"].category_slug == "construction-civil"
        )
        assert self.results["MOH-HSSP2-2026-MED-045"].category_slug == "medical-healthcare"

    def test_constants_procurement_method_eligibility_confidence(self):
        for n in normalized_all():
            assert n.procurement_method == "National Competitive Bidding (NCB)"
            assert "Certificate of Tax Compliance" in n.eligibility
            assert n.confidence_score == 98
