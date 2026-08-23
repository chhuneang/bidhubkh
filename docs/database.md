# BidHubKH — Database Schema Documentation

## Core Tables

| Table | Description | Primary Key | Key Relationships |
|---|---|---|---|
| `sources` | Registry of tender sources (APIs, portals) | `id` (UUID) | - |
| `organizations` | Buying organizations (ministries, banks, NGOs) | `id` (UUID) | - |
| `categories` | Hierarchical taxonomy of procurement categories | `id` (UUID) | `parent_id` -> `categories(id)` |
| `raw_tenders` | Immutable raw data audit table | `id` (UUID) | `source_id` -> `sources(id)` |
| `tenders` | Clean normalized tender opportunities | `id` (UUID) | `source_id`, `organization_id`, `category_id` |
| `tender_documents` | Attached PDFs, TORs, and bidding documents | `id` (UUID) | `tender_id` -> `tenders(id)` |
| `user_roles` | RBAC mapping (`admin`, `moderator`, `user`) | `id` (UUID) | `user_id` -> `auth.users(id)` |
| `companies` | Business profile of registered suppliers | `id` (UUID) | `user_id` -> `auth.users(id)` |
| `company_products` | Product & service keywords for AI matching | `id` (UUID) | `company_id` -> `companies(id)` |
| `saved_tenders` | User bookmarks and pipeline stage tracking | `id` (UUID) | `user_id`, `tender_id` |
| `alerts` | Notification rules & keyword subscriptions | `id` (UUID) | `user_id`, `category_id`, `organization_id` |

## Migration Guide

Execute the migrations in sequential order:
1. `database/migrations/00001_initial_schema.sql` (Creates extensions, enums, tables, triggers, and indexes)
2. `database/migrations/00002_rls_policies.sql` (Enables RLS and configures security policies)
3. `database/seed/001_categories.sql` (Inserts category taxonomy)
4. `database/seed/002_sources.sql` (Inserts official sources and organizations)
5. `database/seed/003_sample_tenders.sql` (Optional sample tenders for local testing)
