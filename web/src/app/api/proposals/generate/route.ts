import { NextRequest, NextResponse } from 'next/server'
import { generateProposal } from '@/lib/proposal_engine'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tender, company, language, selectedSections, customInstructions } = body

    if (!tender || !tender.title) {
      return NextResponse.json(
        { success: false, error: 'Tender data is required to generate a proposal' },
        { status: 400 }
      )
    }

    const proposal = generateProposal({
      tender,
      company,
      language,
      selectedSections,
      customInstructions
    })

    return NextResponse.json(
      {
        success: true,
        proposal
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate proposal' },
      { status: 500 }
    )
  }
}
