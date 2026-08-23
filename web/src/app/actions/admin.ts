'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Moderation actions (Milestone 15c). Every action re-checks the caller's
 * role server-side; RLS ("Moderators can manage tenders") backstops it.
 */

async function requireModerator() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const isMod = (roles ?? []).some((r) => r.role === 'admin' || r.role === 'moderator')
  if (!isMod) throw new Error('Forbidden: moderator role required')

  return supabase
}

export async function approveTender(tenderId: string) {
  const supabase = await requireModerator()
  const { error } = await supabase
    .from('tenders')
    .update({ moderation_status: 'approved', moderation_notes: null })
    .eq('id', tenderId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function rejectTender(tenderId: string, notes?: string) {
  const supabase = await requireModerator()
  const { error } = await supabase
    .from('tenders')
    .update({ moderation_status: 'rejected', moderation_notes: notes ?? null })
    .eq('id', tenderId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

/** Confirm a suspected duplicate: hide the copy, link it to the original. */
export async function markDuplicate(tenderId: string, originalId: string) {
  const supabase = await requireModerator()
  const { error } = await supabase
    .from('tenders')
    .update({
      moderation_status: 'rejected',
      duplicate_of_id: originalId,
      moderation_notes: 'Confirmed duplicate',
    })
    .eq('id', tenderId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
