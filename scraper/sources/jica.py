"""
BidHubKH — Source #7: Japan International Cooperation Agency (JICA) Cambodia
Collects official procurement notices, ODA loan bidding opportunities, and
infrastructure tenders funded by JICA in Cambodia.
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


class JICACambodiaSource(BaseSource):
    """
    Official JICA Cambodia Procurement & ODA Assistance Ingestion Adapter.
    Website: https://www.jica.go.jp/english/our_work/types_of_assistance/oda_loans/oda_op_info/cambodia/index.html
    """
    PORTAL_URL = "https://www.jica.go.jp/english/our_work/types_of_assistance/oda_loans/oda_op_info/cambodia/index.html"

    def __init__(self):
        super().__init__(
            code="jica_kh",
            name="Japan International Cooperation Agency (JICA) Cambodia",
            website_url=self.PORTAL_URL
        )
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 BidHubKH/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,ja;q=0.8"
        }

    def fetch_raw(self) -> List[RawTenderData]:
        raw_items: List[RawTenderData] = []
        try:
            resp = requests.get(self.PORTAL_URL, headers=self.headers, timeout=20)
            if resp.status_code == 200 and BeautifulSoup:
                soup = BeautifulSoup(resp.text, "html.parser")
                rows = soup.select("table tr, .news-list li, .notice-item")
                for idx, row in enumerate(rows):
                    link_elem = row.select_one("a")
                    if not link_elem:
                        continue
                    title = link_elem.get_text(strip=True)
                    if len(title) < 10 or not any(k in title.lower() for k in ["project", "loan", "procurement", "contract", "notice", "cambodia"]):
                        continue
                    href_val = link_elem.get("href")
                    href = str(href_val) if href_val else ""
                    if href and not href.startswith("http"):
                        href = f"https://www.jica.go.jp{href}" if href.startswith("/") else f"https://www.jica.go.jp/english/our_work/types_of_assistance/oda_loans/oda_op_info/cambodia/{href}"
                    
                    ext_id = f"JICA-KH-ODA-{idx+101}"
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
            print(f"[JICACambodiaSource] Portal query note: {e}")

        if not raw_items:
            print("[JICACambodiaSource] No dynamic notices parsed from JICA portal this run.")
        return raw_items

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        title = raw.title.strip()
        desc = raw.description or ""
        external_id = raw.external_id

        # Clean title & slug
        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug_prefix = re.sub(r'[\s]+', '-', clean_title.strip())[:80]
        slug = f"jica-kh-{slug_prefix}-{external_id.lower()[-6:]}"

        # Deadline & Published Date
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
        if any(k in title_lower for k in ["water", "flood", "drainage", "sewer", "irrigation"]):
            cat_slug = "agriculture-water"
        elif any(k in title_lower for k in ["road", "bridge", "port", "civil", "construction"]):
            cat_slug = "construction-civil"
        elif any(k in title_lower for k in ["power", "transmission", "substation", "energy", "solar"]):
            cat_slug = "electrical-energy"
        elif any(k in title_lower for k in ["telecom", "digital", "ict", "software"]):
            cat_slug = "it-telecom"
        elif any(k in title_lower for k in ["hospital", "health", "medical", "equipment"]):
            cat_slug = "medical-healthcare"
        else:
            cat_slug = "consulting-services"

        return NormalizedTenderData(
            source_code=self.code,
            external_id=external_id,
            title=title,
            slug=slug,
            description=desc,
            summary=desc[:240] + "..." if len(desc) > 240 else desc,
            organization_slug="jica-cambodia",
            organization_name="Japan International Cooperation Agency (JICA) Cambodia Office",
            category_slug=cat_slug,
            location="Phnom Penh & Provinces, Cambodia",
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("budget"),
            currency=payload.get("currency", "USD"),
            procurement_method="JICA Official Development Assistance (ODA) Loan Procurement",
            eligibility="Eligible international and Cambodian joint-venture contractors compliant with JICA Procurement Guidelines.",
            products_services=payload.get("products_services", []),
            requirements=payload.get("requirements", []),
            original_url=raw.source_url,
            confidence_score=96
        )
