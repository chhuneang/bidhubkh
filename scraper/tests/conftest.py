"""Shared helpers for the fixture-based source-adapter tests (Milestone 16).

Fixtures under ``tests/fixtures/`` are real captures from the live sources or
drift evidence; anything synthetic is labelled as such inside the file itself.
Tests read these files only — no test hits the network.
"""

import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def load_json(relative_path: str):
    """Loads a JSON fixture relative to tests/fixtures/."""
    return json.loads((FIXTURES_DIR / relative_path).read_text(encoding="utf-8"))


def load_text(relative_path: str) -> str:
    """Loads a text/HTML fixture relative to tests/fixtures/."""
    return (FIXTURES_DIR / relative_path).read_text(encoding="utf-8", errors="replace")
