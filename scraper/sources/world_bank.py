import re
from datetime import datetime
from typing import List

import requests

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class WorldBankCambodiaSource(BaseSource):
    """
    World Bank Official Procurement API Adapter for Cambodia (Country Code: KH).
    API Endpoint: https://search.worldbank.org/api/v2/procnotices
    """
    API_URL = "https://search.worldbank.org/api/v2/procnotices"

    def __init__(self):
        super().__init__(
            code="world_bank_kh",
            name="World Bank Cambodia Procurement",
            website_url="https://projects.worldbank.org/en/projects-operations/procurement-notices?countrycode_exact=KH"
        )

    def fetch_raw(self) -> List[RawTenderData]:
        # NOTE: the v2 procnotices API silently ignores `countrycode_exact`
        # (verified live 2026-08-23: it returned Pakistan/Cameroon/Guinea
        # notices). `qterm=Cambodia` is honored (~49/50), and the loop below
        # post-filters on `project_ctry_name` to drop the remaining strays.
        params = {
            "format": "json",
            "qterm": "Cambodia",
            "rows": 50,
            "os": 0,
            "sort": "proc_notice_date desc"
        }

        headers = {
            "User-Agent": "BidHubKH-TenderIntelligence/1.0 (info@bidhubkh.com)"
        }

        try:
            response = requests.get(self.API_URL, params=params, headers=headers, timeout=20)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"[WorldBankSource] API fetch failed: {e}")
            return []

        raw_items = []
        notices = data.get("procnotices", [])

        notice_list = []
        if isinstance(notices, dict):
            notice_list = list(notices.values())
        elif isinstance(notices, list):
            notice_list = notices

        for notice in notice_list:
            if not isinstance(notice, dict):
                continue

            country = notice.get("project_ctry_name")
            if country is not None and country != "Cambodia":
                continue

            external_id = notice.get("id") or notice.get("notice_id") or str(len(raw_items) + 1)
            title = notice.get("notice_title") or notice.get("project_name") or "World Bank Tender Notice"
            doc_url = notice.get("url") or f"https://projects.worldbank.org/en/projects-operations/procurement-detail/{external_id}"
            
            raw_items.append(RawTenderData(
                source_code=self.code,
                external_id=str(external_id),
                source_url=doc_url,
                title=title,
                description=notice.get("notice_text") or notice.get("project_name"),
                raw_payload=notice
            ))
            
        return raw_items

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        
        # Parse Dates — the v2 procnotices payload carries `noticedate`
        # (verified live), formatted as "17-Aug-2026"; the other two names
        # are kept for safety and arrive ISO-8601 when present.
        pub_str = (
            payload.get("proc_notice_date")
            or payload.get("noticedate")
            or payload.get("submission_date")
        )
        published_at = datetime.utcnow()
        if pub_str:
            try:
                published_at = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
            except Exception:
                try:
                    published_at = datetime.strptime(pub_str, "%d-%b-%Y")
                except Exception:
                    pass

        deadline_str = payload.get("submission_deadline_date") or payload.get("bid_submission_deadline")
        deadline = None
        if deadline_str:
            try:
                deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            except Exception:
                pass

        # Slugify title
        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', raw.title).strip().lower()
        slug = re.sub(r'[\s]+', '-', clean_title)[:200] + f"-{raw.external_id}"

        # Category mapping heuristics
        category_slug = "consulting-services"
        title_lower = raw.title.lower()
        if any(w in title_lower for w in ["laptop", "computer", "it", "software", "network", "server"]):
            category_slug = "it-telecom"
        elif any(w in title_lower for w in ["road", "bridge", "civil", "construction", "building", "paving"]):
            category_slug = "construction-civil"
        elif any(w in title_lower for w in ["medical", "health", "hospital", "pharma", "lab"]):
            category_slug = "medical-healthcare"
        elif any(w in title_lower for w in ["vehicle", "car", "truck", "motor"]):
            category_slug = "vehicles-transport"

        return NormalizedTenderData(
            source_code=self.code,
            external_id=raw.external_id,
            reference_number=payload.get("bid_description") or f"WB/KH/{raw.external_id}",
            title=raw.title,
            slug=slug,
            summary=payload.get("project_name"),
            description=raw.description,
            organization_slug="world-bank-cambodia",
            organization_name="The World Bank Cambodia Country Office",
            category_slug=category_slug,
            location="Cambodia",
            published_at=published_at,
            deadline=deadline,
            estimated_value=None, # Will be extracted via document/AI
            currency="USD",
            procurement_method=payload.get("proc_method_name") or "National Competitive Bidding",
            eligibility="Registered suppliers with World Bank compliance eligibility.",
            original_url=raw.source_url,
            confidence_score=95
        )
