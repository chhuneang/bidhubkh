from datetime import datetime, timezone
import pytest

from scraper.sources.base import RawTenderData
from scraper.sources.afd_eu import AFDEUSource


@pytest.fixture
def afd_eu_source():
    return AFDEUSource()


def test_afd_eu_source_metadata(afd_eu_source):
    assert afd_eu_source.code == "afd_eu_kh"
    assert "AFD" in afd_eu_source.name or "European Union" in afd_eu_source.name
    assert "afd.fr" in afd_eu_source.website_url


def test_afd_eu_parse_and_normalize(afd_eu_source):
    raw = RawTenderData(
        source_code="afd_eu_kh",
        external_id="AFD-KH-2026-N09",
        source_url="https://www.afd.fr/en/procurement/cambodia-clean-water-expansion",
        title="Bakheng Water Treatment Plant Phase 3 Distribution Network",
        description="Construction of 120km clean water pipeline and booster pumping station in Phnom Penh suburbs.",
        raw_payload={
            "id": "AFD-KH-2026-N09",
            "title": "Bakheng Water Treatment Plant Phase 3 Distribution Network",
            "published": "2026-08-20T00:00:00+00:00",
            "deadline": "2026-11-15T00:00:00+00:00",
            "budget": 45000000,
            "currency": "EUR",
            "products_services": ["Ductile Iron Pipes", "Pumping Stations", "Civil Engineering"],
            "requirements": ["EU/AFD Compliance", "ISO 9001 Certification"]
        }
    )

    norm = afd_eu_source.parse_and_normalize(raw)

    assert norm.source_code == "afd_eu_kh"
    assert norm.external_id == "AFD-KH-2026-N09"
    assert "bakheng-water" in norm.slug
    assert norm.organization_slug in ["afd-cambodia", "eu-delegation-cambodia"]
    assert norm.category_slug == "agriculture-water"
    assert norm.estimated_value == 45000000
    assert norm.currency == "EUR"
    assert norm.confidence_score >= 95
    assert len(norm.products_services) == 3


def test_afd_eu_fetch_raw_returns_list(afd_eu_source):
    items = afd_eu_source.fetch_raw()
    assert isinstance(items, list)
