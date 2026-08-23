import re
from datetime import datetime
from typing import List

import requests

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class ADBCambodiaSource(BaseSource):
    """
    Asian Development Bank (ADB) Official Procurement Adapter for Cambodia.
    Source: https://www.adb.org/projects/tenders/country/cam
    """
    API_URL = "https://www.adb.org/api/tenders"

    def __init__(self):
        super().__init__(
            code="adb_kh",
            name="Asian Development Bank (ADB) Cambodia",
            website_url="https://www.adb.org/projects/tenders/country/cam"
        )

    def fetch_raw(self) -> List[RawTenderData]:
        # ADB Cambodia public tenders feed
        params = {
            "country": "CAM",
            "type": "all",
            "page": 0
        }
        
        headers = {
            "User-Agent": "BidHubKH-TenderIntelligence/1.0 (info@bidhubkh.com)",
            "Accept": "application/json"
        }

        try:
            response = requests.get(self.API_URL, params=params, headers=headers, timeout=20)
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", []) or data.get("results", [])
                raw_items = []
                for item in items:
                    ext_id = item.get("id") or item.get("tender_id") or str(len(raw_items) + 1)
                    title = item.get("title") or item.get("project_title") or "ADB Tender Notice"
                    url = item.get("url") or f"https://www.adb.org/projects/tenders/{ext_id}"
                    
                    raw_items.append(RawTenderData(
                        source_code=self.code,
                        external_id=str(ext_id),
                        source_url=url,
                        title=title,
                        description=item.get("summary") or item.get("description"),
                        raw_payload=item
                    ))
                if raw_items:
                    return raw_items
        except Exception as e:
            print(f"[ADBSource] API query note: {e}")

        # No fabricated fallbacks: ADB's tender listing is JS-rendered and its
        # legacy /api/tenders path is gone (see tests/fixtures/adb_kh/), so when
        # the API yields nothing we return an honest empty list rather than
        # simulated notices.
        print("[ADBSource] No server-rendered ADB notices available this run.")
        return []

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload

        pub_str = payload.get("published")
        published_at = datetime.utcnow()
        if pub_str:
            try:
                published_at = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
            except Exception:
                pass

        deadline_str = payload.get("deadline")
        deadline = None
        if deadline_str:
            try:
                deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            except Exception:
                pass

        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', raw.title).strip().lower()
        slug = re.sub(r'[\s]+', '-', clean_title)[:200] + f"-{raw.external_id}"

        # Category mapping
        category_slug = "construction-civil"
        title_lower = raw.title.lower()
        if any(w in title_lower for w in ["energy", "solar", "power", "grid", "electrical"]):
            category_slug = "electrical-energy"
        elif any(w in title_lower for w in ["it", "computer", "software", "digital"]):
            category_slug = "it-telecom"
        elif any(w in title_lower for w in ["consulting", "study", "advisory", "audit"]):
            category_slug = "consulting-services"

        return NormalizedTenderData(
            source_code=self.code,
            external_id=raw.external_id,
            reference_number=payload.get("project_number") or f"ADB/CAM/{raw.external_id}",
            title=raw.title,
            slug=slug,
            summary=raw.description,
            description=raw.description,
            organization_slug="adb-cambodia",
            organization_name="Asian Development Bank Cambodia Resident Mission",
            category_slug=category_slug,
            location="Cambodia",
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("estimated_value"),
            currency="USD",
            procurement_method=payload.get("procurement_type") or "International Competitive Bidding",
            eligibility="Eligible contractors from ADB member countries complying with ADB Procurement Guidelines.",
            original_url=raw.source_url,
            confidence_score=96
        )
