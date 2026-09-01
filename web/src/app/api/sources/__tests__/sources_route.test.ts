import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/sources/route'
import { NextRequest } from 'next/server'

// Mock Supabase Server Client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => {
    const mockSources = [
      { id: 's-1', code: 'world_bank_kh', name: 'World Bank Cambodia Procurement', website_url: 'https://worldbank.org', source_type: 'development_bank', active: true },
      { id: 's-2', code: 'adb_kh', name: 'Asian Development Bank (ADB) Cambodia', website_url: 'https://adb.org', source_type: 'development_bank', active: true },
      { id: 's-3', code: 'jica_kh', name: 'Japan International Cooperation Agency (JICA) Cambodia', website_url: 'https://jica.go.jp', source_type: 'development_bank', active: true }
    ]

    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockSources,
            error: null
          })
        })
      })
    }
  })
}))

describe('GET /api/sources Endpoint', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'
  })

  it('returns status 200 with list of verified sources', async () => {
    const req = new NextRequest('http://localhost:3000/api/sources')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBe(3)
    expect(data.data[0].code).toBe('world_bank_kh')
  })
})
