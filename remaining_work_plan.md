# BidHubKH — Remaining Work Plan (Milestones 15–17)

Status baseline: coding_plan.md Phases 1–24 reviewed against actual code on 2026-08-23.
All original 11 milestones are built. This plan closes the gaps found between the
documentation claims and the code, plus production launch.

## Decisions locked with owner (2026-08-23)

1. **Payments**: Deferred. Real Bakong API verification is postponed to a later
   cycle; demo-mode click-to-confirm stays in place until then.
2. **Data quality**: Full pass — deduplication, validation rules, and admin review flow.
3. **Deployment**: Web on Vercel, scraper on GitHub Actions schedule.
4. **Scope**: Testing harness included. Email alerts, analytics events, and Sentry-style
   monitoring are deferred to the post-launch backlog.

---

# Milestone 15 — Data Quality Engine (Plan Phases 8–10, completed)

## Problem

* `scraper/pipeline.py` reports a hardcoded `duplicates: 0`; no dedup exists.
* Plan Phase 9 validation rules are absent; malformed rows can publish.
* Pipeline writes `moderation_status: "approved"` directly — the admin review
  queue receives nothing.

## Tasks

### 15a — Validation rules (`scraper/validators/rules.py`)

* Enforce: `deadline > published_at`, `estimated_value >= 0`,
  `currency ∈ {USD, KHR}`, `original_url` well-formed, non-empty `title`
  and organization.
* Produce a confidence score per tender (existing field) and a list of
  validation errors.
* Failed-critical rules → tender saved with `moderation_status: 'quarantined'`,
  never public.

### 15b — Deduplication (`scraper/processors/dedup.py`)

* Layer 1 — exact: `source_id + external_id` upsert (already works).
* Layer 2 — fingerprint: SHA-256 of `(organization_id, normalized_title,
  deadline)`; collision → skip insert, increment `duplicate_count` for real.
* Layer 3 — similarity: `rapidfuzz.token_sort_ratio` on titles within same
  organization ≥ 88 → save with `moderation_status: 'duplicate_review'`
  plus link to suspected original.
* Normalization helpers: lowercase, strip punctuation, expand common
  abbreviations (e.g. `Min.` → `Ministry`).

### 15c — Moderation flow

* Migration `00004_data_quality.sql`:
    * `tenders.duplicate_of_id uuid references tenders(id)`
    * `tenders.validation_errors jsonb default '[]'`
    * Index on `(moderation_status, created_at desc)`
    * Extend RLS: only `moderation_status = 'approved'` is publicly readable;
      admins read all states.
* Pipeline writes new tenders as `moderation_status: 'pending'` by default,
  with a per-source trust override in the `sources` table
  (`auto_approve boolean`) so verified feeds can still auto-publish.
* Public queries (home, catalog, detail, search) must all filter
  `moderation_status = 'approved'` — audit each query in
  `page.tsx` files and centralize into a shared query helper.
* Admin dashboard: wire Approve / Reject / Mark-duplicate actions to the
  pending and duplicate_review queues; show validation errors inline.

## Acceptance criteria

* Re-ingesting the same source twice yields zero net-new rows.
* A tender failing critical validation never appears on the public site.
* New tenders from untrusted sources sit in `/admin` until approved.

## Commit checkpoint

`feat(data-quality): dedup engine, validation rules, and moderation flow`

---

# Milestone 16 — Testing Harness + CI

## Tasks

* Python (`pytest`, `requirements-dev.txt`):
    * Fixtures: saved HTML/JSON snapshots from all 6 real sources under
      `scraper/tests/fixtures/` — no test hits the live internet.
    * Parser/normalizer tests per adapter (World Bank, ADB, MEF, UNGM,
      NGO, Utilities).
    * Validator rules table-driven tests.
    * Dedup layer tests incl. fuzzy-threshold boundary cases.
    * Dispatcher rule-matching tests (keyword, budget bounds).
* TypeScript (`vitest`):
    * `matching.ts` score math + gap analysis.
    * `decision_matrix.ts` win-probability boundaries.
    * `bakong.ts` CRC16/KHQR goldens.
* GitHub Actions `ci.yml`: on every push/PR —
  `npm run build` + vitest in `web/`, pytest in root, ruff lint for scraper.

## Acceptance criteria

* CI green gate required before any merge; suite runs < 3 minutes offline.

## Commit checkpoint

`test: full pytest + vitest harness with real-source fixtures and CI`

---

# Milestone 17 — Production Launch

## Tasks

* **Vercel**: import repo, set env vars (Supabase URL/anon key),
  verify production build, connect domain.
* **GitHub Actions `ingest.yml`**: cron every 6 hours →
  `python -m scraper.ingest --source all` with secrets
  (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, AI provider keys,
  Telegram bot token) from repo settings; upload run summary artifact;
  job-failure email notifications serve as first-line monitoring.
* Confirm Supabase production project allows the GitHub Actions runner IP
  model (pooler connection, no IP allowlist surprises).
* Smoke checklist post-deploy: signup → save tender → alert creation →
  pricing page → admin approval path on a quarantined tender.
* Rotate any keys that ever lived in `.env` files committed historically.

## Acceptance criteria

* Fresh tenders appear on the live site without anyone touching a laptop.

## Commit checkpoint

`chore(deploy): Vercel production config and scheduled ingestion workflow`

---

# Deferred backlog (explicitly NOT in this cycle)

| Item | Why deferred |
|------|--------------|
| **Bakong Open API verification** | Postponed by owner. Demo-mode click-to-confirm stays live meanwhile — revisit before charging real customers |
| Email alert channel (Resend etc.) | Telegram works today; add when users ask |
| Analytics events (Phase 23) | Plan positions it after user validation |
| Sentry-style app monitoring | GH Actions failure emails + /sources page cover launch needs |
| Mobile app, marketplace, proposal generation | Plan §32 exclusion list stands |

---

# Execution order & rule

```text
15 Data Quality  →  16 Testing + CI  →  17 Launch
```

Testing (16) is listed after 15 but its suites land alongside each milestone —
no milestone merges without its tests green, per the Final Development Rule in
`coding_plan.md` §36.

## Owner prerequisites before starting

1. Vercel account + GitHub repo access for Actions secrets.
