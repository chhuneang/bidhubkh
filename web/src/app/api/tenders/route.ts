import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publicTenders } from '@/lib/tenders'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract filters & parameters
    const query = (searchParams.get('q') || '').trim()
    const categoryFilter = searchParams.get('category') || ''
    const sourceFilter = searchParams.get('source') || ''
    const sort = searchParams.get('sort') || 'latest'

    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '20', 10)

    if (isNaN(page) || page < 1) page = 1
    if (isNaN(limit) || limit < 1) limit = 20
    if (limit > 100) limit = 100

    const offset = (page - 1) * limit

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Database service configuration missing' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    let dbQuery = publicTenders(supabase)

    // Keyword search
    if (query) {
      dbQuery = dbQuery.ilike('title', `%${query}%`)
    }

    // Sort order
    if (sort === 'deadline') {
      dbQuery = dbQuery.order('deadline', { ascending: true, nullsFirst: false })
    } else if (sort === 'value_desc') {
      dbQuery = dbQuery.order('estimated_value', { ascending: false, nullsFirst: false })
    } else if (sort === 'value_asc') {
      dbQuery = dbQuery.order('estimated_value', { ascending: true, nullsFirst: false })
    } else {
      dbQuery = dbQuery.order('published_at', { ascending: false })
    }

    // Range pagination
    const { data, error, count } = await dbQuery.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    let results = (data || []).map((t: any) => ({
      ...t,
      organization: t.organizations,
      category: t.categories,
      source: t.sources,
    }))

    // In-memory filter for relational fields if provided
    if (categoryFilter) {
      results = results.filter((t: any) => t.category?.slug === categoryFilter)
    }
    if (sourceFilter) {
      results = results.filter((t: any) => t.source?.code === sourceFilter)
    }

    const total = count ?? results.length
    const totalPages = Math.ceil(total / limit) || 1

    return NextResponse.json(
      {
        success: true,
        data: results,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_more: page < totalPages
        }
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
      { success: false, error: err.message || 'Failed to fetch tenders' },
      { status: 500 }
    )
  }
}
