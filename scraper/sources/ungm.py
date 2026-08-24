"""
BidHubKH — Source #4: UNGM Cambodia (UN Global Marketplace)
Collects official procurement notices and expressions of interest from UN agencies in Cambodia
including UNDP, UNICEF, WHO, WFP, UNOPS, and FAO.
"""

import re
from datetime import datetime, timezone
from typing import List

import requests

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class UNGMCambodiaSource(BaseSource):
    PUBLIC_NOTICES_URL = "https://www.ungm.org/api/public/notices"

    def __init__(self):
        super().__init__(
            code="ungm",
            name="UN Global Marketplace (UNGM) Cambodia",
            website_url="https://www.ungm.org"
        )
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json",
        }

    def fetch_raw(self) -> List[RawTenderData]:
        """Attempts the public notices endpoint; returns [] when unavailable.

        UNGM's public site is an Angular SPA and every known anonymous JSON API
        path currently redirects to /API/GenericError (see tests/fixtures/
        ungm/api_probe_evidence.txt). We still probe the endpoint each run so a
        future API change is picked up automatically — but we never substitute
        simulated notices for real ones.
        """
        try:
            resp = requests.get(
                self.PUBLIC_NOTICES_URL,
                params={"pageIndex": 1, "pageSize": 50},
                headers=self.headers,
                timeout=15,
            )
            if resp.status_code == 200:
                payload = resp.json()
                rows = payload.get("data") or payload.get("notices") or []
                raw_items: List[RawTenderData] = []
                for row in rows:
                    ext_id = str(row.get("id") or row.get("noticeId") or "").strip()
                    title = (row.get("title") or row.get("description")).strip() if (row.get("title") or row.get("description")) else ""
                    if not ext_id or not title:
                        continue
                    raw_items.append(
                        RawTenderData(
                            source_code=self.code,
                            external_id=f"UNGM-{ext_id}",
                            source_url=row.get("url") or f"https://www.ungm.org/Public/Notice/{ext_id}",
                            title=title,
                            description=row.get("description"),
                            raw_payload=row,
                        )
                    )
                if raw_items:
                    return raw_items
        except Exception as e:
            print(f"[UNGMSource] Public API probe note: {e}")

        print("[UNGMSource] No server-rendered UNGM notices available this run "
              "(public site is a client-side SPA).")
        return []

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        title = raw.title
        desc = raw.description or ""
        external_id = raw.external_id

        # Clean slug
        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug_prefix = re.sub(r'[\s]+', '-', clean_title.strip())[:60]
        slug = f"ungm-kh-{slug_prefix}-{external_id.lower()[-6:]}"

        # Deadline
        deadline = None
        if payload.get("deadline"):
            try:
                deadline = datetime.fromisoformat(str(payload["deadline"]).replace("Z", "+00:00"))
            except Exception:
                deadline = None

        # Published date
        published_at = datetime.now(timezone.utc)
        if payload.get("published"):
            try:
                published_at = datetime.fromisoformat(payload["published"].replace("Z", "+00:00"))
            except Exception:
                pass

        # Sector mapping
        title_lower = title.lower()
        if any(k in title_lower for k in ["solar", "renewable", "energy", "grid"]):
            cat_slug = "electrical-energy"
        elif any(k in title_lower for k in ["nutrition", "medical", "health", "lims", "lab", "scale"]):
            cat_slug = "medical-healthcare"
        elif any(k in title_lower for k in ["software", "digital", "system", "it"]):
            cat_slug = "it-telecom"
        else:
            cat_slug = "consulting-services"

        # Organization mapping
        org_slug = "undp-cambodia"
        org_name = "United Nations Agencies in Cambodia"
        if "unicef" in title_lower or "unicef" in external_id.lower():
            org_slug = "unicef-cambodia"
            org_name = "UNICEF Cambodia"
        elif "who" in title_lower or "who" in external_id.lower():
            org_slug = "who-cambodia"
            org_name = "World Health Organization (WHO) Cambodia"
        elif "undp" in title_lower or "undp" in external_id.lower():
            org_slug = "undp-cambodia"
            org_name = "UNDP Cambodia"

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
            location="Cambodia (Multi-Provincial)",
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("budget"),
            currency=payload.get("currency", "USD"),
            procurement_method="UN Competitive Request for Proposals (RFP / ITB)",
            eligibility="Registered UNGM Vendors (Level 1 / Level 2)",
            products_services=payload.get("products_services", []),
            requirements=payload.get("requirements", []),
            original_url=raw.source_url,
            confidence_score=96
        )
