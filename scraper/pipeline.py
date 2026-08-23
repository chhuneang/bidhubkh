import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv

from scraper.extractors.ai_extractor import MultiProviderAIExtractor
from scraper.link_sentinel import LinkSentinel
from scraper.notifications.dispatcher import NotificationDispatcher
from scraper.processors.dedup import DedupEngine
from scraper.sources.base import BaseSource
from scraper.validators.rules import validate_tender

load_dotenv()

class IngestionPipeline:
    """
    Executes extraction, AI intelligence summarization, validation,
    three-layer deduplication, URL link health validation, and database
    ingestion workflow into Supabase PostgreSQL.
    """
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        self.client = None
        self.ai_extractor = MultiProviderAIExtractor()
        self.dispatcher = NotificationDispatcher()
        self.link_sentinel = LinkSentinel()
        self.dedup = DedupEngine(None)

        if self.supabase_url and self.supabase_key and "your-project" not in self.supabase_url:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                self.dedup = DedupEngine(self.client)
                print(f"[Pipeline] Connected to Supabase DB: {self.supabase_url[:24]}...")
            except Exception as e:
                print(f"[Pipeline] Supabase connection skipped: {e}")

    def compute_content_hash(self, payload: dict) -> str:
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def resolve_source(self, source_code: str) -> Optional[dict]:
        """Resolve source row (id + auto_approve trust flag) by code."""
        if not self.client:
            return None
        try:
            res = (
                self.client.from_("sources")
                .select("id, auto_approve")
                .eq("code", source_code)
                .limit(1)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            # Migration 00004 may not be applied yet — fall back to id-only.
            print(f"[Pipeline] auto_approve lookup failed ({e}); defaulting to trusted.")
            try:
                res = self.client.from_("sources").select("id").eq("code", source_code).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return {"id": res.data[0]["id"], "auto_approve": True}
            except Exception as e2:
                print(f"[Pipeline] Failed to resolve source_id for {source_code}: {e2}")
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

    def _insert_tender(self, record: dict) -> Optional[str]:
        """INSERT a new tender row; on a slug collision retry with a suffixed slug."""
        try:
            res = self.client.from_("tenders").insert(record).execute()
            return res.data[0]["id"] if res.data else None
        except Exception as insert_err:
            message = str(insert_err)
            if "duplicate key" not in message or "slug" not in message.lower():
                raise
            suffix = hashlib.md5(
                f"{record['external_id']}-{record['published_at']}".encode("utf-8")
            ).hexdigest()[:8]
            record["slug"] = f"{record['slug']}-{suffix}"
            res = self.client.from_("tenders").insert(record).execute()
            return res.data[0]["id"] if res.data else None

    def run_source(self, source: BaseSource, enable_ai: bool = True) -> dict:
        print("\n==========================================")
        print(f"[Pipeline] Starting collection for: {source.name}")
        if enable_ai and self.ai_extractor.is_available():
            print("[Pipeline] 🤖 Google Gemini 2.0 Flash AI extraction enabled.")
        print("==========================================")

        raw_items = source.fetch_raw()
        print(f"[Pipeline] Retrieved {len(raw_items)} raw items from {source.code}.")

        processed_count = 0
        new_count = 0
        updated_count = 0
        duplicate_count = 0
        quarantined_count = 0
        review_count = 0
        error_count = 0
        approved_new_tenders = []  # only auto-approved inserts trigger alerts

        source_info = self.resolve_source(source.code)
        source_id = source_info["id"] if source_info else None
        auto_approve = bool(source_info.get("auto_approve")) if source_info else True

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

            # Data-quality gate (Milestone 15a)
            validation = validate_tender(
                title=normalized.title,
                organization_name=normalized.organization_name or normalized.organization_slug,
                published_at=normalized.published_at,
                deadline=normalized.deadline,
                estimated_value=normalized.estimated_value,
                currency=normalized.currency,
                original_url=normalized.original_url,
            )
            if not validation.passed_critical:
                critical_msgs = "; ".join(i.message for i in validation.critical_issues)
                print(f"  ⚠️ [Quarantined] {normalized.title[:60]}... — {critical_msgs}")
            elif validation.issues:
                warnings = "; ".join(i.message for i in validation.issues)
                print(f"  ⚠️ [Warnings] {normalized.title[:60]}... — {warnings}")

            print(f"  -> [{normalized.category_slug}] {normalized.title[:60]}...")
            processed_count += 1

            if not (self.client and source_id):
                continue

            try:
                # 1. Upsert raw_tenders (audit trail; unique on source_id + external_id)
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

                base_record = {
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
                    "confidence_score": (
                        min(normalized.confidence_score, validation.confidence_score)
                        if validation.passed_critical else validation.confidence_score
                    ),
                    "validation_errors": validation.errors_as_list(),
                }

                # 3. Three-layer dedup verdict (Milestone 15b)
                verdict = self.dedup.evaluate(
                    source_id=source_id,
                    external_id=normalized.external_id,
                    organization_id=org_id,
                    title=normalized.title,
                    deadline=normalized.deadline,
                )

                if not validation.passed_critical:
                    # Quarantined rows are stored for admin review, never public.
                    if verdict.outcome == "existing":
                        self.client.from_("tenders").update({
                            **base_record,
                            "fingerprint": verdict.fingerprint,
                            "moderation_status": "quarantined",
                        }).eq("id", verdict.existing_id).execute()
                    else:
                        self._insert_tender({
                            **base_record,
                            "fingerprint": verdict.fingerprint,
                            "moderation_status": "quarantined",
                        })
                    quarantined_count += 1
                    continue

                if verdict.outcome == "existing":
                    # Known notice re-ingested: refresh content, keep moderation state.
                    self.client.from_("tenders").update({
                        **base_record,
                        "fingerprint": verdict.fingerprint,
                        "last_seen_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", verdict.existing_id).execute()
                    updated_count += 1
                elif verdict.outcome == "duplicate":
                    # Same opportunity under another slug/source: bump the original.
                    if raw_tender_id:
                        self.client.from_("raw_tenders").update(
                            {"status": "duplicate"}
                        ).eq("id", raw_tender_id).execute()
                    if verdict.fingerprint_of:
                        self.dedup.increment_duplicate_count(verdict.fingerprint_of)
                    duplicate_count += 1
                    print(f"  ↺ [Duplicate of {verdict.fingerprint_of[:8]}] {normalized.title[:60]}...")
                else:
                    # Genuinely new (or fuzzy-borderline): route through moderation.
                    if verdict.outcome == "review":
                        moderation_status = "duplicate_review"
                    else:
                        moderation_status = "approved" if auto_approve else "pending"

                    self._insert_tender({
                        **base_record,
                        "fingerprint": verdict.fingerprint,
                        "moderation_status": moderation_status,
                        "duplicate_of_id": verdict.similar_of,
                    })
                    if moderation_status == "approved":
                        new_count += 1
                        approved_new_tenders.append(base_record)
                    elif moderation_status == "pending":
                        new_count += 1
                    else:
                        review_count += 1

            except Exception as db_err:
                error_count += 1
                print(f"     [DB Warning] {db_err}")

        # Dispatch real-time notifications ONLY for newly auto-approved tenders
        if approved_new_tenders:
            try:
                self.dispatcher.dispatch_tender_alerts(approved_new_tenders)
            except Exception as dispatch_err:
                print(f"[Pipeline Warning] Alert dispatch encountered an error: {dispatch_err}")

        summary = {
            "source_code": source.code,
            "raw_total": len(raw_items),
            "processed": processed_count,
            "new": new_count,
            "updated": updated_count,
            "duplicates": duplicate_count,
            "quarantined": quarantined_count,
            "duplicate_review": review_count,
            "errors": error_count,
        }
        print(f"[Pipeline] Finished {source.code}: {summary}")
        return summary
