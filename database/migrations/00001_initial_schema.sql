-- BidHubKH Database Schema Migration: 00001_initial_schema.sql
-- Description: Core tables, enums, indexes, and full-text search setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum Types
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tender_status AS ENUM ('draft', 'published', 'archived', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE saved_tender_status AS ENUM ('interested', 'reviewing', 'preparing_bid', 'submitted', 'won', 'lost', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE source_access_method AS ENUM ('api', 'html_scraper', 'rss', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Sources Table
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    website_url TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- e.g., 'government', 'development_bank', 'ngo', 'public_enterprise'
    access_method source_access_method NOT NULL DEFAULT 'html_scraper',
    active BOOLEAN NOT NULL DEFAULT true,
    check_frequency_hours INT NOT NULL DEFAULT 24,
    last_checked_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    parser_version VARCHAR(20) DEFAULT '1.0.0',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_km VARCHAR(255),
    org_type VARCHAR(50) NOT NULL, -- e.g., 'ministry', 'multilateral_bank', 'ngo', 'state_agency'
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(100),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Categories Table (Hierarchical Taxonomy)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_km VARCHAR(255),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Raw Tenders (Immutable Raw Payload Storage for audit & reprocessing)
CREATE TABLE IF NOT EXISTS raw_tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    raw_title TEXT NOT NULL,
    raw_description TEXT,
    raw_payload JSONB NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'duplicate'
    processing_error TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_source_external_id UNIQUE (source_id, external_id)
);

-- 5. Tenders Table (Normalized Opportunities)
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_tender_id UUID REFERENCES raw_tenders(id) ON DELETE SET NULL,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    external_id TEXT NOT NULL,
    reference_number TEXT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    description TEXT,
    location VARCHAR(255) DEFAULT 'Cambodia',
    published_at TIMESTAMPTZ NOT NULL,
    deadline TIMESTAMPTZ,
    estimated_value NUMERIC(15, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    procurement_method VARCHAR(100),
    eligibility TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    products_services JSONB DEFAULT '[]'::jsonb,
    status tender_status NOT NULL DEFAULT 'published',
    original_url TEXT NOT NULL,
    fingerprint VARCHAR(64),
    confidence_score INT DEFAULT 100,
    moderation_status VARCHAR(50) DEFAULT 'approved', -- 'approved', 'pending_review', 'rejected'
    moderation_notes TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tender Documents
CREATE TABLE IF NOT EXISTS tender_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'tender_notice', -- 'tender_notice', 'tor', 'rfp', 'addendum', 'bidding_document'
    original_url TEXT NOT NULL,
    storage_path TEXT,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    file_hash VARCHAR(64),
    extracted_text TEXT,
    ai_extraction_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'skipped'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. User Roles (RBAC for Supabase Auth)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

-- 8. User Profiles & Companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    industry VARCHAR(100),
    description TEXT,
    years_in_business INT,
    team_size VARCHAR(50),
    location VARCHAR(255) DEFAULT 'Phnom Penh, Cambodia',
    website TEXT,
    phone VARCHAR(50),
    min_contract_budget NUMERIC(15, 2),
    max_contract_budget NUMERIC(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_company UNIQUE (user_id)
);

-- 9. Company Products & Keywords
CREATE TABLE IF NOT EXISTS company_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Saved Tenders (Pipeline / Bookmarks)
CREATE TABLE IF NOT EXISTS saved_tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    status saved_tender_status NOT NULL DEFAULT 'interested',
    notes TEXT,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_tender UNIQUE (user_id, tender_id)
);

-- 11. Alerts (User Notification Subscriptions)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    minimum_value NUMERIC(15, 2),
    maximum_value NUMERIC(15, 2),
    frequency VARCHAR(50) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly'
    email_notifications BOOLEAN DEFAULT true,
    telegram_notifications BOOLEAN DEFAULT false,
    telegram_chat_id VARCHAR(100),
    active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- INDEXES FOR PERFORMANCE & FULL-TEXT SEARCH
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_tenders_status_moderation ON tenders(status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(deadline);
CREATE INDEX IF NOT EXISTS idx_tenders_published_at ON tenders(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenders_category_id ON tenders(category_id);
CREATE INDEX IF NOT EXISTS idx_tenders_organization_id ON tenders(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_source_id ON tenders(source_id);
CREATE INDEX IF NOT EXISTS idx_tenders_fingerprint ON tenders(fingerprint);

-- Full-Text Search (English + Trigram for fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_tenders_title_trgm ON tenders USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tenders_fts ON tenders USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(summary, ''))
);

-- Raw Tenders Indexes
CREATE INDEX IF NOT EXISTS idx_raw_tenders_source_status ON raw_tenders(source_id, status);
CREATE INDEX IF NOT EXISTS idx_raw_tenders_content_hash ON raw_tenders(content_hash);

-- Saved & Alerts Indexes
CREATE INDEX IF NOT EXISTS idx_saved_tenders_user ON saved_tenders(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_active ON alerts(user_id, active);

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS trg_sources_updated_at ON sources;
CREATE TRIGGER trg_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_tenders_updated_at ON tenders;
CREATE TRIGGER trg_tenders_updated_at BEFORE UPDATE ON tenders FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_saved_tenders_updated_at ON saved_tenders;
CREATE TRIGGER trg_saved_tenders_updated_at BEFORE UPDATE ON saved_tenders FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON alerts;
CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
