-- BidHubKH Database Schema Migration: 00009_scraper_ingestion_permissions.sql
-- Description: Ingestion worker policies allowing the automated background crawler to insert/update procurement notices, evaluate upserts, and track source health.

-- Allow crawler worker to select, insert, and update raw_tenders
DROP POLICY IF EXISTS "Ingestion worker can select raw_tenders" ON public.raw_tenders;
CREATE POLICY "Ingestion worker can select raw_tenders" ON public.raw_tenders
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Ingestion worker can insert raw_tenders" ON public.raw_tenders;
CREATE POLICY "Ingestion worker can insert raw_tenders" ON public.raw_tenders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Ingestion worker can update raw_tenders" ON public.raw_tenders;
CREATE POLICY "Ingestion worker can update raw_tenders" ON public.raw_tenders
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow crawler worker to select, insert, and update tenders
DROP POLICY IF EXISTS "Ingestion worker can select tenders" ON public.tenders;
CREATE POLICY "Ingestion worker can select tenders" ON public.tenders
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Ingestion worker can insert tenders" ON public.tenders;
CREATE POLICY "Ingestion worker can insert tenders" ON public.tenders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Ingestion worker can update tenders" ON public.tenders;
CREATE POLICY "Ingestion worker can update tenders" ON public.tenders
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow crawler worker to update source health timestamps
DROP POLICY IF EXISTS "Ingestion worker can update sources" ON public.sources;
CREATE POLICY "Ingestion worker can update sources" ON public.sources
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow crawler worker to insert tender_documents
DROP POLICY IF EXISTS "Ingestion worker can insert tender_documents" ON public.tender_documents;
CREATE POLICY "Ingestion worker can insert tender_documents" ON public.tender_documents
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
