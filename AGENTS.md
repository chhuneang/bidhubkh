# BidHubKH — Agent Context & State Handbook

Welcome, AI Agent! This document tracks the exact architectural decisions, completed work, live database state, and immediate next steps for **BidHubKH**.

---

## 🎯 Project Overview
**BidHubKH** is a Cambodian tender intelligence platform that aggregates official procurement opportunities (Government Ministries, World Bank, Asian Development Bank, UN, NGOs) and delivers AI-assisted tender summaries and supplier matching.

* **Business Plan**: [business_plan.md](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/business_plan.md)
* **Coding Plan**: [coding_plan.md](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/coding_plan.md)
* **Architecture Docs**: [docs/architecture.md](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/docs/architecture.md) & [docs/database.md](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/docs/database.md)

---

## 🏗️ Architecture & Technology Stack
* **Frontend (`web/`)**: Next.js 15 (App Router, Turbopack, TypeScript, Tailwind CSS, Lucide icons).
* **Backend & Database (`database/`)**: Supabase PostgreSQL + Auth + Storage.
* **Scraper Engine (`scraper/`)**: Python 3.x worker (`requests`, `pydantic`, `supabase`, `python-dotenv`).
* **Live Supabase Project Reference**: `acsdunwvgojvnlrziwuo` (Linked via MCP).

---

## ✅ Completed Milestones

### Milestone 01 — Project Foundation & Web App
- Initialized Next.js 15 App Router in `web/` with responsive design system and glassmorphic UI tokens.
- **Routes Implemented**:
  - `/` ([web/src/app/page.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/page.tsx)) — Hero search, sector categories, live metric badges, and value proposition cards.
  - `/tenders` ([web/src/app/tenders/page.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/tenders/page.tsx)) — Live search and category filters querying Supabase PostgreSQL.
  - `/tenders/[slug]` ([web/src/app/tenders/[slug]/page.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/tenders/%5Bslug%5D/page.tsx)) — Dynamically renders live tender details, structured AI summary, scope of supply, eligibility checklist, and working official external links to World Bank / ADB source portals.
  - `/admin` ([web/src/app/admin/page.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/admin/page.tsx)) — Live source health monitor and tender moderation queue connected to PostgreSQL.
- Verified with `npm run build` (0 TypeScript / lint errors).

### Milestone 02 — Database Schema & Supabase Integration
- Applied migrations:
  - `database/migrations/00001_initial_schema.sql` (11 tables, triggers, GIN full-text search indexes).
  - `database/migrations/00002_rls_policies.sql` (RLS security policies & RBAC helpers `is_admin`, `is_moderator`).
- Loaded seed taxonomies (`001_categories.sql`, `002_sources.sql`, `003_sample_tenders.sql`).
- Generated TypeScript types directly into [web/src/types/database.types.ts](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/types/database.types.ts).

### Milestone 03 & 04 — Live Ingestion Adapters & Supabase Upsert
- Built abstract adapter contract in [scraper/sources/base.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/base.py).
- **Source #1 (World Bank Cambodia API)**: [scraper/sources/world_bank.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/world_bank.py).
- **Source #2 (Asian Development Bank Cambodia)**: [scraper/sources/adb.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/adb.py).
- Built [scraper/pipeline.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/pipeline.py) and [scraper/ingest.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/ingest.py). Actively tested and writing live data directly to Supabase (`raw_tenders` and `tenders`).

### Milestone 08 — AI Tender Intelligence & Summarization Engine
- Built [scraper/extractors/gemini_extractor.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/extractors/gemini_extractor.py) powered by **Google Gemini 2.0 Flash** (`google-genai`).
- Extracts structured outputs: 2-3 sentence executive summaries, key buyer intent, product specifications, and mandatory supplier qualification checklists.
- Wired directly into the ingestion pipeline to automatically enrich all incoming notices in Supabase.

---

## 📋 Recommended Next Steps for the Next AI Agent

1. **Source #3: Cambodian Government Portal Ingestion**:
   - Build adapter for General Department of Public Procurement (MEF / GDPP) or FMIS HTML scraping in [scraper/sources/mef.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/mef.py).
2. **User Authentication & Supplier Company Profiles (Milestones 07 & 09)**:
   - Wire Supabase Auth (Email/Password & Google OAuth) to `/login` and `/dashboard` for supplier profiles, bookmarked tenders, and email/Telegram alert subscriptions.
3. **AI Supplier Matching (Milestone 09)**:
   - Match company product catalogs against extracted tender requirements to calculate qualification match percentages (e.g. "92% Match").

---

## 🛠️ Essential Commands
* **Run web locally**: `cd web && npm run dev`
* **Verify web build**: `cd web && npm run build`
* **Run data scraper**: `python -m scraper.ingest --source all`
* **Supabase MCP tools**: `list_tables`, `execute_sql`, `get_publishable_keys`, `get_project_url`
