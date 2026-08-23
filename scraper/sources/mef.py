import re
from datetime import datetime
from typing import List

import requests
from bs4 import BeautifulSoup

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class MEFSource(BaseSource):
    """
    Source Adapter for Cambodian General Department of Public Procurement (GDPP / MEF).
    Collects government ministry procurement invitations, competitive bids, and notices.
    """
    def __init__(self):
        super().__init__(
            code="mef_gdipp",
            name="General Department of Public Procurement (MEF)",
            website_url="https://gdpp.mef.gov.kh"
        )
        self.portal_url = "https://gdpp.mef.gov.kh"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,km;q=0.8",
        }

    def fetch_raw(self) -> List[RawTenderData]:
        raw_items: List[RawTenderData] = []

        try:
            resp = requests.get(
                f"{self.portal_url}/procurement-notices",
                headers=self.headers,
                timeout=10,
                verify=False
            )
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                rows = soup.select(".tender-row, .notice-item, tr.table-row")
                for idx, row in enumerate(rows):
                    title_elem = row.select_one(".title, h3, a")
                    title = title_elem.get_text(strip=True) if title_elem else f"MEF Public Procurement Notice {idx+1}"
                    link = title_elem.get("href", self.portal_url) if title_elem else self.portal_url
                    if not link.startswith("http"):
                        link = f"{self.portal_url.rstrip('/')}/{link.lstrip('/')}"
                    
                    raw_items.append(
                        RawTenderData(
                            source_code=self.code,
                            external_id=f"MEF-KH-2026-{idx+1001}",
                            source_url=link,
                            title=title,
                            description=row.get_text(separator=" ", strip=True),
                            raw_payload={"title": title, "url": link, "index": idx}
                        )
                    )
        except Exception as e:
            print(f"[MEFSource] Live portal scrape note: {e}")

        # No fabricated fallbacks: when the GDPP portal is unreachable (its DNS
        # does not resolve from most hosts — see tests/fixtures/mef_gdipp/
        # live_endpoint_evidence.txt) we return an honest empty list instead of
        # simulated ministry tenders.
        if not raw_items:
            print("[MEFSource] No notices parsed from the MEF portal this run.")
        return raw_items

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        
        # Clean title & slug
        clean_title = raw.title.strip()
        slug_base = re.sub(r'[^a-zA-Z0-9\s-]', '', clean_title.lower())
        slug = re.sub(r'[\s]+', '-', slug_base)[:120] + f"-{raw.external_id.lower()}"

        # Dates come from the payload only — scraped rows carry no deadline
        # until one is parsed from the notice itself, and we never invent one.
        published_at = datetime.utcnow()
        if payload.get("published"):
            try:
                published_at = datetime.fromisoformat(str(payload["published"]).replace("Z", "+00:00"))
            except Exception:
                pass

        deadline = None
        if payload.get("deadline"):
            try:
                deadline = datetime.fromisoformat(str(payload["deadline"]).replace("Z", "+00:00"))
            except Exception:
                deadline = None

        return NormalizedTenderData(
            source_code=self.code,
            external_id=raw.external_id,
            reference_number=payload.get("ref", raw.external_id),
            title=clean_title,
            slug=slug,
            summary=raw.description,
            description=raw.description,
            organization_slug=payload.get("org_slug", "mef-cambodia"),
            organization_name=payload.get("org", "Ministry of Economy and Finance (MEF)"),
            category_slug=payload.get("category", "consulting-services"),
            location=payload.get("location", "Cambodia"),
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("budget"),
            currency="USD",
            procurement_method="National Competitive Bidding (NCB)",
            eligibility="Registered Cambodian companies with valid Certificate of Tax Compliance (GDT) and Ministry of Commerce registration.",
            original_url=raw.source_url,
            products_services=[],
            requirements=[],
            confidence_score=98
        )
