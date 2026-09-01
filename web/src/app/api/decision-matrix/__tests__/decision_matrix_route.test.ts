import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/decision-matrix/route'
import { NextRequest } from 'next/server'

describe('POST /api/decision-matrix Endpoint', () => {
  it('computes decision matrix and win probability for tender', async () => {
    const payload = {
      tender: {
        title: 'Bridge Construction and Rural Access Road',
        estimated_value: 850000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        procurement_method: 'National Competitive Bidding',
        requirements: ['Registered Contractor License', 'GDT Tax Compliance']
      },
      company: {
        name: 'Cambodia Civil Engineering Corp',
        tax_id: 'K002-88771122',
        registration_number: 'MOC-112233'
      }
    }

    const req = new NextRequest('http://localhost:3000/api/decision-matrix', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.winProbability).toBeGreaterThanOrEqual(70)
    expect(data.data.decision).toBe('BID')
    expect(data.data.breakdown).toBeDefined()
  })

  it('returns 400 when tender payload is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/decision-matrix', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(req)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('Tender information is required')
  })
})
