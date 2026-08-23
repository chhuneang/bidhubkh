"""
BidHubKH — Source #5: NGO & Development Portals Cambodia
Collects grant-funded procurement opportunities, consultancy RFPs, and goods
tenders advertised on ReliefWeb for organisations operating in Cambodia.

ReliefWeb's v1 API is retired (HTTP 410) and its v2 API requires an *approved*
appname registered at https://apidoc.reliefweb.int (anonymous or unregistered
appnames receive HTTP 403 — see tests/fixtures/ngo_cambodia/
reliefweb_api_403_appname_required.json). Set RELIEFWEB_APPNAME once approved;
until then this adapter returns an honest empty list each run.
"""

import os
import re
from datetime import datetime, timezone
from typing import List

import requests

from scraper.sources.base import BaseSource, NormalizedTenderData, RawTenderData


class NGOCambodiaSource(BaseSource):
    API_URL = "https://api.reliefweb.int/v2/jobs"
    KEYWORD_FIELDS = ["tender", "invitation for bids", "request for proposal", "procurement", "ITB", "RFQ"]

    def __init__(self):
        super().__init__(
            code="ngo_cambodia",
            name="Cambodia NGO & Civil Society Development Portals",
            website_url="https://reliefweb.int/country/khm"
        )
        self.appname = os.environ.get("RELIEFWEB_APPNAME", "bidhubkh")
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            ),
            "Content-Type": "application/json",
        }

    def _request_body(self, limit: int = 50) -> dict:
        return {
            "filter": {
                "operator": "AND",
                "conditions": [
                    {"field": "country.iso3", "value": ["KHM"]},
                    {
                        "operator": "OR",
                        "conditions": [
                            {"field": "title", "value": [kw], "operator": "OR"}
                            for kw in self.KEYWORD_FIELDS
                        ],
                    },
                ],
            },
            "fields": {
                "include": ["id", "title", "url", "url_alias", "date", "source.shortname"]
            },
            "limit": limit,
            "sort": ["date.created:desc"],
        }

    def fetch_raw(self) -> List[RawTenderData]:
        try:
            resp = requests.post(
                f"{self.API_URL}?appname={self.appname}",
                json=self._request_body(),
                headers=self.headers,
                timeout=30,
            )
            if resp.status_code == 200:
                rows = resp.json().get("data", []) or []
                raw_items: List[RawTenderData] = []
                for row in rows:
                    fields = row.get("fields", {})
                    ext_id = str(fields.get("id") or row.get("id") or "").strip()
                    title = (fields.get("title") or "").strip()
                    if not ext_id or not title:
                        continue
                    created = (fields.get("date") or {}).get("created")
                    raw_items.append(
                        RawTenderData(
                            source_code=self.code,
                            external_id=f"NGO-KH-RW-{ext_id}",
                            source_url=fields.get("url") or fields.get("url_alias") or self.website_url,
                            title=title,
                            description=None,
                            raw_payload={
                                "id": f"NGO-KH-RW-{ext_id}",
                                "title": title,
                                "url": fields.get("url"),
                                "published": created,
                                "source": (fields.get("source") or {}).get("shortname"),
                            },
                        )
                    )
                if raw_items:
                    return raw_items
            elif resp.status_code == 403:
                print("[NGOCambodiaSource] ReliefWeb rejected the appname "
                      f"'{self.appname}'. Register one at https://apidoc.reliefweb.int "
                      "and set RELIEFWEB_APPNAME.")
        except Exception as e:
            print(f"[NGOCambodiaSource] ReliefWeb query note: {e}")

        print("[NGOCambodiaSource] No ReliefWeb notices available this run.")
        return []

    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        payload = raw.raw_payload
        title = raw.title
        desc = raw.description or ""
        external_id = raw.external_id

        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug_prefix = re.sub(r'[\s]+', '-', clean_title.strip())[:60]
        slug = f"ngo-kh-{slug_prefix}-{external_id.lower()[-6:]}"

        # Dates come from the payload only; ReliefWeb job ads rarely carry a
        # closing date, so deadline stays None instead of being invented.
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
            organization_slug=(payload.get("source") or "ngo-cambodia").lower().replace(" ", "-"),
            category_slug=cat_slug,
            location="Cambodia",
            published_at=published_at,
            deadline=deadline,
            estimated_value=payload.get("budget"),
            currency=payload.get("currency", "USD"),
            procurement_method="NGO Competitive Request for Quotation (RFQ)",
            eligibility="Registered Cambodian Businesses with MoC & GDT Tax Compliance",
            products_services=payload.get("products_services", []),
            requirements=payload.get("requirements", []),
            original_url=raw.source_url,
            confidence_score=94
        )
