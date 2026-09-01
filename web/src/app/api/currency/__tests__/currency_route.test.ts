import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/currency/route'
import { NextRequest } from 'next/server'
import { clearCurrencyCache } from '@/lib/currency'

describe('GET /api/currency Endpoint', () => {
  beforeEach(() => {
    clearCurrencyCache()
    vi.restoreAllMocks()
  })

  it('returns status 200 with exchange rates and base USD by default', async () => {
    const req = new NextRequest('http://localhost:3000/api/currency')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.base).toBe('USD')
    expect(data.rates).toBeDefined()
    expect(data.rates.KHR).toBeGreaterThan(0)
    expect(data.rates.EUR).toBeGreaterThan(0)
    expect(data.timestamp).toBeDefined()
  })

  it('converts an amount when amount, from, and to query params are provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/currency?amount=100&from=USD&to=KHR')
    const response = await GET(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.conversion).toBeDefined()
    expect(data.conversion.original_amount).toBe(100)
    expect(data.conversion.from_currency).toBe('USD')
    expect(data.conversion.to_currency).toBe('KHR')
    expect(data.conversion.converted_amount).toBeCloseTo(100 * data.rates.KHR, 0)
  })

  it('handles invalid amount gracefully', async () => {
    const req = new NextRequest('http://localhost:3000/api/currency?amount=invalid&from=USD&to=KHR')
    const response = await GET(req)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('Invalid numeric amount')
  })
})
