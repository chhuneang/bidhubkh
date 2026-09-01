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
  - `database/migrations/00002_rls_policies.sql` (RLS security policies & RBAC helpers `is_admin`, `is_moderator`; relocated to the non-exposed `helpers` schema by `00006_hide_rbac_helpers.sql`).
- Loaded seed taxonomies (`001_categories.sql`, `002_sources.sql`; `003_sample_tenders.sql` was deleted 2026-08-23 — its fabricated demo tenders were never real notices).
- Generated TypeScript types directly into [web/src/types/database.types.ts](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/types/database.types.ts).

### Milestone 03 & 04 + Expansion Pack — 6 Live Ingestion Adapters & Supabase Upsert
- Built abstract adapter contract in [scraper/sources/base.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/base.py).
- **Source #1 (World Bank Cambodia API)**: [scraper/sources/world_bank.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/world_bank.py).
- **Source #2 (Asian Development Bank Cambodia)**: [scraper/sources/adb.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/adb.py).
- **Source #3 (Cambodian Government MEF / GDPP)**: [scraper/sources/mef.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/mef.py) — Ingests official national procurement packages across ministries.
- **Source #4 (UN Global Marketplace - UNGM)**: [scraper/sources/ungm.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/ungm.py) — UNDP, UNICEF, WHO, WFP, UNOPS Cambodia.
- **Source #5 (Cambodia NGO & Civil Society)**: [scraper/sources/ngo_cambodia.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/ngo_cambodia.py) — ReliefWeb & NGO procurement.
- **Source #6 (State-Owned Utilities EDC / PPWSA)**: [scraper/sources/state_utilities.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/sources/state_utilities.py) — Electricité du Cambodge & Water Authority.
- **Deep AI PDF Attachment Parser**: [scraper/extractors/pdf_parser.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/extractors/pdf_parser.py).
- **Autonomous Ingestion Scheduler**: [scraper/scheduler.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/scheduler.py).

### Milestone 07 — User Authentication & Supplier Dashboard
- Built Supabase Auth integration:
  - `/login` ([web/src/app/login/page.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/login/page.tsx)) — Email/Password & Google Workspace OAuth with Suspense handling.
  - `/signup` ([web/src/app/signup/page.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/signup/page.tsx)) — Supplier onboarding and automatic company record provisioning.
  - `/auth/callback` ([web/src/app/auth/callback/route.ts](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/auth/callback/route.ts)) — Secure PKCE OAuth session exchange.
- Built **Supplier Dashboard** (`/dashboard`):
  - **Saved Bids Pipeline**: Interactive stage management (*Interested → Reviewing Specs → Preparing Bid → Submitted → Won 🎉 / Lost*), tracking total pipeline value in USD.
  - **Company Profile & Catalog**: Edit business name, GDT Tax ID, MoC number, operating location, and description.
  - **Tender Alert Rules**: Automated notification rule creation and management.
- Built interactive [SaveTenderButton.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/components/tenders/SaveTenderButton.tsx) component wired to Supabase `saved_tenders`.

### Milestone 08 — AI Tender Intelligence & Multi-Provider Engine
- Built unified multi-provider AI extraction engine in [scraper/extractors/ai_extractor.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/extractors/ai_extractor.py).
- Supported AI providers:
  - **OpenRouter** ([openrouter_extractor.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/extractors/openrouter_extractor.py)): Active with verified high-speed free models and intelligent failovers.
  - **Google Gemini Flash** ([gemini_extractor.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/extractors/gemini_extractor.py)): Direct API backup.
  - **Deterministic Rule Fallback**: Ensures 100% scraper uptime if offline.
- Enriches every incoming tender with 2-3 sentence executive summaries, bill of materials, and mandatory compliance checklists.

### Milestone 09 — AI Supplier Matching & Qualification Score
- Built multi-factor qualification engine in [web/src/lib/matching.ts](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/lib/matching.ts) calculating match percentage (0-100%), verified company strengths, missing document gap analysis, and recommended next actions.
- Built interactive [SupplierMatchCard.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/components/tenders/SupplierMatchCard.tsx) rendered directly on tender detail pages ([/tenders/[slug]](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/tenders/%5Bslug%5D/page.tsx)).
- Enhanced **Supplier Dashboard** ([/dashboard](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/dashboard/page.tsx)) with a dedicated **"AI Matched Opportunities"** ranking tab and dynamic product catalog keyword manager.

### Milestone 10 — Telegram & Email Alert Notification Dispatcher
- Built Telegram Bot client in [scraper/notifications/telegram_bot.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/notifications/telegram_bot.py) with structured markdown broadcast cards.
- Built real-time notification matcher in [scraper/notifications/dispatcher.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/notifications/dispatcher.py) wired directly to Supabase `alerts` table and scraper pipeline.
- Added Telegram Chat ID / Channel linking support to the Supplier Dashboard alert rule manager.

### Milestone 11 — AI Bid / No-Bid Decision Matrix & Win Probability Calculator
- Built multi-variable strategic assessment engine in [web/src/lib/decision_matrix.ts](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/lib/decision_matrix.ts) computing:
  - 🎯 **Win Probability Score (0–100%)**
  - 📊 **4-Dimension Score Breakdown** (Technical Capability, Commercial Margin, Timeline Feasibility, Compliance Ease)
  - 🚨 **Risk & Strategic Advantage Identification**
  - 🚀 **Executive Go / No-Go Recommendations** (*Bid with Confidence*, *Bid with Caution / Consortium*, *No-Bid Recommended*)
- Built interactive [BidDecisionMatrixCard.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/components/tenders/BidDecisionMatrixCard.tsx) with one-click Decision Memo export/print support.

### Milestone 12 — Monetization & Subscription Tiers (Bakong KHQR + Stripe)
- Applied database migrations in `database/migrations/00003_subscriptions_and_billing.sql` creating `subscription_plans`, `user_subscriptions`, and `payment_transactions`.
- Built National Bank of Cambodia (NBC) KHQR EMVCo dynamic QR code generator in [web/src/lib/bakong.ts](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/lib/bakong.ts).
- Built interactive pricing page ([/pricing](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/pricing/page.tsx)) with **USD ($) / KHR (៛)** currency switcher and 3 tiers (Free Starter, Pro Supplier, Enterprise GovTech).
- Built interactive [BakongCheckoutModal.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/components/billing/BakongCheckoutModal.tsx) with real-time countdown timer and instant payment confirmation.
- Enhanced **Supplier Dashboard** ([/dashboard](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/dashboard/page.tsx)) with a dedicated **"Plan & Bakong Billing"** management tab.

### Milestone 13 — Automated URL Health Sentinel & Anti-404 Validator
- Built multi-threaded URL verification engine in [scraper/link_sentinel.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/link_sentinel.py) with authoritative Cambodian portal mapping for Government ministries (MEF/GDPP, MPWT, MoEYS), Multilateral Banks (World Bank, ADB), UN agencies (UNGM), State Utilities (EDC, PPWSA), and NGO portals.
- Integrated URL health pre-validation into [scraper/pipeline.py](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/scraper/pipeline.py) before writing notices to PostgreSQL.
### Milestone 14 — Minimal, Clean & Friendly Light UI Theme Overhaul
- Completely transitioned the application design system to a minimal, clean, and friendly light palette:
  - **Background**: `#F8FAFC` (`bg-slate-50`)
  - **Surfaces/Cards**: `#FFFFFF` (`bg-white border-slate-200 shadow-xs`)
  - **Primary**: `#2563EB` (`bg-blue-600`)
  - **Typography**: Crisp high-contrast slate text (`text-slate-900`, `text-slate-700`, `text-slate-500`).
- Restyled all 14 application routes: Home (`/`), Catalog (`/tenders`), Details (`/tenders/[slug]`), Pricing (`/pricing`), Dashboard (`/dashboard`), Sources Health (`/sources`), Admin (`/admin`), and Auth (`/login`, `/signup`).
- Created dedicated public **Sources Health & Ingestion Sentinel** page at `/sources` exposing real-time crawler uptime across all 6 Cambodian official portals.
- Completely revamped **Bid Pipeline** with stage count badges, stage color hierarchy, card-interactive hover states, and framed tab docks.
- Verified zero build/TypeScript errors (`npm run build`).

### Milestone 15 — Database Integrity, SQL Optimization & 100% Authentic Source Cleanse
- Executed comprehensive database audit and applied migration `database/migrations/00007_database_integrity_and_indexes.sql`:
  - **Covering Foreign Key Indexes**: Added 10 indexes on `alerts`, `categories`, `company_products`, `payment_transactions`, `saved_tenders`, `tender_documents`, `tenders`, and `user_subscriptions`.
  - **RLS Subquery Wrapping**: Optimized `auth.uid()` evaluation to `(select auth.uid())` across all RLS policies.
  - **Cleaned Foreign Notices**: Purged non-Cambodian stray notices from World Bank global queries.
  - **Standardized 6 Cambodian Sources**: Ensured `world_bank_kh`, `adb_kh`, `mef_gdipp`, `ungm`, `ngo_cambodia`, and `state_utilities` are `active = true` and `auto_approve = true`.
  - **Expanded Organizations Registry**: Provisioned 14 official Cambodian procuring entities with bilingual Khmer/English metadata.

### Milestone 16 — Security Lockdown, 100% Free Platform & Zero-404 PDF Dossier Generator
- Applied and recorded cloud migrations in Supabase history:
  - `00007_database_integrity_and_indexes.sql`
  - `00008_tender_documents_and_specific_links.sql`
  - `00009_scraper_ingestion_permissions.sql`
  - `00010_security_lockdown.sql`
- **Security Hardening**:
  - Dropped all world-open anonymous write policies on `tenders`, `raw_tenders`, `sources`, and `tender_documents`. The automated crawler authenticates via `SUPABASE_SERVICE_ROLE_KEY`.
  - Revoked public RPC execution on `increment_tender_duplicate_count(uuid)` from `anon` and `authenticated`.
  - Moved `pg_trgm` extension out of public schema to `extensions`.
  - Consolidated all RLS policies across `user_roles`, `sources`, `tenders`, `raw_tenders`, and `tender_documents` with 0 permissive-policy warnings.
  - Seeded initial admin role in `public.user_roles` for `eangliver2xyz@gmail.com`.
- **100% Free Platform Transition**:
  - Removed paid pricing tiers and Bakong billing modals; simplified the platform to 100% free open access for Cambodian suppliers.
  - Legacy billing tables (`user_subscriptions`, `payment_transactions`) locked to service-role only.
- **Server-Side Official Bidding Document PDF Generator**:
  - Created dynamic high-resolution PDF generation endpoint at `/api/tenders/[slug]/pdf`.
  - Implemented Khmer Unicode numeral and text Romanization/sanitization, eliminating mojibake corruptions in standard PDF viewers.
  - Formatted 2-column non-overlapping metadata box and structured BoQ/compliance checklists with direct official portal verification links.
- **Automated Verification**:
  - Verified 56 / 56 frontend Vitest tests + 167 / 167 scraper Pytest tests (223 / 223 passing).
  - Verified unauthenticated public read (`anon` role) on published tenders and documents.

### Milestone 17 — Backend REST API Perfection, 8 Verified Source Expansion & Currency Engine (TDD)
- **Next.js Backend REST API Layer**:
  - `GET /api/tenders`: Advanced public catalog query endpoint with pagination, keyword search, sector category filter, source portal filter, and value range sorting.
  - `GET /api/tenders/[slug]`: Deep-relational single tender detail API with associated organization, source, category, attachments, and AI summary.
  - `GET /api/sources`: Real-time source health & crawler status API.
  - `GET /api/currency`: Real-time currency exchange rates service endpoint supporting USD ($), KHR (៛), EUR (€), and JPY (¥) with NBC baseline fallback.
  - `POST /api/match`: AI Supplier Qualification & Tender Match calculation API.
  - `POST /api/decision-matrix`: Win Probability & Bid/No-Bid Decision Matrix calculation API.
- **8 Official Verified Sources & Ingestion Adapters**:
  - `world_bank_kh` (World Bank Cambodia)
  - `adb_kh` (Asian Development Bank Cambodia)
  - `mef_gdipp` (General Department of Public Procurement / MEF)
  - `ungm` (UN Global Marketplace - UNDP, UNICEF, WHO, WFP)
  - `jica_kh` (**NEW**: Japan International Cooperation Agency Cambodia)
  - `afd_eu_kh` (**NEW**: Agence Française de Développement & European Union Cambodia)
  - `ngo_cambodia` (ReliefWeb & NGO Portals)
  - `state_utilities` (Electricité du Cambodge & Phnom Penh Water Authority)
- **Database Migration & Link Sentinel**:
  - Applied `00012_expand_verified_sources.sql` in Supabase PostgreSQL registering all 8 sources and official procuring entities.
  - Registered `jica.go.jp`, `afd.fr`, and `eeas.europa.eu` in `scraper/link_sentinel.py`.
- **Strict TDD Verification**:
  - 80 / 80 frontend Vitest tests passing (`npm run test`).
  - 173 / 173 scraper Pytest tests passing (`python -m pytest`).
  - 18 / 18 routes compiled cleanly in `npm run build` with 0 errors.

### Milestone 18 — AI Bid Proposal Co-Pilot & Drafting Workspace (TDD)
- **Modular 5-Section Proposal Generation Engine**:
  - Built pure generation engine in [web/src/lib/proposal_engine.ts](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/lib/proposal_engine.ts) generating tailored, compliant dossiers:
    1. Executive Cover Letter & Submission Memo
    2. Scope of Work & Technical Methodology (BoQ & QA/QC alignment)
    3. Mandatory Compliance & Eligibility Matrix (GDT Tax clearance, MoC patent, certifications)
    4. Project Team & Delivery Schedule Milestones
    5. Commercial Pricing & Milestone Payment Framework
- **Smart Context-Aware Bilingual Output**:
  - Auto-selects Khmer (ភាសាខ្មែរ) for government/SOE tenders (MEF, EDC) and English for international development partners (World Bank, ADB, UNGM, JICA, AFD).
  - Instant toggle between **English (EN)**, **Khmer (KM)**, and **Bilingual Dual (EN/KM)** output.
- **REST API Layer & Supabase Persistence**:
  - `POST /api/proposals/generate` — On-demand proposal section generation endpoint.
  - `GET /api/proposals` — User saved proposals catalog API.
  - `POST /api/proposals` — Save & update proposal drafts.
  - `DELETE /api/proposals/[id]` — Remove proposal draft.
  - Applied migration `database/migrations/00013_proposals_schema.sql` creating `public.proposals` with RLS policies and covering indexes.
- **Interactive UI & Studio Workspace**:
  - Built [ProposalCoPilotModal.tsx](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/components/proposals/ProposalCoPilotModal.tsx) with live markdown editor, tabbed section preview, and multi-format export (**Save Draft**, **Markdown .md Download**, **Copy to Clipboard**, **Print/PDF**).
  - Added primary trigger button on Tender Detail page ([/tenders/[slug]](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/tenders/%5Bslug%5D/page.tsx)).
  - Added dedicated **"Proposal Drafts"** workspace tab in Supplier Dashboard ([/dashboard](file:///c:/Users/eangl/OneDrive/Desktop/bidhubkh/web/src/app/dashboard/page.tsx)).
- **Strict TDD Verification**:
  - 96 / 96 frontend Vitest tests passing (`npm run test`).
  - 173 / 173 scraper Pytest tests passing (`python -m pytest`).
  - 21 / 21 routes compiled cleanly in `npm run build` with 0 errors.

---

## 🏆 Project Completion Status: 18 / 18 Milestones Completed & Fully Audited
All 18 milestones are fully implemented, verified, tested against Supabase PostgreSQL, and 100% production-ready.

---

## 🛠️ Essential Commands
* **Run web locally**: `cd web && npm run dev`
* **Verify web build**: `cd web && npm run build`
* **Run web tests**: `cd web && npm run test`
* **Run data scraper**: `python -m scraper.ingest --source all`
* **Run scraper tests**: `python -m pytest`
* **Run scraper scheduler**: `npm run scheduler` (or `npm run scheduler:4h`)
* **Supabase MCP tools**: `list_tables`, `execute_sql`, `get_publishable_keys`, `get_project_url`, `get_advisors`



