import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/match/route'
import { NextRequest } from 'next/server'

describe('POST /api/match Endpoint', () => {
  it('computes match result when tender and company profile are provided', async () => {
    const payload = {
      tender: {
        title: 'Procurement of Enterprise Cloud Infrastructure',
        products_services: ['Data Center Servers', 'Firewall Hardware', 'Cloud Storage'],
        requirements: ['ISO 27001', 'GDT Tax Compliance'],
        category: { name_en: 'IT & Telecom' }
      },
      company: {
        name: 'Phnom Penh Tech Solutions',
        tax_id: 'K001-902148201',
        registration_number: 'MOC-0091241',
        industry: 'Information Technology & Cloud Systems',
        description: 'Authorized distributor of Cisco firewalls, data center servers and enterprise cloud systems.'
      }
    }

    const req = new NextRequest('http://localhost:3000/api/match', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.score).toBeGreaterThanOrEqual(75)
    expect(data.data.tier).toBe('High Fit')
    expect(data.data.matchedProducts.length).toBeGreaterThan(0)
    expect(data.data.passedRequirements.length).toBeGreaterThan(0)
  })

  it('rejects request with 400 if tender payload is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/match', {
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
