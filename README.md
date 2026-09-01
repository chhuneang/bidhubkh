# BidHubKH (ប៊ីតហាប់) — Cambodian Tender Intelligence Platform

> **Find → Understand → Match → Decide → Bid**

**BidHubKH** is Cambodia's premier B2B procurement intelligence platform. It aggregates official public tenders across Cambodian Government Ministries (MEF, MPWT, MoEYS, MoH), multilateral development banks (World Bank, Asian Development Bank), UN agencies, and NGOs — delivering AI-assisted tender summaries, supplier qualification matching, win probability scoring, and real-time Telegram alerts.

---

## ✨ Key Features & Architectural Capabilities

1. 🏛️ **Multi-Source Procurement Ingestion**:
   - **World Bank Cambodia**: Official Procurement Notices API collector.
   - **Asian Development Bank (ADB) Cambodia**: Development project opportunities scraper.
   - **Cambodian Government (MEF / GDPP)**: National competitive bidding packages across ministries.

2. 🤖 **Multi-Provider AI Tender Intelligence**:
   - Powered by OpenRouter free intelligence engine and Google Gemini Flash.
   - Generates executive 2-3 sentence summaries, line-item Bill of Materials, and mandatory compliance checklists.

3. 🎯 **AI Supplier Matching & Qualification Score**:
   - Multi-factor qualification engine (0–100%) checking technical scope alignment, GDT Tax Patent verification, and missing prerequisite gap analysis.

4. 🚀 **AI Bid / No-Bid Decision Matrix & Win Probability**:
   - 4-dimension evaluation (Capability Fit, Margin Viability, Timeline Feasibility, Compliance Ease).
   - Executive verdicts (*Bid with Confidence*, *Bid with Caution / Consortium*, *No-Bid*).
   - One-click Decision Memo export and printing.

5. ✈️ **Real-Time Telegram Tender Alert Bot**:
   - Automated notification dispatcher that evaluates incoming tenders against supplier keyword/budget rules and pushes rich markdown cards to Telegram chats and channels.

6. 🏢 **Supplier Pipeline & Dashboard**:
   - Saved bids Kanban pipeline (*Interested → Reviewing → Preparing Bid → Submitted → Won 🎉 / Lost*).
   - Dynamic product catalog keyword manager.
   - Company registration credentials manager (Tax ID, MoC number).

---

## 📁 Repository Structure

```text
bidhubkh/
├── web/                 # Next.js 15 App Router Frontend + Supabase SSR + Tailwind CSS
│   ├── src/app/         # Next.js Routes (/tenders, /dashboard, /login, /signup, /admin)
│   ├── src/components/  # UI Components (BidDecisionMatrix, SupplierMatch, SaveButton, Header)
│   └── src/lib/         # Business logic (matching.ts, decision_matrix.ts, supabase)
├── scraper/             # Python 3.x Scraper Engine & AI Enrichment Pipeline
│   ├── sources/         # Ingestion adapters (world_bank.py, adb.py, mef.py)
│   ├── extractors/      # AI engines (openrouter_extractor.py, gemini_extractor.py)
│   └── notifications/   # Telegram bot & Dispatcher (telegram_bot.py, dispatcher.py)
├── database/            # PostgreSQL migrations, RLS security policies, and seed data
│   ├── migrations/      # 00001_initial_schema.sql, 00002_rls_policies.sql
│   └── seed/            # Categories, sources, organizations, sample tenders
└── docs/                # Architecture and database documentation
```

---

## 🚀 Quick Start Guide

### 1. Web Application
```bash
cd web
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Ingestion & AI Scraper Pipeline
```bash
# Ingest all live procurement sources and enrich with AI:
python -m scraper.ingest --source all

# Or run individual adapters:
python -m scraper.ingest --source mef_gdipp
python -m scraper.ingest --source world_bank
python -m scraper.ingest --source adb
```

### 3. Telegram Alert Dispatcher
```bash
# Test alert broadcasting directly to a Telegram Chat / Channel ID:
python -m scraper.notifications.dispatcher --chat-id YOUR_CHAT_ID
```

---

## 🛠️ Technology Stack
* **Frontend**: Next.js 15 (App Router, Turbopack, React 19, TypeScript, Tailwind CSS, Lucide Icons).
* **Database & Auth**: Supabase PostgreSQL 15, Row-Level Security (RLS), OAuth 2.0.
* **Scraper Engine**: Python 3.x (`requests`, `pydantic`, `supabase`, `python-dotenv`).
* **AI Intelligence**: OpenRouter (Multi-model free tier), Google Gemini Flash.
* **Notifications**: Telegram Bot API (`sendMessage`), Supabase Alerts Engine.

---

## 🛡️ License
Proprietary / All rights reserved.
