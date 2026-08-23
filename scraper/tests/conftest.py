"""Shared helpers for the fixture-based source-adapter tests (Milestone 16).

Every fixture under ``tests/fixtures/`` was captured from the live sources (or,
where a source performs no live call, is a labelled snapshot of the adapter's
own runtime output). Tests read these files only — no test hits the network.
"""

import json
from pathlib import Path

from scraper.sources.base import RawTenderData

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def load_json(relative_path: str):
    """Loads a JSON fixture relative to tests/fixtures/."""
    return json.loads((FIXTURES_DIR / relative_path).read_text(encoding="utf-8"))


def load_text(relative_path: str) -> str:
    """Loads a text/HTML fixture relative to tests/fixtures/."""
    return (FIXTURES_DIR / relative_path).read_text(encoding="utf-8", errors="replace")


def raw_items_from_snapshot(snapshot: dict) -> list[RawTenderData]:
    """Rebuilds the RawTenderData objects exactly as fetch_raw produced them.

    Snapshot files written by the capture script store verbatim
    ``RawTenderData.model_dump(mode="json")`` payloads, so reconstruction is
    lossless apart from datetimes (already ISO strings inside raw_payload).
    """
    return [RawTenderData(**item) for item in snapshot["items"]]
