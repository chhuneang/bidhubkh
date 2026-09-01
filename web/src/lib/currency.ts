/**
 * BidHubKH — Currency Intelligence & Conversion Engine
 * Provides dual-currency calculations (USD / KHR / EUR / JPY) with
 * National Bank of Cambodia (NBC) standard baseline rates and live rate fallback.
 */

export type SupportedCurrency = 'USD' | 'KHR' | 'EUR' | 'JPY' | 'GBP' | 'AUD' | 'SGD' | 'CNY' | 'THB' | 'VND'

/**
 * Official NBC / Market baseline exchange rates (Base: 1 USD).
 */
export const NBC_BASELINE_RATES: Record<string, number> = {
  USD: 1.0,
  KHR: 4075.0,     // National Bank of Cambodia standard reference rate
  EUR: 0.92,       // 1 USD = 0.92 EUR (~1 EUR = 1.087 USD)
  JPY: 155.0,      // 1 USD = 155 JPY
  GBP: 0.78,       // 1 USD = 0.78 GBP
  AUD: 1.52,       // 1 USD = 1.52 AUD
  SGD: 1.34,       // 1 USD = 1.34 SGD
  CNY: 7.23,       // 1 USD = 7.23 CNY
  THB: 36.5,       // 1 USD = 36.5 THB
  VND: 25400.0     // 1 USD = 25,400 VND
}

interface CacheEntry {
  base: string
  rates: Record<string, number>
  timestamp: number
  source: 'LIVE_FEED' | 'NBC_BASELINE'
}

let cachedRates: CacheEntry | null = null
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour in-memory cache

export function clearCurrencyCache(): void {
  cachedRates = null
}

/**
 * Converts an amount from one currency to another using the provided rates (or NBC baseline).
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = NBC_BASELINE_RATES
): number {
  if (!amount || amount === 0) return 0
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) return amount

  const fromRate = rates[from]
  const toRate = rates[to]

  if (!fromRate || !toRate) {
    return amount
  }

  // Convert `from` currency to base (USD), then base to `to` currency
  const amountInUSD = amount / fromRate
  const convertedAmount = amountInUSD * toRate

  return Math.round(convertedAmount * 100) / 100
}

/**
 * Formats a tender budget with primary and secondary dual-currency representations.
 */
export function formatMultiCurrency(
  amount: number | null | undefined,
  currency: string = 'USD',
  targetCurrency?: string
): { primary: string; secondary?: string; rateUsed?: number } {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return { primary: 'TBD / Not Disclosed' }
  }

  const curr = (currency || 'USD').toUpperCase()
  const target = targetCurrency
    ? targetCurrency.toUpperCase()
    : curr === 'USD'
      ? 'KHR'
      : 'USD'

  let primaryFormatted = ''
  if (curr === 'USD') {
    primaryFormatted = `$${amount.toLocaleString('en-US')}`
  } else if (curr === 'KHR') {
    primaryFormatted = `${amount.toLocaleString('en-US')} ៛`
  } else if (curr === 'EUR') {
    primaryFormatted = `€${amount.toLocaleString('en-US')}`
  } else if (curr === 'JPY') {
    primaryFormatted = `¥${amount.toLocaleString('en-US')}`
  } else {
    primaryFormatted = `${amount.toLocaleString('en-US')} ${curr}`
  }

  const converted = convertCurrency(amount, curr, target)
  let secondaryFormatted = ''
  if (target === 'KHR') {
    secondaryFormatted = `≈ ${converted.toLocaleString('en-US')} ៛`
  } else if (target === 'USD') {
    secondaryFormatted = `≈ $${converted.toLocaleString('en-US')}`
  } else {
    secondaryFormatted = `≈ ${converted.toLocaleString('en-US')} ${target}`
  }

  return {
    primary: primaryFormatted,
    secondary: secondaryFormatted,
    rateUsed: NBC_BASELINE_RATES[target] || 1
  }
}

/**
 * Fetches real-time exchange rates with fallback to NBC baseline reference rates.
 */
export async function getExchangeRates(
  baseCurrency: string = 'USD'
): Promise<CacheEntry> {
  const base = baseCurrency.toUpperCase()
  const now = Date.now()

  if (cachedRates && cachedRates.base === base && now - cachedRates.timestamp < CACHE_TTL_MS) {
    return cachedRates
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }
    } as any)

    if (res.ok) {
      const data = await res.json()
      if (data && (data.rates || data.conversion_rates)) {
        const rates = data.rates || data.conversion_rates
        cachedRates = {
          base,
          rates: {
            ...NBC_BASELINE_RATES,
            ...rates
          },
          timestamp: now,
          source: 'LIVE_FEED'
        }
        return cachedRates
      }
    }
  } catch {
    // Graceful fallback to NBC baseline
  }

  cachedRates = {
    base,
    rates: NBC_BASELINE_RATES,
    timestamp: now,
    source: 'NBC_BASELINE'
  }
  return cachedRates
}
