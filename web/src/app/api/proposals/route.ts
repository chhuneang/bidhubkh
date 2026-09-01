import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/proposals — Fetch authenticated supplier's saved proposals
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to view your proposals.' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('proposals')
      .select(`
        id,
        user_id,
        tender_id,
        title,
        language,
        sections,
        custom_notes,
        status,
        created_at,
        updated_at,
        tender:tenders(id, title, slug, tender_number, estimated_amount, currency, submission_deadline, organization:organizations(name_en, name_km))
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve proposals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/proposals — Save or update a proposal draft
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to save proposals.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, tender_id, title, language, sections, custom_notes, status } = body

    if (!tender_id || !title) {
      return NextResponse.json(
        { success: false, error: 'tender_id and title are required' },
        { status: 400 }
      )
    }

    const payload = {
      user_id: user.id,
      tender_id,
      title,
      language: language || 'en',
      sections: sections || {},
      custom_notes: custom_notes || null,
      status: status || 'draft'
    }

    let query
    if (id) {
      // Update existing proposal
      query = supabase
        .from('proposals')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      // Insert new proposal
      query = supabase
        .from('proposals')
        .insert(payload)
        .select()
        .single()
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save proposal' },
      { status: 500 }
    )
  }
}
