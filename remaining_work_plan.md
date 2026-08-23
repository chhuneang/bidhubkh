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

# Source-content verification & fabrication purge (2026-08-23, second sweep)

Owner asked to verify every tender's external link against what BidHubKH
displays. Result: **all 7 remaining public tenders failed verification** —
none of their content exists on any official portal:

| Row | Verdict |
|---|---|
| ADB-CAM-48218-CW03 | Project 48218 is **Nepal's** Rural Connectivity project; Cambodian RRIP III is 42334-018 |
| ADB-CAM-53240-002 | Project 53240 is GMS Cross-Border **Livestock** (-002 = Lao PDR), not energy |
| MOH/HSSP2/2026/G-045 | No trace anywhere; cited page (MPWT documents) has zero matches |
| MoEYS/STEPCam/2026/G-009 | STEPCam is UNESCO/GPE teacher-ed programme; no such tender |
| MPWT/RN5/2026/CW-028 | No 2026 NR5 IFB exists; JICA Phase III already contracted (>51% done Apr 2026) |
| MEF/GDPP/NCB/2026/G-014 | No trace; "GDPP" is not a known MEF procurement unit code |
| EDC NCB-2026-088 | URL serves EDC's apology/error page with HTTP 200 (soft-404) |

All 7 rejected with evidence annotations (DB now: 41 rows, all rejected,
0 public). Raw-payload forensics showed they were emitted **today** by
`fetch_raw()` fallbacks inside the adapters themselves.

## Fabrication purge in scraper sources

1. `adb.py` — "simulated notices" fallback deleted → honest `[]`
   (API is dead: `tests/fixtures/adb_kh/api_tenders_404.html`).
2. `mef.py` — `_get_active_ministry_tenders()` curated generator + invented
   `days_ahead` deadlines deleted → scrape-only, `[]` on failure.
3. `state_utilities.py` — hardcoded `sample_notices` replaced with a REAL EDC
   listing scraper (`/procurement_page/procurement`, `h3.procure-title`);
   verified live: returns 10 genuine notices with real detail URLs.
4. `ungm.py` — three invented UN notices deleted → probes public endpoint,
   `[]` until UNGM exposes server-rendered data (SPA documented).
5. `ngo_cambodia.py` — two invented NGO tenders replaced with a REAL ReliefWeb
   v2 client; blocked on owner registering an appname at
   https://apidoc.reliefweb.int then setting `RELIEFWEB_APPNAME` (v2 rejects
   unregistered appnames with 403; v1 is retired with 410).
6. `database/seed/003_sample_tenders.sql` deleted (fabricated demo rows);
   stale `fetch_raw_output_snapshot.json` fixtures deleted; tests rewritten so
   every adapter test asserts failure→`[]` and parsers run against captured or
   clearly-labelled-synthetic fixtures.

Rule going forward: **a source adapter may only emit data fetched from its
official source this run**. Empty is acceptable; invented is not.

# Post-M16 findings & decisions (2026-08-23)

Milestone 16 closed with commits `d48b830` (ruff), `9ddf26d` (test harness:
168 pytest offline w/ real-source fixtures + 65 vitest + CI), `ca7c840`
(bug fixes verified against live APIs).

## Fixed in `ca7c840`

1. **World Bank adapter ingested global tenders** — `countrycode_exact=KH`
   is silently ignored by the v2 API (verified: 0/50 results were
   Cambodia). Now `qterm=Cambodia` + `project_ctry_name` post-filter.
2. **WB `published_at` was always ingest-time** — payload key is
   `noticedate` ("17-Aug-2026"), not `proc_notice_date`; parse branch added.
3. **Dispatcher TypeError** when a matched tender had no title.

## Polluted live data (RESOLVED 2026-08-23)

Owner approved cleanup; executed the same day: all 27 non-Cambodian WB rows
rejected, then the 7 rows above after content verification. Reference SQL kept
for auditability:

All 27 `world_bank_kh` tenders currently `published`+`approved` are
non-Cambodian (Ethiopia 4, Mali 3, West Bank and Gaza 3, Sri Lanka 2,
plus others incl. 3 with no country field). Proposed reversible cleanup
(NOT executed):

```sql
UPDATE tenders t SET moderation_status = 'rejected'
FROM sources s, raw_tenders rt
WHERE s.id = t.source_id AND s.code = 'world_bank_kh'
  AND rt.external_id = t.external_id AND rt.source_id = t.source_id
  AND COALESCE(rt.raw_payload->>'project_ctry_name','') <> 'Cambodia';
```

## Backlog (found by tests, unfixed by design)

* `decision_matrix.ts`: NO_BID branch unreachable (min score 55 > 50);
  several clamps dead code.
* `bakong.ts`: KHQR TLV lengths use UTF-16 `.length`, not UTF-8 bytes —
  fix before real Bakong verification.
* `matching.ts`: matched/unmatched overlap quirk; parsed requirements
  never consulted.
* WB keyword classifier: naive substring ("sanitation" → it-telecom).
* Adapter drift: ADB listing needs browser UA (API path dead); MEF host
  DNS-fails; UNGM API paths redirect to GenericError; ReliefWeb needs an
  approved appname — fixtures + `_capture_note` files document each.

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
