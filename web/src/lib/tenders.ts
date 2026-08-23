import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type TypedSupabase = SupabaseClient<Database, 'public'>

/**
 * Shared public tender queries (Milestone 15c).
 *
 * RLS already restricts anonymous reads to approved tenders, but every public
 * surface must also filter explicitly so counts, pagination, and moderator
 * sessions (which bypass RLS) stay correct. Never query `tenders` directly
 * from a public page — go through one of these helpers.
 */

/** Base builder: published + approved only. Chain .eq/.order/.limit on top. */
export function publicTenders(supabase: TypedSupabase) {
  return supabase
    .from('tenders')
    .select(`
      id,
      slug,
      reference_number,
      title,
      deadline,
      published_at,
      estimated_value,
      currency,
      location,
      confidence_score,
      organizations (name_en),
      categories (slug, name_en),
      sources (code, name)
    `)
    .eq('status', 'published')
    .eq('moderation_status', 'approved')
}

/** Full detail row (with documents) for one public slug. */
export function publicTenderBySlug(supabase: TypedSupabase, slug: string) {
  return supabase
    .from('tenders')
    .select(`
      *,
      organizations (name_en, slug, website_url),
      categories (name_en, slug),
      sources (name, website_url, code),
      tender_documents (*)
    `)
    .eq('status', 'published')
    .eq('moderation_status', 'approved')
    .eq('slug', slug)
}

/** Count of publicly visible tenders. */
export async function countPublicTenders(supabase: TypedSupabase): Promise<number | null> {
  const { count } = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('moderation_status', 'approved')
  return count ?? null
}
