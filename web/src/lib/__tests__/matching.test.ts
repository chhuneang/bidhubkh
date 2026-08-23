import { describe, expect, it } from 'vitest'

import { calculateSupplierMatch } from '@/lib/matching'

/**
 * Characterization tests for `calculateSupplierMatch` (web/src/lib/matching.ts).
 *
 * Scoring model (hand-derived from the implementation):
 *   base            = 50
 *   tax_id          -> +15
 *   registration_no -> +10
 *   each product whose keyword matches the company context -> +5
 *   final = clamp(raw, 25, 98)   // raw can never drop below 50 via this flow
 * Tiers: >=80 High Fit | >=60 Moderate Fit | else Low Fit
 *
 * All expected values below are hand-calculated from that logic.
 */

const fullCreds = {
  name: 'Phnom Penh Computer Trading',
  tax_id: 'K001-901234567',
  registration_number: '00012345',
}

describe('calculateSupplierMatch — null company gate', () => {
  it('returns a signed-out placeholder result when company is null', () => {
    const result = calculateSupplierMatch(
      { title: 'Anything' },
      null
    )
    expect(result).toEqual({
      score: 0,
      tier: 'Low Fit',
      badgeColor: 'text-slate-400 bg-slate-800 border-slate-700',
      matchedProducts: [],
      unmatchedProducts: [],
      passedRequirements: [],
      missingRequirements: [],
      summary:
        'Sign in with your company account to see your personalized AI match analysis.',
      actionAdvice: 'Create or sign in to your supplier account.',
    })
  })
})

describe('calculateSupplierMatch — score component math (min/mid/max)', () => {
  it('scores legal/tax readiness: both credentials present (+25)', () => {
    // raw = 50 + 15 + 10 = 75, no products to score
    const result = calculateSupplierMatch(
      { title: 'Generic Tender', products_services: [] },
      { ...fullCreds }
    )
    expect(result.score).toBe(75)
    expect(result.tier).toBe('Moderate Fit')
    expect(result.badgeColor).toBe('text-cyan-400 bg-cyan-500/10 border-cyan-500/30')
    expect(result.passedRequirements).toEqual([
      'Valid Cambodian GDT Tax Patent / VAT Registration',
      'Ministry of Commerce (MoC) Business Certificate',
    ])
    expect(result.missingRequirements).toEqual([])
  })

  it('scores tax_id only (+15): raw 65', () => {
    const result = calculateSupplierMatch(
      { title: 'Generic Tender', products_services: [] },
      { name: 'Solo Co', tax_id: 'TAX-1' }
    )
    expect(result.score).toBe(65)
    expect(result.passedRequirements).toEqual([
      'Valid Cambodian GDT Tax Patent / VAT Registration',
    ])
    expect(result.missingRequirements).toEqual(['Missing MoC Registration Number'])
  })

  it('scores registration only (+10): raw lands exactly on the 60 Moderate boundary', () => {
    const result = calculateSupplierMatch(
      { title: 'Generic Tender', products_services: [] },
      { name: 'Solo Co', registration_number: 'REG-1' }
    )
    expect(result.score).toBe(60) // boundary: 60 >= 60 -> Moderate, not Low
    expect(result.tier).toBe('Moderate Fit')
    expect(result.passedRequirements).toEqual([
      'Ministry of Commerce (MoC) Business Certificate',
    ])
    expect(result.missingRequirements).toEqual(['Missing GDT Tax Patent Number'])
  })

  it('scores no credentials: raw stays at the 50 baseline', () => {
    const result = calculateSupplierMatch(
      { title: 'Generic Tender', products_services: [] },
      { name: 'Bare Co' }
    )
    expect(result.score).toBe(50)
    expect(result.missingRequirements).toEqual([
      'Missing GDT Tax Patent Number',
      'Missing MoC Registration Number',
    ])
  })

  it('adds +5 per keyword-matched product (High Fit at 80 boundary)', () => {
    // raw = 50 + 15 + 10 + 5 = 80 -> exactly on the High Fit boundary
    const result = calculateSupplierMatch(
      {
        title: 'Furniture Supply',
        products_services: ['Office Chairs'],
      },
      {
        ...fullCreds,
        description: 'we retail office furniture',
      }
    )
    // 'office chairs' -> token 'office'/'chairs' found in lowercased company context
    expect(result.score).toBe(80)
    expect(result.tier).toBe('High Fit') // >=80 boundary uses >=
    expect(result.badgeColor).toBe('text-emerald-400 bg-emerald-500/10 border-emerald-500/30')
    expect(result.matchedProducts).toEqual(['Office Chairs'])
    expect(result.unmatchedProducts).toEqual([])
  })

  it('clamps the raw score down to 98 at the top of the range', () => {
    // raw = 50 + 25 (creds) + 6 x 5 (matched products) = 105 -> clamped to 98
    const products = [
      'Alpha Hardware Kit',
      'Beta Hardware Kit',
      'Gamma Hardware Kit',
      'Delta Hardware Kit',
      'Epsilon Hardware Kit',
      'Zeta Hardware Kit',
    ]
    const result = calculateSupplierMatch(
      { title: 'Hardware Lot', products_services: products },
      { ...fullCreds, description: 'hardware distributor' }
    )
    expect(result.score).toBe(98)
    expect(result.matchedProducts).toHaveLength(6)
  })

  it('never drops below the floor even for a fully unmatched profile (floor 25 unreachable here)', () => {
    // raw baseline 50 with no creds and no matches; clamp floor 25 cannot bind
    const result = calculateSupplierMatch(
      { title: 'Medical Supplies Procurement', products_services: [] },
      { name: 'Zeta Logistics' }
    )
    expect(result.score).toBe(50)
    expect(result.tier).toBe('Low Fit')
    expect(result.badgeColor).toBe('text-rose-400 bg-rose-500/10 border-rose-500/30')
  })

  it('is case-insensitive across product and company text', () => {
    const result = calculateSupplierMatch(
      { title: 'Furnishing Package', products_services: ['OFFICE CHAIRS'] },
      { ...fullCreds, description: 'OFFICE Furniture Importer' }
    )
    expect(result.matchedProducts).toEqual(['OFFICE CHAIRS'])
    expect(result.unmatchedProducts).toEqual([])
  })
})

describe('calculateSupplierMatch — keyword matching mechanics', () => {
  it('ignores tokens of length <= 3 when matching', () => {
    // 'led bulbs' -> only qualifying token is 'bulbs' ('led' is filtered out);
    // context contains 'led' but never 'bulbs' nor the 8-char prefix 'led bulb'
    const result = calculateSupplierMatch(
      { title: 'Lighting Supply', products_services: ['LED Bulbs'] },
      { name: 'Acme Co', description: 'led specialist shop' }
    )
    expect(result.unmatchedProducts).toEqual(['LED Bulbs'])
    expect(result.score).toBe(50) // no +5 awarded
  })

  it('matches via the first-8-characters prefix fallback', () => {
    // 'transformers' as a whole token is absent, but its 8-char prefix
    // 'transfor' appears inside 'transformer station operator'
    const result = calculateSupplierMatch(
      { title: 'Grid Equipment', products_services: ['Transformers'] },
      { name: 'Grid Co', description: 'transformer station operator' }
    )
    expect(result.matchedProducts).toEqual(['Transformers'])
    expect(result.score).toBe(55) // 50 + one matched product
    expect(result.tier).toBe('Low Fit') // 55 < 60
  })

  it('also matches against the company name inside the context', () => {
    const result = calculateSupplierMatch(
      { title: 'Stationery Lot', products_services: ['Acme Widgets'] },
      { ...fullCreds, name: 'ACME Trading' }
    )
    expect(result.matchedProducts).toEqual(['Acme Widgets'])
  })
})

describe('calculateSupplierMatch — input parsing / zero-handling', () => {
  it('parses JSON-string encoded products_services and requirements', () => {
    const result = calculateSupplierMatch(
      {
        title: 'Solar Installation',
        products_services: '["Solar Panels"]',
        requirements: '["ISO 9001 certificate", "5 years experience"]',
      },
      { ...fullCreds, description: 'we install solar panels nationwide' }
    )
    expect(result.score).toBe(80) // 75 creds + 5 matched
    expect(result.matchedProducts).toEqual(['Solar Panels'])
  })

  it('tolerates undefined/null optional tender fields without throwing', () => {
    const result = calculateSupplierMatch(
      {
        title: 'Minimal Tender',
        products_services: undefined,
        requirements: undefined,
        category: null,
        estimated_value: null,
      },
      { ...fullCreds }
    )
    expect(result.score).toBe(75)
    expect(result.matchedProducts).toEqual([])
    expect(result.unmatchedProducts).toEqual([])
  })

  it('treats null credential fields as missing', () => {
    const result = calculateSupplierMatch(
      { title: 'Tender', products_services: [] },
      { name: 'Ghost Co', tax_id: null, registration_number: null }
    )
    expect(result.missingRequirements).toEqual([
      'Missing GDT Tax Patent Number',
      'Missing MoC Registration Number',
    ])
    expect(result.passedRequirements).toEqual([])
  })
})

describe('calculateSupplierMatch — gap-analysis output shape', () => {
  it('reports exactly one entry per credential gap, independent of tender.requirements content', () => {
    // Note (characterization): the tender's own requirements list does NOT feed
    // the gap analysis -- only the presence/absence of company credentials does.
    const result = calculateSupplierMatch(
      {
        title: 'Complex Tender',
        requirements: ['OEM authorization', 'Audited financials', 'Site visit'],
      },
      { name: 'Half Ready Co', tax_id: 'TAX-9' }
    )
    expect(result.passedRequirements).toHaveLength(1)
    expect(result.missingRequirements).toEqual(['Missing MoC Registration Number'])
  })

  it('falls back to the first two products under matchedProducts when nothing matched (overlap quirk)', () => {
    // Characterization quirk: with zero keyword hits, matchedProducts is filled
    // with products.slice(0, 2), so those items ALSO remain in unmatchedProducts.
    const result = calculateSupplierMatch(
      {
        title: 'Medical Supplies Procurement',
        products_services: ['Surgical Gloves', 'Face Masks', 'Syringes'],
      },
      { name: 'Zeta Logistics', industry: 'freight forwarding' }
    )
    expect(result.matchedProducts).toEqual(['Surgical Gloves', 'Face Masks'])
    expect(result.unmatchedProducts).toEqual(['Surgical Gloves', 'Face Masks', 'Syringes'])
  })
})

describe('calculateSupplierMatch — tier copy', () => {
  it('returns the High Fit summary and advice verbatim', () => {
    const result = calculateSupplierMatch(
      { title: 'ICT Lot', products_services: ['Computers'] },
      { ...fullCreds, description: 'computers and accessories trader' }
    )
    expect(result.summary).toBe(
      'Your company profile strongly aligns with this procurement package. You satisfy the core GDT tax and sector requirements.'
    )
    expect(result.actionAdvice).toBe(
      'Proceed with bid preparation. Download the official Standard Bidding Document (SBD) to review line item specifications.'
    )
  })

  it('returns the Moderate Fit summary and advice verbatim', () => {
    const result = calculateSupplierMatch(
      { title: 'Mixed Lot', products_services: [] },
      { ...fullCreds }
    )
    expect(result.summary).toBe(
      'Your business has relevant sector experience, but may need additional joint-venture partners or document updates.'
    )
    expect(result.actionAdvice).toBe(
      'Verify you have the required manufacturer authorization letters or joint-venture consortium agreements.'
    )
  })

  it('returns the Low Fit summary and advice verbatim', () => {
    const result = calculateSupplierMatch(
      { title: 'Unrelated Lot', products_services: [] },
      { name: 'No Match Co' }
    )
    expect(result.summary).toBe(
      'Limited direct product catalog match found for this specific procurement.'
    )
    expect(result.actionAdvice).toBe(
      'Update your company product catalog in Dashboard to improve match accuracy, or consider sub-contracting.'
    )
  })
})
