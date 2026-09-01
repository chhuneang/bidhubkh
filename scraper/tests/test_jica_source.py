from datetime import datetime, timezone
import pytest

from scraper.sources.base import RawTenderData
from scraper.sources.jica import JICACambodiaSource


@pytest.fixture
def jica_source():
    return JICACambodiaSource()


def test_jica_source_metadata(jica_source):
    assert jica_source.code == "jica_kh"
    assert "JICA" in jica_source.name
    assert "jica.go.jp" in jica_source.website_url


def test_jica_parse_and_normalize(jica_source):
    raw = RawTenderData(
        source_code="jica_kh",
        external_id="JICA-KH-2026-P01",
        source_url="https://www.jica.go.jp/cambodia/english/procurement/notice_01.html",
        title="Phnom Penh Flood Protection and Drainage Improvement Phase V",
        description="Procurement of civil works, pumping stations, and drainage canals in Phnom Penh.",
        raw_payload={
            "id": "JICA-KH-2026-P01",
            "title": "Phnom Penh Flood Protection and Drainage Improvement Phase V",
            "published": "2026-08-15T00:00:00+00:00",
            "deadline": "2026-11-30T00:00:00+00:00",
            "budget": 28000000,
            "currency": "USD",
            "products_services": ["Pumping Station Equipment", "Drainage Concrete Pipes", "Excavation Works"],
            "requirements": ["JICA ODA Eligibility", "ISO 14001 Environmental Standard"]
        }
    )

    norm = jica_source.parse_and_normalize(raw)

    assert norm.source_code == "jica_kh"
    assert norm.external_id == "JICA-KH-2026-P01"
    assert "flood-protection" in norm.slug
    assert norm.organization_slug == "jica-cambodia"
    assert "JICA" in norm.organization_name
    assert norm.category_slug == "agriculture-water" or norm.category_slug == "construction-civil"
    assert norm.estimated_value == 28000000
    assert norm.currency == "USD"
    assert norm.confidence_score >= 95
    assert len(norm.products_services) == 3


def test_jica_fetch_raw_returns_list(jica_source):
    items = jica_source.fetch_raw()
    assert isinstance(items, list)
