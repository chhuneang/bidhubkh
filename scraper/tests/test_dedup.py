"""Tests for scraper/processors/dedup.py — pure logic plus a fake-client layer."""

from datetime import datetime

import pytest

from scraper.processors.dedup import (
    SIMILARITY_THRESHOLD,
    DedupEngine,
    DedupVerdict,
    compute_fingerprint,
)

DEADLINE = datetime(2026, 9, 1, 0, 0, 0)
ORG_ID = "org-123"


class TestFingerprint:
    def test_deterministic(self):
        a = compute_fingerprint(ORG_ID, "Supply of Laptops", DEADLINE)
        b = compute_fingerprint(ORG_ID, "supply   of laptops!!", DEADLINE)
        assert a == b
        assert len(a) == 64  # sha256 hex

    def test_different_deadline_changes_fingerprint(self):
        a = compute_fingerprint(ORG_ID, "Same Title", datetime(2026, 9, 1))
        b = compute_fingerprint(ORG_ID, "Same Title", datetime(2026, 9, 15))
        assert a != b

    def test_none_org_and_deadline_are_stable(self):
        a = compute_fingerprint(None, "Any Title", None)
        b = compute_fingerprint(None, "any title", None)
        assert a == b

    def test_accepts_date_objects(self):
        import datetime as dt

        a = compute_fingerprint(ORG_ID, "Title", dt.date(2026, 9, 1))
        b = compute_fingerprint(ORG_ID, "Title", datetime(2026, 9, 1))
        assert a == b


class FakeQuery:
    """Mimics the supabase-py chained builder just enough for the engine."""

    def __init__(self, table, rows):
        self.table = table
        self.rows = rows
        self.filters = {}

    def select(self, *_cols):
        return self

    def eq(self, col, val):
        self.filters[col] = ("eq", val)
        return self

    def neq(self, col, val):
        self.filters[col] = ("neq", val)
        return self

    def order(self, *a, **k):
        return self

    def limit(self, *a):
        return self

    def execute(self):
        out = list(self.rows)
        for col, (op, val) in self.filters.items():
            if op == "eq":
                out = [r for r in out if r.get(col) == val]
            else:
                out = [r for r in out if r.get(col) != val]
        result = type("R", (), {"data": out})()
        return result


class FakeClient:
    def __init__(self, tenders):
        self._tenders = tenders
        self.rpc_calls = []

    def from_(self, table):
        if table == "tenders":
            return FakeQuery(table, self._tenders)
        raise AssertionError(f"unexpected table {table}")

    def rpc(self, name, params):
        self.rpc_calls.append((name, params))

        class R:
            data = []

            def execute(self):
                return self

        return R()


@pytest.fixture
def engine_rows():
    return [
        {
            "id": "tender-existing",
            "source_id": "src-1",
            "external_id": "WB-1",
            "organization_id": ORG_ID,
            "title": "Procurement of 450 High-Performance Laptops",
            "moderation_status": "approved",
        },
        {
            "id": "tender-rejected",
            "source_id": "src-2",
            "external_id": "X-9",
            "organization_id": ORG_ID,
            "title": "Procurement of High Performance Laptops",
            "moderation_status": "rejected",
        },
    ]


class TestDedupLayers:
    def test_layer1_exact_match_wins(self, engine_rows):
        engine = DedupEngine(FakeClient(engine_rows))
        verdict = engine.evaluate(
            source_id="src-1",
            external_id="WB-1",
            organization_id=ORG_ID,
            title="Completely different words here",
            deadline=DEADLINE,
        )
        assert verdict.outcome == "existing"
        assert verdict.existing_id == "tender-existing"

    def test_layer3_similarity_flags_review(self, engine_rows):
        rows = [r for r in engine_rows if r["id"] != "tender-rejected"]
        engine = DedupEngine(FakeClient(rows))
        verdict = engine.evaluate(
            source_id="src-other",
            external_id="NEW-7",
            organization_id=ORG_ID,
            # Token-reordered variant of the stored title: normalization +
            # token_sort_ratio must still catch it.
            title="High-Performance Laptops procurement of 450",
            deadline=DEADLINE,
        )
        assert verdict.outcome == "review"
        assert verdict.similar_of == "tender-existing"
        assert verdict.similarity is not None and verdict.similarity >= SIMILARITY_THRESHOLD

    def test_rejected_tenders_never_match(self, engine_rows):
        # Only the rejected row shares this title — must NOT be treated as duplicate.
        rows = [r for r in engine_rows if r["moderation_status"] == "rejected"]
        engine = DedupEngine(FakeClient(rows))
        verdict = engine.evaluate(
            source_id="src-new",
            external_id="NEW-8",
            organization_id=ORG_ID,
            title="Procurement of high performance laptops",
            deadline=DEADLINE,
        )
        # Layer 2 fingerprint can still hit (rejected excluded there too), but the
        # similarity layer must ignore the rejected row.
        if verdict.outcome == "review":
            assert verdict.similar_of != "tender-rejected"

    def test_no_match_is_new(self, engine_rows):
        engine = DedupEngine(FakeClient(engine_rows))
        verdict = engine.evaluate(
            source_id="src-x",
            external_id="UNIQUE-42",
            organization_id=ORG_ID,
            title="Zebras crossing sign installation services",
            deadline=None,
        )
        assert verdict.outcome == "new"
        assert verdict.fingerprint

    def test_missing_organization_skips_similarity(self, engine_rows):
        engine = DedupEngine(FakeClient(engine_rows))
        similar_id, score = engine.find_similar(None, "anything at all")
        assert similar_id is None and score is None


class TestDuplicateCounter:
    def test_increment_uses_atomic_rpc(self, engine_rows):
        client = FakeClient(engine_rows)
        engine = DedupEngine(client)
        engine.increment_duplicate_count("tender-existing")
        assert client.rpc_calls == [
            ("increment_tender_duplicate_count", {"p_tender_id": "tender-existing"})
        ]
