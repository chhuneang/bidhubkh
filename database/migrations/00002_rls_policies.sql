-- BidHubKH Database Schema Migration: 00002_rls_policies.sql
-- Description: Row Level Security (RLS) policies and Role-Based Access Control functions

-- ========================================================
-- HELPER FUNCTIONS FOR RBAC
-- ========================================================

-- Check if authenticated user has 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if authenticated user has 'moderator' or 'admin' role
CREATE OR REPLACE FUNCTION public.is_moderator(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role IN ('admin', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================================

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- RLS POLICIES
-- ========================================================

-- 1. Sources Policies
CREATE POLICY "Public can view active sources"
    ON sources FOR SELECT
    USING (active = true OR public.is_moderator());

CREATE POLICY "Admins have full access to sources"
    ON sources FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Organizations Policies
CREATE POLICY "Public can view organizations"
    ON organizations FOR SELECT
    USING (true);

CREATE POLICY "Admins have full access to organizations"
    ON organizations FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Categories Policies
CREATE POLICY "Public can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Admins have full access to categories"
    ON categories FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Raw Tenders Policies (Restricted to Admins/Moderators only)
CREATE POLICY "Moderators can view and manage raw tenders"
    ON raw_tenders FOR ALL
    USING (public.is_moderator())
    WITH CHECK (public.is_moderator());

-- 5. Tenders Policies
CREATE POLICY "Public can view published and approved tenders"
    ON tenders FOR SELECT
    USING (
        (status = 'published' AND moderation_status = 'approved')
        OR public.is_moderator()
    );

CREATE POLICY "Moderators can manage tenders"
    ON tenders FOR ALL
    USING (public.is_moderator())
    WITH CHECK (public.is_moderator());

-- 6. Tender Documents Policies
CREATE POLICY "Public can view tender documents"
    ON tender_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenders
            WHERE tenders.id = tender_documents.tender_id
            AND (
                (tenders.status = 'published' AND tenders.moderation_status = 'approved')
                OR public.is_moderator()
            )
        )
    );

CREATE POLICY "Moderators can manage tender documents"
    ON tender_documents FOR ALL
    USING (public.is_moderator())
    WITH CHECK (public.is_moderator());

-- 7. User Roles Policies
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can manage roles"
    ON user_roles FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. Companies Policies
CREATE POLICY "Users can view public company directory or own company"
    ON companies FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own company profile"
    ON companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profile"
    ON companies FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete their own company profile"
    ON companies FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

-- 9. Company Products Policies
CREATE POLICY "Public can view company products"
    ON company_products FOR SELECT
    USING (true);

CREATE POLICY "Company owners can manage their products"
    ON company_products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = company_products.company_id
            AND companies.user_id = auth.uid()
        ) OR public.is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = company_products.company_id
            AND companies.user_id = auth.uid()
        ) OR public.is_admin()
    );

-- 10. Saved Tenders Policies
CREATE POLICY "Users can view their saved tenders"
    ON saved_tenders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert into saved tenders"
    ON saved_tenders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved tenders"
    ON saved_tenders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved tenders"
    ON saved_tenders FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

-- 11. Alerts Policies
CREATE POLICY "Users can view their alerts"
    ON alerts FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their alerts"
    ON alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their alerts"
    ON alerts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their alerts"
    ON alerts FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());
