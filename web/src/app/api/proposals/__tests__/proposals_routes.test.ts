import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as generateHandler } from '@/app/api/proposals/generate/route'
import { GET as listHandler, POST as saveHandler } from '@/app/api/proposals/route'
import { GET as getSingleHandler, DELETE as deleteHandler } from '@/app/api/proposals/[id]/route'

// Mock Supabase Server Client
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn()
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase))
}))

describe('Proposals REST API Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/proposals/generate', () => {
    it('returns status 200 with generated proposal for valid tender', async () => {
      const body = {
        tender: {
          title: 'Procurement of Medical Diagnostic Equipment',
          tender_number: 'MOH-2026-MED-01',
          organization_name: 'Ministry of Health',
          estimated_amount: 150000,
          currency: 'USD',
          submission_deadline: '2026-10-15T17:00:00Z'
        },
        company: {
          business_name: 'PharmaTech Asia Co., Ltd.',
          tax_id: 'K001-99887766'
        },
        language: 'en',
        selectedSections: ['cover_letter', 'methodology']
      }

      const req = new NextRequest('http://localhost:3000/api/proposals/generate', {
        method: 'POST',
        body: JSON.stringify(body)
      })

      const res = await generateHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.proposal).toBeDefined()
      expect(data.proposal.sections.cover_letter).toBeDefined()
      expect(data.proposal.sections.methodology).toBeDefined()
      expect(data.proposal.sections.compliance).toBeUndefined()
    })

    it('returns status 400 when tender payload is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/proposals/generate', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const res = await generateHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Tender data is required')
    })
  })

  describe('GET /api/proposals', () => {
    it('returns status 401 when user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const req = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'GET'
      })

      const res = await listHandler(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('returns status 200 with saved proposals when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'usr-123' } },
        error: null
      })

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'prop-1',
              title: 'Bid Proposal for IT Equipment',
              status: 'draft',
              language: 'en',
              created_at: '2026-09-01T00:00:00Z',
              tender: { title: 'IT Equipment' }
            }
          ],
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockQuery)

      const req = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'GET'
      })

      const res = await listHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })
  })

  describe('POST /api/proposals', () => {
    it('returns status 200 on successful draft save', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'usr-123' } },
        error: null
      })

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: 'prop-1',
            title: 'Saved Bid Proposal',
            status: 'draft'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockQuery)

      const req = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          tender_id: 't-101',
          title: 'Saved Bid Proposal',
          language: 'en',
          sections: { cover_letter: { title: 'Cover Letter', content: 'Text' } }
        })
      })

      const res = await saveHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('prop-1')
    })
  })

  describe('DELETE /api/proposals/[id]', () => {
    it('returns status 200 on successful deletion', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'usr-123' } },
        error: null
      })

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      }
      // Chain eq('id', id).eq('user_id', user_id)
      mockQuery.eq.mockReturnValueOnce(mockQuery)
      mockQuery.eq.mockResolvedValueOnce({ error: null })

      mockSupabase.from.mockReturnValueOnce(mockQuery)

      const req = new NextRequest('http://localhost:3000/api/proposals/prop-1', {
        method: 'DELETE'
      })

      const res = await deleteHandler(req, { params: Promise.resolve({ id: 'prop-1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
