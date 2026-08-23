# BidHubKH — Production Launch Runbook (Milestone 17)

Target: **web on Vercel, scraper on GitHub Actions schedule, data on Supabase**.
Owner actions below are the only manual steps; everything else is already in
the repo (`.github/workflows/ci.yml`, `.github/workflows/ingest.yml`).

---

## 0. Prerequisites (owner)

- [ ] GitHub repo pushed with this branch merged to `main`
- [ ] Vercel account (Hobby is fine to start)
- [ ] Supabase project dashboard access: <https://supabase.com/dashboard/project/acsdunwvgojvnlrziwuo>

## 1. Supabase production checks

- [ ] Migrations applied through `00004_data_quality` (done 2026-08-23 —
      verify under Database → Migrations or via `tenders.duplicate_count`)
- [ ] Connection model: serverless clients use the HTTP API (no IP
      allowlist issues for Vercel/GitHub runners). Direct Postgres
      connections, if ever needed, go through the pooler on port 6543.
- [ ] Auth → Sign In / Up providers enabled as used by `/login`, `/signup`

## 2. Vercel deploy

1. Import the repo into Vercel (framework auto-detects Next.js; root
   directory: `web/`).
2. Set Project Environment Variables (Production + Preview):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://acsdunwvgojvnlrziwuo.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → publishable/anon key |

   These are the only two env vars the web app reads (`grep process.env src`).
3. Deploy and confirm the production build passes.
4. Connect the custom domain (Domains tab) once the first deploy is green.

## 3. GitHub Actions secrets

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Used by | Where to get it |
|---|---|---|
| `SUPABASE_URL` | ingest | same URL as above |
| `SUPABASE_SERVICE_ROLE_KEY` | ingest | Dashboard → Settings → API → service_role (**server-only — never in web**) |
| `GEMINI_API_KEY` | ingest | aistudio.google.com (or leave empty if using OpenRouter) |
| `OPENROUTER_API_KEY` | ingest | openrouter.ai (or leave empty if using Gemini) |
| `OPENROUTER_MODEL` | ingest | e.g. `openrouter/auto` (optional) |
| `TELEGRAM_BOT_TOKEN` | ingest | from @BotFather |

First run: trigger manually via **Actions → Ingest tenders → Run workflow**
and watch it complete end-to-end. Scheduled runs then fire every 6 hours at
:17 UTC-offset intervals. Job-failure emails (GitHub default notifications)
are the first-line monitoring channel.

## 4. Post-deploy smoke checklist

Run top-to-bottom on the production URL:

1. Home page renders live tender count > 0
2. Catalog `/tenders` lists approved tenders; search/filter works
3. Open one tender detail page; documents render
4. Signup with a fresh account → dashboard loads
5. Save a tender → appears in dashboard saved list
6. Create an alert rule → visible in dashboard alerts
7. Pricing page renders all tiers
8. Admin path: as an admin/moderator account, approve a quarantined
   tender from `/admin`; confirm it becomes publicly visible
9. `/sources` health page shows live source stats
10. After the next scheduled ingest: fresh tenders appear with no local
    machine involved

## 5. Secrets exposure audit

Audited 2026-08-23 against full git history: **no real secrets were ever
committed** — only `scraper/.env.example` (placeholders). No key rotation
required. Keep it that way: service-role and bot tokens live in Actions
secrets / `.env` (gitignored), never in tracked files.

## 6. Known deferred items (post-launch backlog)

- Bakong Open API verification (demo click-to-confirm until then)
- Email alert channel; analytics events; Sentry-style monitoring
- Next.js `middleware` → `proxy` convention migration (build warning today)
- Move `pg_trgm` extension out of schema `public` (Supabase linter WARN)
