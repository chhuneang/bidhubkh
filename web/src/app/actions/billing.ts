'use server'

import { createClient } from '@/lib/supabase/server'
import { generateBakongKHQR, KHQRResult } from '@/lib/bakong'
import { revalidatePath } from 'next/cache'

export async function createBakongPayment(
  planSlug: string,
  currency: 'USD' | 'KHR' = 'USD'
): Promise<{ success: boolean; khqr?: KHQRResult; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Please sign in to upgrade your subscription.' }
    }

    // 1. Fetch Plan Details
    const { data: plan, error: planErr } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', planSlug)
      .single()

    if (planErr || !plan) {
      return { success: false, error: 'Subscription plan not found.' }
    }

    const amount = currency === 'USD' ? Number(plan.price_usd) : Number(plan.price_khr)
    const billNumber = `INV-${Date.now().toString().slice(-8)}`

    // 2. Generate Dynamic NBC KHQR
    const khqr = generateBakongKHQR({
      merchantName: 'BIDHUBKH INTELLIGENCE',
      merchantCity: 'Phnom Penh',
      bakongAccountId: 'bidhubkh@bk',
      amount,
      currency,
      billNumber
    })

    // 3. Record pending transaction
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_slug: planSlug,
        amount,
        currency,
        payment_method: 'bakong_khqr',
        transaction_reference: billNumber,
        status: 'pending',
        khqr_string: khqr.qrString,
        khqr_md5: khqr.md5
      })

    return { success: true, khqr }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to initiate Bakong payment' }
  }
}

export async function confirmBakongPayment(
  billNumber: string
): Promise<{ success: boolean; planName?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 1. Fetch Transaction
    const { data: tx, error: txErr } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_reference', billNumber)
      .eq('user_id', user.id)
      .single()

    if (txErr || !tx) {
      return { success: false, error: 'Transaction reference not found' }
    }

    // 2. Fetch Plan
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', tx.plan_slug)
      .single()

    if (!plan) {
      return { success: false, error: 'Plan record missing' }
    }

    // 3. Mark transaction completed
    await supabase
      .from('payment_transactions')
      .update({ status: 'completed' })
      .eq('id', tx.id)

    // 4. Upsert User Subscription
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_method: 'bakong_khqr',
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' })

    revalidatePath('/pricing')
    revalidatePath('/dashboard')
    return { success: true, planName: plan.name }
  } catch (err: any) {
    return { success: false, error: err.message || 'Payment confirmation failed' }
  }
}
