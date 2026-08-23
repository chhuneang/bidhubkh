"""Deduplication engine (Milestone 15b).

Three layers, evaluated in order:

* Layer 1 — exact: ``(source_id, external_id)`` already has a tender row.
  This is a re-ingest of a known notice → refresh the original, not a duplicate.
* Layer 2 — fingerprint: SHA-256 of ``(organization_id, normalized_title,
  deadline_date)``. A collision means the same opportunity under a different
  slug/external id (e.g. cross-source or re-titled URL). The incoming insert
  is skipped and the original's ``duplicate_count`` incremented.
* Layer 3 — similarity: rapidfuzz ``token_sort_ratio`` on normalized titles
  within the same organization. At/above threshold the tender is saved but
  flagged ``duplicate_review`` with a link to the suspected original.

Layer 1/2 are deterministic; layer 3 needs candidate titles from Supabase.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, Optional, Tuple

from scraper.validators.rules import normalize_title

# Titles within the same organization at/above this ratio are suspected duplicates.
SIMILARITY_THRESHOLD = 88

# Upper bound on candidate titles pulled for fuzzy comparison per organization.
MAX_CANDIDATES = 500


@dataclass
class DedupVerdict:
    """Outcome of running all layers for one incoming tender."""

    outcome: str                 # 'new' | 'existing' | 'duplicate' | 'review'
    existing_id: Optional[str] = None   # Layer 1: tender to refresh in place
    fingerprint_of: Optional[str] = None  # Layer 2: original tender id skipped-for
    similar_of: Optional[str] = None    # Layer 3: suspected original tender id
    similarity: Optional[float] = None
    fingerprint: Optional[str] = None


def compute_fingerprint(
    organization_id: Optional[str],
    title: str,
    deadline: Optional[datetime],
) -> str:
    """SHA-256 of (organization_id, normalized title, deadline calendar date)."""
    deadline_part = (
        deadline.date().isoformat()
        if isinstance(deadline, datetime)
        else (deadline.isoformat() if isinstance(deadline, date) else "none")
    )
    parts = (organization_id or "no-org", normalize_title(title), deadline_part)
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


class DedupEngine:
    """Stateless helpers bound to a Supabase client (service-role)."""

    def __init__(self, client: Any):
        self.client = client

    # -- Layer 1 ---------------------------------------------------------

    def find_exact(self, source_id: str, external_id: str) -> Optional[str]:
        """Return the tender id already stored for this source+external id."""
        res = (
            self.client.from_("tenders")
            .select("id")
            .eq("source_id", source_id)
            .eq("external_id", external_id)
            .limit(1)
            .execute()
        )
        if res.data:
            return res.data[0]["id"]
        return None

    # -- Layer 2 ---------------------------------------------------------

    def find_fingerprint(
        self, fingerprint: str, exclude_id: Optional[str] = None
    ) -> Optional[str]:
        """Return the live tender carrying this fingerprint, if any."""
        query = (
            self.client.from_("tenders")
            .select("id")
            .eq("fingerprint", fingerprint)
            .neq("moderation_status", "rejected")
            .limit(1)
        )
        if exclude_id:
            query = query.neq("id", exclude_id)
        res = query.execute()
        if res.data:
            return res.data[0]["id"]
        return None

    def increment_duplicate_count(self, tender_id: str) -> None:
        """Bump the original's duplicate counter after a Layer 2 collision."""
        self.client.rpc(
            "increment_tender_duplicate_count", {"p_tender_id": tender_id}
        ).execute()

    # -- Layer 3 ---------------------------------------------------------

    def find_similar(
        self,
        organization_id: Optional[str],
        title: str,
        exclude_id: Optional[str] = None,
        threshold: int = SIMILARITY_THRESHOLD,
    ) -> Tuple[Optional[str], Optional[float]]:
        """Fuzzy-match against recent same-org titles.

        Returns (tender_id, score) of the best match at/above threshold,
        or (None, None).
        """
        if not organization_id or not title.strip():
            return None, None

        try:
            from rapidfuzz import fuzz
        except ImportError:
            print("[Dedup] rapidfuzz not installed — skipping similarity layer.")
            return None, None

        res = (
            self.client.from_("tenders")
            .select("id, title")
            .eq("organization_id", organization_id)
            .neq("moderation_status", "rejected")
            .order("created_at", desc=True)
            .limit(MAX_CANDIDATES)
            .execute()
        )

        best_id: Optional[str] = None
        best_score = 0.0
        normalized_incoming = normalize_title(title)
        for row in res.data or []:
            if exclude_id and row["id"] == exclude_id:
                continue
            score = fuzz.token_sort_ratio(
                normalized_incoming, normalize_title(row["title"])
            )
            if score > best_score:
                best_id, best_score = row["id"], float(score)

        if best_id and best_score >= threshold:
            return best_id, best_score
        return None, None

    # -- Orchestration ---------------------------------------------------

    def evaluate(
        self,
        *,
        source_id: str,
        external_id: str,
        organization_id: Optional[str],
        title: str,
        deadline: Optional[datetime],
    ) -> DedupVerdict:
        """Run layers 1→2→3 and return the verdict."""
        fingerprint = compute_fingerprint(organization_id, title, deadline)

        exact_id = self.find_exact(source_id, external_id)
        if exact_id:
            return DedupVerdict("existing", existing_id=exact_id, fingerprint=fingerprint)

        fp_original = self.find_fingerprint(fingerprint)
        if fp_original:
            return DedupVerdict(
                "duplicate",
                fingerprint_of=fp_original,
                fingerprint=fingerprint,
            )

        similar_id, score = self.find_similar(organization_id, title)
        if similar_id:
            return DedupVerdict(
                "review",
                similar_of=similar_id,
                similarity=score,
                fingerprint=fingerprint,
            )

        return DedupVerdict("new", fingerprint=fingerprint)


__all__ = [
    "DedupEngine",
    "DedupVerdict",
    "SIMILARITY_THRESHOLD",
    "compute_fingerprint",
    "normalize_title",
]
