# BidHubKH — System Architecture & Design Document

## 1. Overview
**BidHubKH** is a specialized procurement intelligence platform for the Cambodian market. It automates the discovery, extraction, deduplication, categorization, and matching of public tender opportunities.

```text
[External Data Sources]
   ├── World Bank API (KH)
   ├── ADB API / RSS (CAM)
   ├── MEF / GDPP Portal (Scraper)
   ├── FMIS Portal (Scraper)
   └── UNGM / NGO Portals
          │
          ▼
[Python Ingestion Engine] (scraper/)
   ├── 1. Fetcher / Adapter
   ├── 2. Raw Storage (raw_tenders)
   ├── 3. Normalizer & Cleaners
   ├── 4. Fingerprint & Deduplication
   └── 5. Database Upsert (PostgreSQL)
          │
          ▼
[Supabase Backend] (PostgreSQL + Auth + Storage)
   ├── Core Tables (tenders, organizations, categories)
   ├── User Entities (companies, saved_tenders, alerts)
   ├── Row Level Security (RBAC: user, moderator, admin)
   └── Full-Text Search (English tsvector + trigram fuzzy)
          │
          ▼
[Next.js Web Application] (web/)
   ├── Public Discovery (Search, Filters, Detail, SEO)
   ├── User Dashboard (Saved pipelines, Alerts, Company profile)
   ├── Admin Console (Tender moderation, Scraper health monitoring)
   └── AI Intelligence (Gemini 2.0 Flash PDF extraction & summaries)
```

---

## 2. Ingestion Pipeline Details

### Ingestion Flow:
1. **Source Adapters**: Each source implements a standard `BaseSource` interface providing `fetch()`, `parse()`, and `normalize()`.
2. **Raw Data Preservation**: Before any normalization or deduplication, raw HTML/JSON payloads are saved to `raw_tenders` along with a SHA-256 hash.
3. **Deduplication Engine**:
   - Primary key match on `(source_id, external_id)`.
   - Fingerprint matching on `(normalized_organization, normalized_title, deadline)` to catch cross-posted tenders across different aggregator sites.
4. **Validation & Moderation**:
   - Dates validated (`deadline > published_at`).
   - Confidence scoring computed based on completeness of essential fields (deadline, value, contact, requirements).
   - High confidence tenders auto-publish; edge cases flagged for moderator review.

---

## 3. Database & Security
* Built on PostgreSQL (Supabase).
* All tables enforce Row Level Security (RLS).
* Admins are verified through Postgres `user_roles` table with `is_admin()` and `is_moderator()` security definer functions.
* Full-text search leverages PostgreSQL GIN indexes and `pg_trgm` for resilient search even with slight typographical errors or varying transliterations.
