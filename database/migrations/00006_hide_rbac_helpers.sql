-- 00006: Move RBAC helper functions out of the public (PostgREST-exposed) schema.
--
-- is_admin() and is_moderator() are SECURITY DEFINER functions in `public`,
-- so PostgREST exposed them as /rest/v1/rpc/is_admin — any anon-key holder
-- could probe arbitrary user UUIDs and learn who holds admin/moderator roles
-- (Supabase linter 0028/0029). The web app never calls them via rpc(); they
-- exist only for RLS policy expressions, which work regardless of API
-- schema exposure.
--
-- Fix: recreate the functions unchanged in a new non-exposed `helpers`
-- schema, re-point all 18 dependent policies, then drop the public copies.
-- Behavior (definer semantics, auth.uid() default, pinned search_path) is
-- identical; only the RPC surface disappears.

CREATE SCHEMA IF NOT EXISTS helpers;

REVOKE ALL ON SCHEMA helpers FROM PUBLIC;
GRANT USAGE ON SCHEMA helpers TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION helpers.is_admin(check_user_id uuid DEFAULT auth.uid())
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

CREATE OR REPLACE FUNCTION helpers.is_moderator(check_user_id uuid DEFAULT auth.uid())
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

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA helpers FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA helpers TO anon, authenticated, service_role;

-- ========================================================
-- Re-point policies (drop + recreate with helpers-qualified calls)
-- ========================================================

-- sources
DROP POLICY IF EXISTS "Public can view active sources" ON public.sources;
CREATE POLICY "Public can view active sources"
    ON public.sources FOR SELECT
    USING (active = true OR helpers.is_moderator());

DROP POLICY IF EXISTS "Admins have full access to sources" ON public.sources;
CREATE POLICY "Admins have full access to sources"
    ON public.sources FOR ALL
    USING (helpers.is_admin())
    WITH CHECK (helpers.is_admin());

-- organizations
DROP POLICY IF EXISTS "Admins have full access to organizations" ON public.organizations;
CREATE POLICY "Admins have full access to organizations"
    ON public.organizations FOR ALL
    USING (helpers.is_admin())
    WITH CHECK (helpers.is_admin());

-- categories
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories"
    ON public.categories FOR ALL
    USING (helpers.is_admin())
    WITH CHECK (helpers.is_admin());

-- raw_tenders
DROP POLICY IF EXISTS "Moderators can view and manage raw tenders" ON public.raw_tenders;
CREATE POLICY "Moderators can view and manage raw tenders"
    ON public.raw_tenders FOR ALL
    USING (helpers.is_moderator())
    WITH CHECK (helpers.is_moderator());

-- tenders
DROP POLICY IF EXISTS "Public can view published and approved tenders" ON public.tenders;
CREATE POLICY "Public can view published and approved tenders"
    ON public.tenders FOR SELECT
    USING (
        (status = 'published' AND moderation_status = 'approved')
        OR helpers.is_moderator()
    );

DROP POLICY IF EXISTS "Moderators can manage tenders" ON public.tenders;
CREATE POLICY "Moderators can manage tenders"
    ON public.tenders FOR ALL
    USING (helpers.is_moderator())
    WITH CHECK (helpers.is_moderator());

-- tender_documents
DROP POLICY IF EXISTS "Public can view tender documents" ON public.tender_documents;
CREATE POLICY "Public can view tender documents"
    ON public.tender_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenders
            WHERE public.tenders.id = public.tender_documents.tender_id
            AND (
                (public.tenders.status = 'published' AND public.tenders.moderation_status = 'approved')
                OR helpers.is_moderator()
            )
        )
    );

DROP POLICY IF EXISTS "Moderators can manage tender documents" ON public.tender_documents;
CREATE POLICY "Moderators can manage tender documents"
    ON public.tender_documents FOR ALL
    USING (helpers.is_moderator())
    WITH CHECK (helpers.is_moderator());

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR helpers.is_admin());

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    USING (helpers.is_admin())
    WITH CHECK (helpers.is_admin());

-- companies
DROP POLICY IF EXISTS "Users can update their own company profile" ON public.companies;
CREATE POLICY "Users can update their own company profile"
    ON public.companies FOR UPDATE
    USING (auth.uid() = user_id OR helpers.is_admin())
    WITH CHECK (auth.uid() = user_id OR helpers.is_admin());

DROP POLICY IF EXISTS "Users can delete their own company profile" ON public.companies;
CREATE POLICY "Users can delete their own company profile"
    ON public.companies FOR DELETE
    USING (auth.uid() = user_id OR helpers.is_admin());

-- company_products
DROP POLICY IF EXISTS "Company owners can manage their products" ON public.company_products;
CREATE POLICY "Company owners can manage their products"
    ON public.company_products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE public.companies.id = public.company_products.company_id
            AND public.companies.user_id = auth.uid()
        ) OR helpers.is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE public.companies.id = public.company_products.company_id
            AND public.companies.user_id = auth.uid()
        ) OR helpers.is_admin()
    );

-- saved_tenders
DROP POLICY IF EXISTS "Users can view their saved tenders" ON public.saved_tenders;
CREATE POLICY "Users can view their saved tenders"
    ON public.saved_tenders FOR SELECT
    USING (auth.uid() = user_id OR helpers.is_admin());

DROP POLICY IF EXISTS "Users can delete their saved tenders" ON public.saved_tenders;
CREATE POLICY "Users can delete their saved tenders"
    ON public.saved_tenders FOR DELETE
    USING (auth.uid() = user_id OR helpers.is_admin());

-- alerts
DROP POLICY IF EXISTS "Users can view their alerts" ON public.alerts;
CREATE POLICY "Users can view their alerts"
    ON public.alerts FOR SELECT
    USING (auth.uid() = user_id OR helpers.is_admin());

DROP POLICY IF EXISTS "Users can delete their alerts" ON public.alerts;
CREATE POLICY "Users can delete their alerts"
    ON public.alerts FOR DELETE
    USING (auth.uid() = user_id OR helpers.is_admin());

-- ========================================================
-- Only now drop the exposed public copies
-- ========================================================

DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_moderator(uuid);
