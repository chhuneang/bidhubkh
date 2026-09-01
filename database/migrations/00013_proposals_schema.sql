-- Migration: 00013_proposals_schema.sql
-- Description: Create proposals table for storing AI-generated and supplier-edited bid proposals

CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'en',
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast query lookups
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_tender_id ON public.proposals(tender_id);
CREATE INDEX IF NOT EXISTS idx_proposals_user_tender ON public.proposals(user_id, tender_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can insert their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete their own proposals" ON public.proposals;

-- RLS Policies with optimized subquery wrapping (select auth.uid())
CREATE POLICY "Users can view their own proposals"
  ON public.proposals
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own proposals"
  ON public.proposals
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own proposals"
  ON public.proposals
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own proposals"
  ON public.proposals
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_proposal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proposals_updated_at ON public.proposals;
CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_proposal_updated_at();
