import { NextRequest, NextResponse } from 'next/server'
import { getExchangeRates, convertCurrency } from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const base = searchParams.get('base') || 'USD'
    const amountStr = searchParams.get('amount')
    const fromCurrency = searchParams.get('from') || base
    const toCurrency = searchParams.get('to') || 'KHR'

    const ratesData = await getExchangeRates(base)

    if (amountStr !== null) {
      const amount = parseFloat(amountStr)
      if (isNaN(amount)) {
        return NextResponse.json(
          { success: false, error: 'Invalid numeric amount provided' },
          { status: 400 }
        )
      }

      const converted = convertCurrency(amount, fromCurrency, toCurrency, ratesData.rates)
      return NextResponse.json({
        success: true,
        base: ratesData.base,
        rates: ratesData.rates,
        source: ratesData.source,
        timestamp: ratesData.timestamp,
        conversion: {
          original_amount: amount,
          from_currency: fromCurrency.toUpperCase(),
          to_currency: toCurrency.toUpperCase(),
          converted_amount: converted
        }
      })
    }

    return NextResponse.json({
      success: true,
      base: ratesData.base,
      rates: ratesData.rates,
      source: ratesData.source,
      timestamp: ratesData.timestamp
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process currency request' },
      { status: 500 }
    )
  }
}
