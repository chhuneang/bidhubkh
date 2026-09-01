import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  convertCurrency,
  formatMultiCurrency,
  getExchangeRates,
  clearCurrencyCache,
  NBC_BASELINE_RATES,
  type SupportedCurrency
} from '@/lib/currency'

describe('Currency Intelligence Engine', () => {
  beforeEach(() => {
    clearCurrencyCache()
    vi.restoreAllMocks()
  })

  describe('convertCurrency', () => {
    it('converts USD to KHR accurately with baseline rates', () => {
      const usdAmount = 100
      const khr = convertCurrency(usdAmount, 'USD', 'KHR')
      expect(khr).toBe(407500) // 100 * 4075
    })

    it('converts KHR to USD accurately with baseline rates', () => {
      const khrAmount = 407500
      const usd = convertCurrency(khrAmount, 'KHR', 'USD')
      expect(usd).toBe(100)
    })

    it('returns exact amount when converting between the same currency', () => {
      expect(convertCurrency(5000, 'USD', 'USD')).toBe(5000)
      expect(convertCurrency(2000000, 'KHR', 'KHR')).toBe(2000000)
    })

    it('handles cross-currency conversion with intermediate USD base (EUR to KHR)', () => {
      // 100 EUR / 0.92 USD * 4075 KHR = 442,934.78 KHR
      const eurAmount = 100
      const khr = convertCurrency(eurAmount, 'EUR', 'KHR')
      expect(khr).toBeCloseTo(442934.78, 1)
    })

    it('handles custom exchange rates map override', () => {
      const customRates = { ...NBC_BASELINE_RATES, KHR: 4100 }
      const khr = convertCurrency(100, 'USD', 'KHR', customRates)
      expect(khr).toBe(410000)
    })

    it('handles zero and negative amounts cleanly', () => {
      expect(convertCurrency(0, 'USD', 'KHR')).toBe(0)
      expect(convertCurrency(-50, 'USD', 'KHR')).toBe(-203750)
    })

    it('falls back safely to 1:1 if an unknown currency is passed', () => {
      expect(convertCurrency(100, 'XYZ', 'USD')).toBe(100)
    })
  })

  describe('formatMultiCurrency', () => {
    it('formats USD tender with KHR counterpart badge', () => {
      const result = formatMultiCurrency(150000, 'USD', 'KHR')
      expect(result.primary).toBe('$150,000')
      expect(result.secondary).toContain('៛')
      expect(result.secondary).toContain('611,250,000')
    })

    it('formats KHR tender with USD counterpart badge', () => {
      const result = formatMultiCurrency(407500000, 'KHR', 'USD')
      expect(result.primary).toContain('407,500,000')
      expect(result.primary).toContain('៛')
      expect(result.secondary).toBe('≈ $100,000')
    })

    it('handles null or undefined amount gracefully', () => {
      const result = formatMultiCurrency(null, 'USD')
      expect(result.primary).toBe('TBD / Not Disclosed')
      expect(result.secondary).toBeUndefined()
    })
  })

  describe('getExchangeRates', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('returns baseline NBC rates with source flag when offline or fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const ratesData = await getExchangeRates('USD')
      expect(ratesData.base).toBe('USD')
      expect(ratesData.rates.KHR).toBe(4075)
      expect(ratesData.rates.EUR).toBe(0.92)
      expect(ratesData.source).toBe('NBC_BASELINE')
      expect(ratesData.timestamp).toBeGreaterThan(0)
    })

    it('parses live rates when public exchange rate API responds successfully', async () => {
      const mockApiResponse = {
        result: 'success',
        base_code: 'USD',
        conversion_rates: {
          USD: 1,
          KHR: 4085,
          EUR: 0.93,
          JPY: 155.2
        }
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      } as Response)

      const ratesData = await getExchangeRates('USD')
      expect(ratesData.base).toBe('USD')
      expect(ratesData.rates.KHR).toBe(4085)
      expect(ratesData.rates.JPY).toBe(155.2)
      expect(ratesData.source).toBe('LIVE_FEED')
    })
  })
})
