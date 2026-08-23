-- 00005: Lock down raw_tenders against anonymous writes.
--
-- The tenders table was hardened in 00004, but raw_tenders still carried
-- world-open INSERT/UPDATE policies ("Allow insertion/update for ingestion
-- pipeline", roles {public}, unconditional) plus an unconditional public
-- SELECT. Any anon-key holder could inject or mutate raw payloads — the same
-- class of hole 00004 closed.
--
-- Legitimate ingestion always uses the service-role key (which bypasses RLS),
-- so these policies serve no purpose but risk. Moderated access is already
-- covered by the is_moderator() ALL policy.

DROP POLICY IF EXISTS "Allow insertion for ingestion pipeline" ON public.raw_tenders;
DROP POLICY IF EXISTS "Allow update for ingestion pipeline" ON public.raw_tenders;
DROP POLICY IF EXISTS "Allow select on raw_tenders" ON public.raw_tenders;
