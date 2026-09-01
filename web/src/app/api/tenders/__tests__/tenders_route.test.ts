import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/tenders/route'
import { NextRequest } from 'next/server'

// Mock Supabase Server Client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => {
    const mockTenders = [
      {
        id: 't-1',
        slug: 'road-repair-phnom-penh',
        reference_number: 'MPWT-2026-01',
        title: 'Road Rehabilitation in Phnom Penh City Center',
        deadline: '2026-10-15T00:00:00Z',
        published_at: '2026-09-01T00:00:00Z',
        estimated_value: 500000,
        currency: 'USD',
        location: 'Phnom Penh',
        confidence_score: 95,
        organizations: { name_en: 'Ministry of Public Works and Transport' },
        categories: { slug: 'construction-civil', name_en: 'Construction & Civil Works' },
        sources: { code: 'mef_gdipp', name: 'General Department of Public Procurement (MEF)' }
      },
      {
        id: 't-2',
        slug: 'hospital-solar-microgrid',
        reference_number: 'WB-KH-2026-44',
        title: 'Provincial Hospital Solar Microgrid Installation',
        deadline: '2026-11-20T00:00:00Z',
        published_at: '2026-09-02T00:00:00Z',
        estimated_value: 1200000,
        currency: 'USD',
        location: 'Siem Reap',
        confidence_score: 98,
        organizations: { name_en: 'Ministry of Health' },
        categories: { slug: 'electrical-energy', name_en: 'Energy & Electrical' },
        sources: { code: 'world_bank_kh', name: 'World Bank Cambodia' }
      }
    ]

    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockImplementation((query, options) => {
          if (options && options.count === 'exact' && options.head) {
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: mockTenders.length, error: null })
              })
            }
          }
          const builder = {
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: mockTenders,
              error: null,
              count: mockTenders.length
            })
          }
          return builder
        })
      })
    }
  })
}))

describe('GET /api/tenders Endpoint', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'
  })

  it('returns status 200 with list of published tenders and pagination metadata', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders?page=1&limit=10')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBe(2)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.total).toBe(2)
  })

  it('filters by keyword search query parameter', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders?q=solar')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('handles invalid pagination parameters gracefully', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders?page=-1&limit=500')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(100) // capped at max 100
  })
})
