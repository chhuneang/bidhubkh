import { NextRequest, NextResponse } from 'next/server'
import { calculateSupplierMatch } from '@/lib/matching'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tender, company } = body || {}

    if (!tender || !tender.title) {
      return NextResponse.json(
        { success: false, error: 'Tender information is required (including title)' },
        { status: 400 }
      )
    }

    const matchResult = calculateSupplierMatch(tender, company || null)

    return NextResponse.json({
      success: true,
      data: matchResult
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to calculate supplier match' },
      { status: 500 }
    )
  }
}
