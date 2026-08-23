"""
BidHubKH — Source #5: NGO & Development Portals Cambodia
Collects grant-funded procurement opportunities, consultancy RFPs, and goods tenders from
international and local NGOs operating across Cambodia.
"""

import re
from datetime import datetime, timedelta, timezone
from typing import List

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class NGOCambodiaSource(BaseSource):
    def __init__(self):
        super().__init__(
            code="ngo_cambodia",
            name="Cambodia NGO & Civil Society Development Portals",
            website_url="https://reliefweb.int/country/khm"
        )

    def fetch_raw(self) -> List[RawTenderData]:
        raw_items: List[RawTenderData] = []
        
        sample_notices = [
            {
                "id": "NGO-KH-2026-041",
                "title": "RFP-CW-2026-03 - Construction of 18 Deep Groundwater Community Boreholes with Solar Pumps in Kampong Thom",
                "organization": "WaterAid / Plan International Cambodia",
                "description": "Call for sealed technical and financial bids for the hydrogeological drilling, casing, and installation of 18 deep community water boreholes equipped with solar submersible pump stations and communal tap stands in Stoung and Prasat Balangk districts.",
                "deadline": (datetime.now(timezone.utc) + timedelta(days=25)).isoformat(),
                "published": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
                "budget": 145000.0,
                "currency": "USD",
                "url": "https://reliefweb.int/job/cambodia/wateraid-rfp-boreholes-2026"
            },
            {
                "id": "NGO-KH-2026-042",
                "title": "ITB-EDU-2026-012 - Supply & Distribution of 3,200 Early Grade STEM Learning Kits and Teacher Tablets",
                "organization": "Room to Read Cambodia",
                "description": "Room to Read Cambodia invites qualified education technology distributors and local printers to bid for the assembly, packaging, and provincial school delivery of 3,200 supplementary STEM science kits and 180 teacher tablet computers.",
                "deadline": (datetime.now(timezone.utc) + timedelta(days=19)).isoformat(),
                "published": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
                "budget": 98000.0,
                "currency": "USD",
                "url": "https://reliefweb.int/job/cambodia/roomtoread-itb-stem-kits"
            }
        ]

        for notice in sample_notices:
            raw_items.append(
                RawTenderData(
                    external_id=notice["id"],
                    source_code=self.code,
                    source_url=notice["url"],
                    title=notice["title"],
                    description=notice["description"],
                    raw_payload=notice
                )
            )

        return raw_items

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        title = raw.title
        desc = raw.description or ""
        external_id = raw.external_id

        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug_prefix = re.sub(r'[\s]+', '-', clean_title.strip())[:60]
        slug = f"ngo-kh-{slug_prefix}-{external_id.lower()[-6:]}"

        deadline = None
        if payload.get("deadline"):
            try:
                deadline = datetime.fromisoformat(payload["deadline"].replace("Z", "+00:00"))
            except Exception:
                deadline = datetime.now(timezone.utc) + timedelta(days=20)

        published_at = datetime.now(timezone.utc)
        if payload.get("published"):
            try:
                published_at = datetime.fromisoformat(payload["published"].replace("Z", "+00:00"))
            except Exception:
                pass

        title_lower = title.lower()
        if any(k in title_lower for k in ["water", "borehole", "solar pump", "civil", "construction"]):
            cat_slug = "water-sanitation"
        elif any(k in title_lower for k in ["stem", "learning", "tablet", "education"]):
            cat_slug = "education-training"
        else:
            cat_slug = "consulting-services"

        return NormalizedTenderData(
            source_code=self.code,
            external_id=external_id,
            title=title,
            slug=slug,
            description=desc,
            summary=desc[:240] + "..." if len(desc) > 240 else desc,
            organization_slug="ngo-cambodia",
            category_slug=cat_slug,
            location="Kampong Thom & Multi-Provincial, Cambodia",
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("budget"),
            currency=payload.get("currency", "USD"),
            procurement_method="NGO Competitive Request for Quotation (RFQ)",
            eligibility="Registered Cambodian Businesses with MoC & GDT Tax Compliance",
            products_services=["Groundwater Borehole Drilling", "Submersible Solar Pumps", "STEM Education Kits"],
            requirements=[
                "Valid Cambodian Ministry of Commerce (MoC) Certificate",
                "GDT Tax Patent & VAT Certificate",
                "Past performance references for at least 2 NGO projects in Cambodia"
            ],
            original_url=raw.source_url,
            confidence_score=94
        )
