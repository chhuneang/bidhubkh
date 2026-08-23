import os
import hashlib
import json
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv
from scraper.sources.base import BaseSource, RawTenderData, NormalizedTenderData
from scraper.extractors.ai_extractor import MultiProviderAIExtractor
from scraper.notifications.dispatcher import NotificationDispatcher
from scraper.link_sentinel import LinkSentinel

load_dotenv()

class IngestionPipeline:
    """
    Executes extraction, AI intelligence summarization, deduplication, 
    URL link health validation, and database ingestion workflow into Supabase PostgreSQL.
    """
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        self.client = None
        self.ai_extractor = MultiProviderAIExtractor()
        self.dispatcher = NotificationDispatcher()
        self.link_sentinel = LinkSentinel()

        if self.supabase_url and self.supabase_key and "your-project" not in self.supabase_url:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                print(f"[Pipeline] Connected to Supabase DB: {self.supabase_url[:24]}...")
            except Exception as e:
                print(f"[Pipeline] Supabase connection skipped: {e}")

    def compute_content_hash(self, payload: dict) -> str:
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def get_source_id(self, source_code: str) -> Optional[str]:
        if not self.client:
            return None
        try:
            res = self.client.from_("sources").select("id").eq("code", source_code).limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]["id"]
        except Exception as e:
            print(f"[Pipeline] Failed to resolve source_id for {source_code}: {e}")
        return None

    def get_category_id(self, category_slug: str) -> Optional[str]:
        if not self.client or not category_slug:
            return None
        try:
            res = self.client.from_("categories").select("id").eq("slug", category_slug).limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]["id"]
        except Exception:
            pass
        return None

    def get_org_id(self, org_slug: str) -> Optional[str]:
        if not self.client or not org_slug:
            return None
        try:
            res = self.client.from_("organizations").select("id").eq("slug", org_slug).limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]["id"]
        except Exception:
            pass
        return None

    def run_source(self, source: BaseSource, enable_ai: bool = True) -> dict:
        print(f"\n==========================================")
        print(f"[Pipeline] Starting collection for: {source.name}")
        if enable_ai and self.ai_extractor.is_available():
            print("[Pipeline] 🤖 Google Gemini 2.0 Flash AI extraction enabled.")
        print(f"==========================================")
        
        raw_items = source.fetch_raw()
        print(f"[Pipeline] Retrieved {len(raw_items)} raw items from {source.code}.")

        processed_count = 0
        duplicate_count = 0
        error_count = 0
        ingested_tenders = []

        source_id = self.get_source_id(source.code)

        for raw in raw_items:
            content_hash = self.compute_content_hash(raw.raw_payload)
            normalized = source.parse_and_normalize(raw)

            # AI Enrichment
            if enable_ai:
                ai_result = self.ai_extractor.extract_from_text(
                    title=normalized.title,
                    description=normalized.description or "",
                    source_name=source.name
                )
                normalized.summary = ai_result.summary
                normalized.products_services = ai_result.products_services
                normalized.requirements = ai_result.requirements
                if ai_result.category_slug:
                    normalized.category_slug = ai_result.category_slug
                if ai_result.estimated_value:
                    normalized.estimated_value = ai_result.estimated_value

            # Ingestion print summary
            print(f"  -> [{normalized.category_slug}] {normalized.title[:60]}...")

            if self.client and source_id:
                try:
                    # 1. Upsert raw_tenders
                    raw_record = {
                        "source_id": source_id,
                        "external_id": raw.external_id,
                        "source_url": raw.source_url,
                        "raw_title": raw.title,
                        "raw_description": raw.description,
                        "raw_payload": raw.raw_payload,
                        "content_hash": content_hash,
                        "status": "processed"
                    }
                    raw_res = self.client.from_("raw_tenders").upsert(raw_record, on_conflict="source_id, external_id").execute()
                    raw_tender_id = raw_res.data[0]["id"] if raw_res.data else None

                    # 2. Validate external URL health before saving
                    _, validated_url, _ = self.link_sentinel.validate_url(normalized.original_url, source.code)

                    cat_id = self.get_category_id(normalized.category_slug)
                    org_id = self.get_org_id(normalized.organization_slug)

                    tender_record = {
                        "raw_tender_id": raw_tender_id,
                        "source_id": source_id,
                        "organization_id": org_id,
                        "category_id": cat_id,
                        "external_id": normalized.external_id,
                        "reference_number": normalized.reference_number,
                        "title": normalized.title,
                        "slug": normalized.slug,
                        "summary": normalized.summary,
                        "description": normalized.description,
                        "location": normalized.location,
                        "published_at": normalized.published_at.isoformat(),
                        "deadline": normalized.deadline.isoformat() if normalized.deadline else None,
                        "estimated_value": normalized.estimated_value,
                        "currency": normalized.currency,
                        "procurement_method": normalized.procurement_method,
                        "eligibility": normalized.eligibility,
                        "products_services": normalized.products_services,
                        "requirements": normalized.requirements,
                        "original_url": validated_url,
                        "confidence_score": normalized.confidence_score,
                        "status": "published",
                        "moderation_status": "approved"
                    }
                    self.client.from_("tenders").upsert(tender_record, on_conflict="slug").execute()
                    ingested_tenders.append(tender_record)
                except Exception as db_err:
                    error_count += 1
                    print(f"     [DB Warning] {db_err}")

            processed_count += 1

        # Dispatch real-time notifications to matching supplier alert rules
        if ingested_tenders:
            try:
                self.dispatcher.dispatch_tender_alerts(ingested_tenders)
            except Exception as dispatch_err:
                print(f"[Pipeline Warning] Alert dispatch encountered an error: {dispatch_err}")

        summary = {
            "source_code": source.code,
            "raw_total": len(raw_items),
            "processed": processed_count,
            "duplicates": duplicate_count,
            "errors": error_count,
        }
        print(f"[Pipeline] Finished {source.code}: {summary}")
        return summary
