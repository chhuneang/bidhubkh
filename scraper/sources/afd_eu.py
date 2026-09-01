"""
BidHubKH — Source #8: Agence Française de Développement (AFD) & European Union (EU) Cambodia
Collects bilateral development cooperation tenders, water infrastructure projects,
green energy initiatives, and vocational education grants in Cambodia.
"""

import re
from datetime import datetime, timezone
from typing import List

import requests

try:
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover
    BeautifulSoup = None  # type: ignore

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class AFDEUSource(BaseSource):
    """
    Official AFD (France) & European Union Cambodia Procurement Ingestion Adapter.
    Website: https://www.afd.fr/en/page-thematique-axe/procurement-notices
    """
    PORTAL_URL = "https://www.afd.fr/en/page-thematique-axe/procurement-notices"

    def __init__(self):
        super().__init__(
            code="afd_eu_kh",
            name="Agence Française de Développement (AFD) & European Union (EU) Cambodia",
            website_url=self.PORTAL_URL
        )
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 BidHubKH/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8"
        }

    def fetch_raw(self) -> List[RawTenderData]:
        raw_items: List[RawTenderData] = []
        try:
            resp = requests.get(
                self.PORTAL_URL,
                params={"country": "Cambodia"},
                headers=self.headers,
                timeout=20
            )
            if resp.status_code == 200 and BeautifulSoup:
                soup = BeautifulSoup(resp.text, "html.parser")
                rows = soup.select(".view-content .views-row, article.card, .node-teaser")
                for idx, row in enumerate(rows):
                    link_elem = row.select_one("a")
                    if not link_elem:
                        continue
                    title = link_elem.get_text(strip=True)
                    if len(title) < 10:
                        continue
                    href_val = link_elem.get("href")
                    href = str(href_val) if href_val else ""
                    if href and not href.startswith("http"):
                        href = f"https://www.afd.fr{href}"
                    
                    ext_id = f"AFD-KH-NOT-{idx+201}"
                    raw_items.append(
                        RawTenderData(
                            source_code=self.code,
                            external_id=ext_id,
                            source_url=href or self.PORTAL_URL,
                            title=title,
                            description=row.get_text(separator=" ", strip=True),
                            raw_payload={"id": ext_id, "title": title, "url": href}
                        )
                    )
        except Exception as e:
            print(f"[AFDEUSource] Portal query note: {e}")

        if not raw_items:
            print("[AFDEUSource] No dynamic notices parsed from AFD/EU portal this run.")
        return raw_items

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        title = raw.title.strip()
        desc = raw.description or ""
        external_id = raw.external_id

        # Clean title & slug
        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug_prefix = re.sub(r'[\s]+', '-', clean_title.strip())[:80]
        slug = f"afd-eu-kh-{slug_prefix}-{external_id.lower()[-6:]}"

        # Dates
        deadline = None
        if payload.get("deadline"):
            try:
                deadline = datetime.fromisoformat(str(payload["deadline"]).replace("Z", "+00:00"))
            except Exception:
                pass

        published_at = datetime.now(timezone.utc)
        if payload.get("published"):
            try:
                published_at = datetime.fromisoformat(str(payload["published"]).replace("Z", "+00:00"))
            except Exception:
                pass

        # Sector Mapping
        title_lower = title.lower()
        if any(k in title_lower for k in ["water", "bakheng", "sanitation", "sewage", "wastewater"]):
            cat_slug = "agriculture-water"
        elif any(k in title_lower for k in ["solar", "energy", "grid", "electrical", "power"]):
            cat_slug = "electrical-energy"
        elif any(k in title_lower for k in ["education", "vocational", "tvet", "training"]):
            cat_slug = "education-training"
        elif any(k in title_lower for k in ["road", "civil", "bridge", "infrastructure"]):
            cat_slug = "construction-civil"
        else:
            cat_slug = "consulting-services"

        # Organization Selection
        org_slug = "afd-cambodia"
        org_name = "Agence Française de Développement (AFD) Cambodia"
        if "eu" in title_lower or "european union" in title_lower:
            org_slug = "eu-delegation-cambodia"
            org_name = "Delegation of the European Union to the Kingdom of Cambodia"

        return NormalizedTenderData(
            source_code=self.code,
            external_id=external_id,
            title=title,
            slug=slug,
            description=desc,
            summary=desc[:240] + "..." if len(desc) > 240 else desc,
            organization_slug=org_slug,
            organization_name=org_name,
            category_slug=cat_slug,
            location="Phnom Penh & Siem Reap, Cambodia",
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("budget"),
            currency=payload.get("currency", "EUR"),
            procurement_method="AFD / European Union Development Cooperation Procurement",
            eligibility="Eligible international and Cambodian registered companies meeting AFD / EU Procurement Guidelines.",
            products_services=payload.get("products_services", []),
            requirements=payload.get("requirements", []),
            original_url=raw.source_url,
            confidence_score=96
        )
