import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Database service configuration missing' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: sources, error } = await supabase
      .from('sources')
      .select('id, code, name, website_url, source_type, access_method, active, check_frequency_hours, last_checked_at, last_success_at, last_error, auto_approve, parser_version')
      .order('code', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: sources || [],
        count: sources?.length || 0
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600'
        }
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve sources' },
      { status: 500 }
    )
  }
}
