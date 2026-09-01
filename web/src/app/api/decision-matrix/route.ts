import { NextRequest, NextResponse } from 'next/server'
import { computeBidDecision } from '@/lib/decision_matrix'

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

    const decisionResult = computeBidDecision(tender, company || null)

    return NextResponse.json({
      success: true,
      data: decisionResult
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to compute bid decision matrix' },
      { status: 500 }
    )
  }
}
