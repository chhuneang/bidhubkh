'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateSavedTenderStatus(savedId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('saved_tenders')
    .update({ status: status as any, updated_at: new Date().toISOString() })
    .eq('id', savedId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

export async function deleteSavedTender(savedId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('saved_tenders')
    .delete()
    .eq('id', savedId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

export async function updateCompanyProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const taxId = formData.get('taxId') as string
  const registrationNumber = formData.get('registrationNumber') as string
  const industry = formData.get('industry') as string
  const location = formData.get('location') as string
  const phone = formData.get('phone') as string
  const website = formData.get('website') as string
  const description = formData.get('description') as string

  // Check if company exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const payload = {
    user_id: user.id,
    name,
    tax_id: taxId,
    registration_number: registrationNumber,
    industry,
    location,
    phone,
    website,
    description,
    updated_at: new Date().toISOString()
  }

  if (existing) {
    await supabase.from('companies').update(payload).eq('id', existing.id)
  } else {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user.id.slice(0, 8)
    await supabase.from('companies').insert({ ...payload, slug })
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createAlertRule(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const keywordsStr = formData.get('keywords') as string
  const telegramChatId = formData.get('telegramChatId') as string
  const keywords = keywordsStr ? keywordsStr.split(',').map((k) => k.trim()).filter(Boolean) : []
  const minValue = formData.get('minValue') ? parseFloat(formData.get('minValue') as string) : null
  const maxValue = formData.get('maxValue') ? parseFloat(formData.get('maxValue') as string) : null

  await supabase.from('alerts').insert({
    user_id: user.id,
    name,
    keywords,
    minimum_value: minValue,
    maximum_value: maxValue,
    frequency: 'instant',
    email_notifications: true,
    telegram_notifications: Boolean(telegramChatId),
    telegram_chat_id: telegramChatId || null,
    active: true
  })

  revalidatePath('/dashboard')
}

export async function deleteAlertRule(alertId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}
