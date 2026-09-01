import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/tenders/[slug]/route'
import { NextRequest } from 'next/server'

// Mock Supabase Server Client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(async () => {
                  return {
                    data: {
                      id: 't-detail-1',
                      slug: 'wb-cambodia-rural-water',
                      title: 'Cambodia Rural Water Supply & Sanitation Facility',
                      reference_number: 'WB-KH-2026-09',
                      summary: 'Installation of 50 community water filtration stations.',
                      description: 'Full procurement scope for piped water and sanitation systems.',
                      estimated_value: 750000,
                      currency: 'USD',
                      procurement_method: 'International Competitive Bidding',
                      eligibility: 'Registered contractors with ISO 9001 compliance',
                      original_url: 'https://projects.worldbank.org/en/projects-operations/procurement-detail/WB-KH-2026-09',
                      confidence_score: 96,
                      organizations: { name_en: 'Ministry of Rural Development', slug: 'mrd', website_url: 'https://mrd.gov.kh' },
                      categories: { name_en: 'Water & Infrastructure', slug: 'agriculture-water' },
                      sources: { name: 'World Bank Cambodia', website_url: 'https://worldbank.org', code: 'world_bank_kh' },
                      tender_documents: [
                        { id: 'doc-1', title: 'Bidding Document Section IV', file_url: 'https://worldbank.org/doc.pdf', document_type: 'bidding_document' }
                      ]
                    },
                    error: null
                  }
                })
              })
            })
          })
        })
      })
    }
  })
}))

describe('GET /api/tenders/[slug] Endpoint', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'
  })

  it('returns status 200 with full tender detail, documents, and organization info', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders/wb-cambodia-rural-water')
    const response = await GET(req, { params: Promise.resolve({ slug: 'wb-cambodia-rural-water' }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.title).toContain('Rural Water Supply')
    expect(data.data.organizations.name_en).toBe('Ministry of Rural Development')
    expect(data.data.tender_documents.length).toBe(1)
  })
})
