-- BidHubKH Database Schema Migration: 00004_data_quality.sql
-- Description: Data Quality Engine support columns — dedup links, validation
--              errors, duplicate counters, per-source auto-approval trust flag.

-- ========================================================
-- TENDERS: dedup & validation columns
-- ========================================================

-- Suspected / confirmed original tender this row duplicates (Layer 3 similarity).
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES tenders(id) ON DELETE SET NULL;

-- Structured output of scraper.validators.rules: [{rule, severity, message}, ...]
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb;

-- How many later ingestions collided with this tender via fingerprint (Layer 2).
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS duplicate_count INT NOT NULL DEFAULT 0;

-- Canonical moderation_status values (VARCHAR — enforced by app layer):
--   'approved'        -> publicly visible (with status = 'published')
--   'pending'         -> new tender from a source without auto_approve; awaits review
--   'quarantined'     -> failed a critical validation rule; never public
--   'duplicate_review'-> fuzzy-matched a same-org tender at >= threshold; awaits review
--   'rejected'        -> moderator rejected (incl. confirmed duplicates)
COMMENT ON COLUMN tenders.moderation_status IS 'approved | pending | quarantined | duplicate_review | rejected';

-- ========================================================
-- SOURCES: trust override
-- ========================================================

-- When true, new tenders from this source skip the pending queue and publish directly.
ALTER TABLE sources ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN NOT NULL DEFAULT false;

-- The six built-in verified official feeds may keep auto-publishing. Any source
-- added after this migration defaults to false and lands in the moderation queue.
UPDATE sources SET auto_approve = true WHERE code IN (
    'world_bank_kh',
    'adb_kh',
    'mef_gdipp',
    'ungm',
    'ngo_cambodia',
    'state_utilities'
);

-- ========================================================
-- SECURITY HARDENING (found while reviewing pg_policies pre-apply)
-- ========================================================

-- 'Allow insertion/update for tenders pipeline' granted INSERT/UPDATE to
-- role {public} with unconditional quals: any anon client holding the
-- publishable key could write tender rows directly. The ingestion pipeline
-- authenticates with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely,
-- so these policies protected nothing and only exposed an attack surface.
DROP POLICY IF EXISTS "Allow insertion for tenders pipeline" ON tenders;
DROP POLICY IF EXISTS "Allow update for tenders pipeline" ON tenders;

-- Supabase linter 0011: pin search_path on SECURITY DEFINER / trigger
-- helpers so a malicious schema cannot shadow the tables they reference.
-- Bodies are already schema-qualified (public.user_roles), so '' is safe.
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role = 'admin'
    );
END;
$$;

CREATE OR REPLACE FUNCTION is_moderator(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role IN ('admin', 'moderator')
    );
END;
$$;

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ========================================================
-- ATOMIC DUPLICATE COUNTER (called by scraper/processors/dedup.py)
-- Only ever invoked with the service-role key; not exposed via PostgREST.
-- ========================================================

CREATE OR REPLACE FUNCTION increment_tender_duplicate_count(p_tender_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    UPDATE public.tenders
    SET duplicate_count = duplicate_count + 1
    WHERE id = p_tender_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_tender_duplicate_count(UUID) FROM anon, authenticated;
-- Postgres grants EXECUTE to the built-in PUBLIC role by default; without this
-- the two REVOKEs above are silently ineffective for PostgREST callers.
REVOKE EXECUTE ON FUNCTION increment_tender_duplicate_count(UUID) FROM PUBLIC;

-- ========================================================
-- INDEXES
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_tenders_moderation_created ON tenders(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenders_duplicate_of ON tenders(duplicate_of_id);
CREATE INDEX IF NOT EXISTS idx_sources_auto_approve ON sources(auto_approve) WHERE auto_approve = true;

-- ========================================================
-- RLS
-- ========================================================
-- No read-policy changes required: migration 00002 already restricts anonymous /
-- authenticated reads to (status = 'published' AND moderation_status = 'approved')
-- unless the caller is a moderator or admin, which covers every state above
-- (verified against pg_policies before applying). The only write policies the
-- pipeline needs are covered by the service-role key, which bypasses RLS —
-- see the hardening section above for the open policies this removes.
