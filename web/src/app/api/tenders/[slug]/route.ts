import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publicTenderBySlug } from '@/lib/tenders'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Database service configuration missing' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: tender, error } = await publicTenderBySlug(supabase, slug).maybeSingle()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!tender) {
      return NextResponse.json(
        { success: false, error: 'Tender notice not found or unapproved' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: tender
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve tender detail' },
      { status: 500 }
    )
  }
}
