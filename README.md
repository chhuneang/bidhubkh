# BidHubKH (ប៊ីតហាប់) — Cambodian Tender Intelligence Platform

> **Find → Understand → Match → Decide → Bid**

BidHubKH aggregates publicly available procurement opportunities in Cambodia across government ministries, development institutions (World Bank, ADB), UN agencies, and NGOs, providing structured search, alerts, and AI-powered tender intelligence.

---

## 📁 Repository Structure

```text
bidhubkh/
├── web/                 # Next.js 15 App Router Frontend + Supabase SSR
├── database/            # PostgreSQL migrations, RLS policies, and seed data
│   ├── migrations/      # 00001_initial_schema.sql, 00002_rls_policies.sql
│   └── seed/            # Categories, sources, organizations, sample tenders
├── scraper/             # Python data ingestion pipeline & adapters
└── docs/                # Architecture and database documentation
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL files in `database/migrations/` in order:
   - `00001_initial_schema.sql`
   - `00002_rls_policies.sql`
3. Run the seed data files in `database/seed/`:
   - `001_categories.sql`
   - `002_sources.sql`
   - `003_sample_tenders.sql`

### 2. Web Application Setup
```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

### 3. Ingestion Engine Setup
```bash
cd scraper
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

---

## 🛡️ License
Proprietary / All rights reserved.
