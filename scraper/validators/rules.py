"""Validation rules for normalized tender data (Milestone 15a).

Every tender passes through :func:`validate_tender` before ingestion. Rules are
split into two severities:

* ``critical`` — a failure means the tender cannot be trusted for publication
  and must be quarantined.
* ``warning``  — a data-quality signal that lowers the confidence score but
  does not block ingestion.

This module is pure: no database, no network. See scraper/tests/test_validators.py.
"""

from __future__ import annotations

import re
from typing import List, Optional
from urllib.parse import urlparse

from pydantic import BaseModel

CRITICAL = "critical"
WARNING = "warning"

ALLOWED_CURRENCIES = {"USD", "KHR"}

# Abbreviation -> canonical form, applied during title normalization for dedup.
ABBREVIATIONS = {
    "min.": "ministry",
    "min": "ministry",
    "gdce": "general department of customs and excise",
    "gdt": "general department of taxation",
    "edc": "electricite du cambodge",
    "ppwsa": "phnom penh water supply authority",
    "nbc": "national bank of cambodia",
    "mef": "ministry of economy and finance",
    "moeys": "ministry of education youth and sport",
    "mprd": "ministry of public works and transport",
    "maff": "ministry of agriculture forestry and fisheries",
    "moh": "ministry of health",
    "cdc": "council for the development of cambodia",
    "csrc": "capital market of cambodia",
}

_PUNCT_RE = re.compile(r"[^\w\s]")
_WS_RE = re.compile(r"\s+")


class ValidationIssue(BaseModel):
    rule: str
    severity: str  # 'critical' | 'warning'
    message: str


class ValidationResult(BaseModel):
    passed_critical: bool
    issues: List[ValidationIssue]
    confidence_score: int  # 0-100, starts at 100 minus warnings/criticals

    @property
    def critical_issues(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == CRITICAL]

    def errors_as_list(self) -> List[dict]:
        """Issues as plain dicts, ready for tenders.validation_errors (jsonb)."""
        return [i.model_dump() for i in self.issues]


def _issue(rule: str, severity: str, message: str) -> ValidationIssue:
    return ValidationIssue(rule=rule, severity=severity, message=message)


def validate_tender(
    *,
    title: Optional[str],
    organization_name: Optional[str] = None,
    published_at=None,
    deadline=None,
    estimated_value: Optional[float] = None,
    currency: Optional[str] = None,
    original_url: Optional[str] = None,
) -> ValidationResult:
    """Run all rules against a normalized tender.

    Accepts plain values rather than NormalizedTenderData so the rules stay
    decoupled from the scraper model shape (and easy to table-drive in tests).
    """
    issues: List[ValidationIssue] = []

    # --- Critical rules -------------------------------------------------

    if not title or not title.strip():
        issues.append(_issue("title_not_empty", CRITICAL, "Title is empty."))
    elif len(title.strip()) < 10:
        issues.append(
            _issue("title_min_length", WARNING,
                   f"Title is very short ({len(title.strip())} chars).")
        )

    if not organization_name or not organization_name.strip():
        issues.append(
            _issue("organization_not_empty", CRITICAL,
                   "Organization name is missing.")
        )

    if published_at and deadline and deadline <= published_at:
        issues.append(
            _issue("deadline_after_published", CRITICAL,
                   "Deadline must be after published_at "
                   f"(deadline={deadline.isoformat()}, published={published_at.isoformat()}).")
        )

    if estimated_value is not None and estimated_value < 0:
        issues.append(
            _issue("estimated_value_non_negative", CRITICAL,
                   f"Estimated value is negative ({estimated_value}).")
        )
    elif estimated_value is not None and estimated_value == 0:
        issues.append(
            _issue("estimated_value_zero", WARNING,
                   "Estimated value is zero; likely an extraction miss.")
        )

    if not currency or currency.upper() not in ALLOWED_CURRENCIES:
        issues.append(
            _issue("currency_allowed", CRITICAL,
                   f"Currency '{currency}' not in {sorted(ALLOWED_CURRENCIES)}.")
        )

    url_ok = False
    if original_url:
        try:
            parsed = urlparse(original_url.strip())
            url_ok = parsed.scheme in ("http", "https") and bool(parsed.netloc)
        except (ValueError, AttributeError):
            url_ok = False
    if not url_ok:
        issues.append(
            _issue("original_url_well_formed", CRITICAL,
                   f"original_url is missing or malformed: {original_url!r}")
        )

    critical_count = len(issues)

    # --- Warning-only rules ---------------------------------------------

    if deadline is None:
        issues.append(
            _issue("deadline_present", WARNING,
                   "No deadline extracted; opportunity may already be closed.")
        )

    confidence_score = max(0, 100 - 15 * critical_count - 5 * (len(issues) - critical_count))

    return ValidationResult(
        passed_critical=all(i.severity != CRITICAL for i in issues),
        issues=issues,
        confidence_score=confidence_score,
    )


def normalize_title(title: str) -> str:
    """Canonicalize a title for fingerprinting / fuzzy matching.

    Lowercase, expand common abbreviations, strip punctuation, collapse whitespace.
    """
    lowered = title.lower().strip()
    expanded = lowered
    for abbrev, full in ABBREVIATIONS.items():
        # Word-boundary replace so 'min' does not corrupt 'administration'.
        expanded = re.sub(rf"\b{re.escape(abbrev)}\b", full, expanded)
    stripped = _PUNCT_RE.sub(" ", expanded)
    return _WS_RE.sub(" ", stripped).strip()
