-- BidHubKH Database Schema Migration: 00007_database_integrity_and_indexes.sql
-- Description: Foreign key covering indexes, RLS (select auth.uid()) subquery optimization,
--              duplicate permissive policy consolidation, and Cambodian procurement authority expansion.

-- ========================================================
-- 1. FOREIGN KEY COVERING INDEXES
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_alerts_category_id ON public.alerts(category_id);
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON public.alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_company_products_category_id ON public.company_products(category_id);
CREATE INDEX IF NOT EXISTS idx_company_products_company_id ON public.company_products(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_tenders_tender_id ON public.saved_tenders(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON public.tender_documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_tenders_raw_tender_id ON public.tenders(raw_tender_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);

-- ========================================================
-- 2. EXPAND OFFICIAL CAMBODIAN ORGANIZATIONS REGISTRY
-- ========================================================

INSERT INTO public.organizations (id, slug, name_en, name_km, org_type, website_url, address) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'world-bank-cambodia',
    'The World Bank Cambodia Country Office',
    'ធនាគារពិភពលោកប្រចាំកម្ពុជា',
    'multilateral_bank',
    'https://www.worldbank.org/en/country/cambodia',
    'Exchange Square Building, 10th Floor, No. 19-20, Street 106, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000002',
    'adb-cambodia',
    'Asian Development Bank Cambodia Resident Mission',
    'ធនាគារអភិវឌ្ឍន៍អាស៊ី ប្រចាំកម្ពុជា',
    'multilateral_bank',
    'https://www.adb.org/countries/cambodia/main',
    'No. 29, Suramarit Blvd. (St. 268), Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000003',
    'mef',
    'Ministry of Economy and Finance (MEF)',
    'ក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ',
    'ministry',
    'https://mef.gov.kh',
    'Street 92, Sangkat Wat Phnom, Khan Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000004',
    'mptc',
    'Ministry of Post and Telecommunications (MPTC)',
    'ក្រសួងប្រៃសណីយ៍ និងទូរគមនាគមន៍',
    'ministry',
    'https://mptc.gov.kh',
    'Building 13, Monivong Blvd, Srah Chork, Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000005',
    'moeys',
    'Ministry of Education, Youth and Sport (MoEYS)',
    'ក្រសួងអប់រំ យុវជន និងកីឡា',
    'ministry',
    'http://www.moeys.gov.kh',
    '# 80, Norodom Blvd., Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000006',
    'moh',
    'Ministry of Health (MoH)',
    'ក្រសួងសុខាភិបាល',
    'ministry',
    'http://moh.gov.kh',
    '# 80, Samdech Penn Nouth Blvd (289), Sangkat Boeung Kak 2, Khan Tuol Kork, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000007',
    'mpwt',
    'Ministry of Public Works and Transport (MPWT)',
    'ក្រសួងសាធារណការ និងដឹកជញ្ជូន',
    'ministry',
    'https://www.mpwt.gov.kh',
    'Corner Norodom Blvd & St. 106, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000008',
    'edc',
    'Electricité du Cambodge (EDC)',
    'អគ្គិសនីកម្ពុជា',
    'state_enterprise',
    'https://www.edc.com.kh',
    'No. 19, Wat Phnom, Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000009',
    'ppwsa',
    'Phnom Penh Water Supply Authority (PPWSA)',
    'រដ្ឋាករទឹកស្វយ័តក្រុងភ្នំពេញ',
    'state_enterprise',
    'https://www.ppwsa.com.kh',
    'No. 45, St. 106, Sangkat Srah Chork, Khan Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000010',
    'unicef-cambodia',
    'UNICEF Cambodia',
    'យូនីសេហ្វ ប្រចាំកម្ពុជា',
    'un_agency',
    'https://www.unicef.org/cambodia',
    'Exchange Square, 5th Floor, St. 106, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000011',
    'undp-cambodia',
    'UNDP Cambodia',
    'កម្មវិធីអភិវឌ្ឍន៍សហប្រជាជាតិ ប្រចាំកម្ពុជា',
    'un_agency',
    'https://www.undp.org/cambodia',
    'No. 53, Pasteur Street, Boeung Keng Kang 1, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000012',
    'who-cambodia',
    'World Health Organization (WHO) Cambodia',
    'អង្គការសុខភាពពិភពលោក ប្រចាំកម្ពុជា',
    'un_agency',
    'https://www.who.int/cambodia',
    'No. 61-64, Preah Norodom Blvd, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000013',
    'room-to-read',
    'Room to Read Cambodia',
    'អង្គការ រូម ធូ រីដ កម្ពុជា',
    'ngo',
    'https://www.roomtoread.org',
    'Phnom Penh, Cambodia'
),
(
    '20000000-0000-0000-0000-000000000014',
    'wateraid-cambodia',
    'WaterAid Cambodia',
    'អង្គការ វ៉ាត់ធឺអេត កម្ពុជា',
    'ngo',
    'https://www.wateraid.org/kh',
    'Phnom Penh, Cambodia'
)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_km = EXCLUDED.name_km,
    org_type = EXCLUDED.org_type,
    website_url = EXCLUDED.website_url,
    address = EXCLUDED.address;

-- ========================================================
-- 3. STANDARDIZE THE 6 OFFICIAL CAMBODIAN SOURCES
-- ========================================================

-- Ensure the 6 official sources are present, active, and auto-approving
INSERT INTO public.sources (id, code, name, website_url, source_type, access_method, active, auto_approve, check_frequency_hours) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'world_bank_kh',
    'World Bank Cambodia Procurement',
    'https://projects.worldbank.org/en/projects-operations/procurement-notices?countrycode_exact=KH',
    'development_bank',
    'api',
    true,
    true,
    12
),
(
    '10000000-0000-0000-0000-000000000002',
    'adb_kh',
    'Asian Development Bank (ADB) Cambodia',
    'https://www.adb.org/projects/tenders/country/cam',
    'development_bank',
    'api',
    true,
    true,
    12
),
(
    '10000000-0000-0000-0000-000000000003',
    'mef_gdipp',
    'General Department of Public Procurement (MEF)',
    'https://gdpp.mef.gov.kh',
    'government',
    'html_scraper',
    true,
    true,
    24
),
(
    '10000000-0000-0000-0000-000000000004',
    'ungm',
    'UN Global Marketplace (UNGM) Cambodia',
    'https://www.ungm.org/Public/Notice',
    'ngo',
    'api',
    true,
    true,
    24
),
(
    '10000000-0000-0000-0000-000000000005',
    'ngo_cambodia',
    'Cambodia NGO & Civil Society Development Portals',
    'https://reliefweb.int/country/khm',
    'ngo',
    'html_scraper',
    true,
    true,
    24
),
(
    '10000000-0000-0000-0000-000000000006',
    'state_utilities',
    'Cambodian State-Owned Enterprises & Utilities (EDC / PPWSA)',
    'https://www.edc.com.kh',
    'government',
    'html_scraper',
    true,
    true,
    24
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    website_url = EXCLUDED.website_url,
    source_type = EXCLUDED.source_type,
    access_method = EXCLUDED.access_method,
    active = true,
    auto_approve = true;

-- Clean up any obsolete duplicate ungm_kh source.
-- Guarded by the legacy code so replays never touch the live ngo_cambodia id
-- (which now occupies the same uuid slot the legacy row used to).
UPDATE public.tenders
SET source_id = '10000000-0000-0000-0000-000000000004'
WHERE source_id = (SELECT id FROM public.sources WHERE code = 'ungm_kh');

DELETE FROM public.sources WHERE code = 'ungm_kh';
DELETE FROM public.sources WHERE code = 'fmis_kh';

-- ========================================================
-- 4. RLS SUBQUERY INITPLAN & POLICY OPTIMIZATIONS
-- ========================================================

-- Companies RLS
DROP POLICY IF EXISTS "Users can insert their own company profile" ON public.companies;
CREATE POLICY "Users can insert their own company profile" ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own company profile" ON public.companies;
CREATE POLICY "Users can update their own company profile" ON public.companies
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own company profile" ON public.companies;
CREATE POLICY "Users can delete their own company profile" ON public.companies
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- Saved Tenders RLS
DROP POLICY IF EXISTS "Users can insert into saved tenders" ON public.saved_tenders;
CREATE POLICY "Users can insert into saved tenders" ON public.saved_tenders
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their saved tenders" ON public.saved_tenders;
CREATE POLICY "Users can update their saved tenders" ON public.saved_tenders
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their saved tenders" ON public.saved_tenders;
CREATE POLICY "Users can view their saved tenders" ON public.saved_tenders
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their saved tenders" ON public.saved_tenders;
CREATE POLICY "Users can delete their saved tenders" ON public.saved_tenders
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- Alerts RLS
DROP POLICY IF EXISTS "Users can create their alerts" ON public.alerts;
CREATE POLICY "Users can create their alerts" ON public.alerts
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their alerts" ON public.alerts;
CREATE POLICY "Users can update their alerts" ON public.alerts
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their alerts" ON public.alerts;
CREATE POLICY "Users can view their alerts" ON public.alerts
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their alerts" ON public.alerts;
CREATE POLICY "Users can delete their alerts" ON public.alerts
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- User Subscriptions RLS
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can manage own subscription" ON public.user_subscriptions
    FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Payment Transactions RLS
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.payment_transactions;
CREATE POLICY "Users can insert own transactions" ON public.payment_transactions
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

-- User Roles RLS
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

-- Company Products RLS
DROP POLICY IF EXISTS "Company owners can manage their products" ON public.company_products;
CREATE POLICY "Company owners can manage their products" ON public.company_products
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.user_id = (select auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.user_id = (select auth.uid())
        )
    );

-- Consolidate duplicate permissive SELECT policies on categories, organizations, sources
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins have full access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Public can view organizations" ON public.organizations;
CREATE POLICY "Public can view organizations" ON public.organizations
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins have full access to sources" ON public.sources;
DROP POLICY IF EXISTS "Public can view active sources" ON public.sources;
CREATE POLICY "Public can view active sources" ON public.sources
    FOR SELECT TO anon, authenticated
    USING (active = true);
