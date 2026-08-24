-- 00010: Security lockdown — close anonymous write surface and privilege-escalation paths.
--
-- Audit 2026-08-24 findings addressed here:
--   1. Migration 00009 granted anon/authenticated unrestricted INSERT/SELECT/UPDATE on
--      tenders / raw_tenders / sources / tender_documents so the crawler could write.
--      Unnecessary: the crawler authenticates with SUPABASE_SERVICE_ROLE_KEY
--      (.github/workflows/ingest.yml), which bypasses RLS entirely. Net effect was
--      internet-wide anonymous write access to core tables (defaults would publish
--      attacker-inserted tenders immediately: status='published', moderation='approved').
--   2. increment_tender_duplicate_count(uuid) is SECURITY DEFINER and was executable by
--      anon/authenticated via /rest/v1/rpc — anyone could corrupt duplicate counts.
--   3. user_subscriptions/payment_transactions allowed self-service writes (entitlement
--      escalation). The product is now free — pricing/Bakong flows were removed from the
--      web app — so these legacy billing tables become service-role-only.
--   4. user_roles had two overlapping permissive SELECT policies (perf linter 0006).
--   5. tender_documents public SELECT had been loosened to USING (true); restore 00006's
--      per-tender visibility so documents of unpublished/quarantined tenders stay hidden.
--   6. pg_trgm installed in the exposed `public` schema (security linter 0014).

-- ========================================================
-- 1. Drop world-open "Ingestion worker" policies
-- ========================================================

DROP POLICY IF EXISTS "Ingestion worker can select raw_tenders" ON public.raw_tenders;
DROP POLICY IF EXISTS "Ingestion worker can insert raw_tenders" ON public.raw_tenders;
DROP POLICY IF EXISTS "Ingestion worker can update raw_tenders" ON public.raw_tenders;

DROP POLICY IF EXISTS "Ingestion worker can select tenders" ON public.tenders;
DROP POLICY IF EXISTS "Ingestion worker can insert tenders" ON public.tenders;
DROP POLICY IF EXISTS "Ingestion worker can update tenders" ON public.tenders;

DROP POLICY IF EXISTS "Ingestion worker can update sources" ON public.sources;

DROP POLICY IF EXISTS "Ingestion worker can insert tender_documents" ON public.tender_documents;

-- Restore admin management of sources (dropped during the 00007 consolidation).
CREATE POLICY "Admins can manage sources"
    ON public.sources FOR ALL
    TO authenticated
    USING (helpers.is_admin())
    WITH CHECK (helpers.is_admin());

-- ========================================================
-- 2. Lock the duplicate-count RPC to server-side callers
-- ========================================================

REVOKE EXECUTE ON FUNCTION public.increment_tender_duplicate_count(uuid)
    FROM anon, authenticated;

-- ========================================================
-- 3. Legacy billing tables: service-role only
-- ========================================================
-- The web app no longer reads or writes these (pricing removed); keep the data but
-- make it invisible to every API role. service_role bypasses RLS and retains access.

DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscription" ON public.user_subscriptions;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.payment_transactions;

-- ========================================================
-- 4. user_roles: consolidate overlapping permissive SELECT policies
-- ========================================================

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles; admins see all"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id OR helpers.is_admin());

CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (helpers.is_admin());

CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (helpers.is_admin())
    WITH CHECK (helpers.is_admin());

CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (helpers.is_admin());

-- ========================================================
-- 5. tender_documents: restore per-tender public visibility
-- ========================================================

DROP POLICY IF EXISTS "Public can view tender documents" ON public.tender_documents;
CREATE POLICY "Public can view tender documents"
    ON public.tender_documents FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenders t
            WHERE t.id = tender_documents.tender_id
              AND (
                  (t.status = 'published' AND t.moderation_status = 'approved')
                  OR helpers.is_moderator()
              )
        )
    );

-- ========================================================
-- 6. Move pg_trgm out of the exposed schema (linter 0014)
-- ========================================================
-- Dependent objects (GIN index idx_tenders_title_trgm) follow the extension
-- automatically; `extensions` is already on the search_path of every API role.

ALTER EXTENSION pg_trgm SET SCHEMA extensions;
