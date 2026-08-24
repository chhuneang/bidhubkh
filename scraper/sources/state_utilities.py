"""
BidHubKH — Source #6: Cambodian State-Owned Enterprises & Public Utilities
Collects tenders from Electricité du Cambodge (EDC) and Phnom Penh Water Supply
Authority (PPWSA).

EDC's procurement listing is server-rendered (links shaped like
/procurement_page/detail/{id} with an <h3 class="procure-title"> per card — see
tests/fixtures/state_utilities/edc_procurement_list.html). PPWSA's bidding page
is captured in fixtures but not yet parsed; until a parser is proven against it,
only EDC notices are returned.
"""

import re
from datetime import datetime, timezone
from typing import List

import requests
from bs4 import BeautifulSoup

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class StateUtilitiesSource(BaseSource):
    EDC_LISTING_URL = "https://www.edc.com.kh/procurement_page/procurement"

    def __init__(self):
        super().__init__(
            code="state_utilities",
            name="Cambodian State-Owned Enterprises & Utilities (EDC / PPWSA)",
            website_url="https://www.edc.com.kh"
        )
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "km,en;q=0.9",
        }

    def fetch_raw(self) -> List[RawTenderData]:
        raw_items: List[RawTenderData] = []

        try:
            resp = requests.get(self.EDC_LISTING_URL, headers=self.headers, timeout=20)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                seen = set()
                for anchor in soup.select('a[href*="procurement_page/detail/"]'):
                    heading = anchor.select_one("h3.procure-title")
                    if heading is None:
                        continue
                    title = heading.get_text(strip=True)
                    href = anchor["href"]
                    if not title or href in seen:
                        continue
                    seen.add(href)

                    match = re.search(r"/detail/(\d+)", href)
                    detail_id = match.group(1) if match else str(len(seen))
                    raw_items.append(
                        RawTenderData(
                            source_code=self.code,
                            external_id=f"EDC-KH-DETAIL-{detail_id}",
                            source_url=href if href.startswith("http") else f"https://www.edc.com.kh{href}",
                            title=title,
                            description=None,
                            raw_payload={"id": f"EDC-KH-DETAIL-{detail_id}", "title": title, "url": href},
                        )
                    )
        except Exception as e:
            print(f"[StateUtilitiesSource] EDC listing scrape note: {e}")

        if not raw_items:
            print("[StateUtilitiesSource] No EDC notices parsed this run.")
        return raw_items

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        title = raw.title
        desc = raw.description or ""
        external_id = raw.external_id

        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug_prefix = re.sub(r'[\s]+', '-', clean_title.strip())[:60]
        slug = f"util-kh-{slug_prefix}-{external_id.lower()[-6:]}"

        # Dates come from the payload only; scraped EDC cards do not expose a
        # machine-readable deadline, so it stays None rather than being guessed.
        deadline = None
        if payload.get("deadline"):
            try:
                deadline = datetime.fromisoformat(str(payload["deadline"]).replace("Z", "+00:00"))
            except Exception:
                deadline = None

        published_at = datetime.now(timezone.utc)
        if payload.get("published"):
            try:
                published_at = datetime.fromisoformat(str(payload["published"]).replace("Z", "+00:00"))
            except Exception:
                pass

        title_lower = title.lower()
        source_lower = (raw.source_url or "").lower()
        if "ppwsa" in title_lower or "ppwsa" in source_lower or "water" in title_lower:
            organization_slug = "ppwsa"
            organization_name = "Phnom Penh Water Supply Authority (PPWSA)"
        else:
            organization_slug = "edc"
            organization_name = "Electricité du Cambodge (EDC)"

        if any(k in title_lower for k in ["power", "cable", "transformer", "electrical", "solar"]):
            cat_slug = "electrical-energy"
        elif any(k in title_lower for k in ["pipe", "water", "ductile iron", "treatment"]):
            cat_slug = "agriculture-water"
        else:
            cat_slug = "construction-civil"

        return NormalizedTenderData(
            source_code=self.code,
            external_id=external_id,
            title=title,
            slug=slug,
            description=desc,
            summary=desc[:240] + "..." if len(desc) > 240 else desc,
            organization_slug=organization_slug,
            organization_name=organization_name,
            category_slug=cat_slug,
            location="Phnom Penh & National Grid, Cambodia",
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("budget"),
            currency=payload.get("currency", "USD"),
            procurement_method="National / International Competitive Bidding (NCB / ICB)",
            eligibility="Suppliers meeting the utility's published bidding requirements.",
            products_services=payload.get("products_services", []),
            requirements=payload.get("requirements", []),
            original_url=raw.source_url,
            confidence_score=97
        )
