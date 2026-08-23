import { describe, expect, it } from 'vitest'

import { computeBidDecision } from '@/lib/decision_matrix'

/**
 * Characterization tests for `computeBidDecision` (web/src/lib/decision_matrix.ts).
 *
 * Component models (hand-derived from the implementation):
 *   capabilityFit    = min(65 + (tax_id ? 15 : 0) + (registration_number ? 10 : 0), 95)
 *   scheduleFeasibility = 30 if days < 7 | 55 if days < 15 | 90 if days >= 30 | else 80
 *   marginViability  = 90 if method ~ /direct|single/ | 60 if method ~ /international|icb/
 *                      | else 75;  +10 when estimated_value > 250000;
 *                      clamped to [40, 95]
 *   complianceEase   = 70 - (req.length > 5 ? 15 : 0) + (tax && reg ? 20 : 0),
 *                      clamped to [35, 95]
 *   winProbability   = round(cap*0.35 + margin*0.25 + sched*0.20 + comp*0.20)
 *
 * Deadlines are built relative to Date.now() so that Math.ceil(diff/day)
 * deterministically yields the intended day count (the elapsed time between
 * building the ISO string and calling the function is far below one day).
 */
const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString()

describe('computeBidDecision — capability fit component', () => {
  const tender = { title: 'T' }

  it.each([
    ['no credentials', undefined as const, 65],
    ['tax_id only', { name: 'C', tax_id: 'T1' }, 80],
    ['registration only', { name: 'C', registration_number: 'R1' }, 75],
    ['both credentials (cap 95 never binds)', { name: 'C', tax_id: 'T1', registration_number: 'R1' }, 90],
  ])('%s -> %i', (_label, company, expected) => {
    const result = computeBidDecision(tender, company)
    expect(result.breakdown.capabilityFit).toBe(expected)
  })
})

describe('computeBidDecision — schedule feasibility bands (boundary operators)', () => {
  const base = { title: 'T', procurement_method: '', estimated_value: null }

  it.each([
    // [< 7] exclusive low edge
    ['deadline 6 days out', 6, 30],
    ['deadline exactly 7 days out (< 7 is strict -> falls into < 15 band)', 7, 55],
    ['deadline 14 days out (< 15 inclusive-high of mid band)', 14, 55],
    ['deadline exactly 15 days out', 15, 80],
    ['deadline 29 days out (still below the >= 30 boost)', 29, 80],
    ['deadline exactly 30 days out (>= 30)', 30, 90],
  ])('%s -> scheduleFeasibility %i', (_label, days, expected) => {
    const result = computeBidDecision({ ...base, deadline: inDays(days) }, { name: 'C' })
    expect(result.breakdown.scheduleFeasibility).toBe(expected)
  })

  it('uses the 30-day default when deadline is absent -> scheduleFeasibility 90', () => {
    const result = computeBidDecision(base, { name: 'C' })
    expect(result.breakdown.scheduleFeasibility).toBe(90)
  })

  it('clamps an already-passed deadline to 1 day remaining -> scheduleFeasibility 30', () => {
    const result = computeBidDecision(
      { ...base, deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { name: 'C' }
    )
    expect(result.breakdown.scheduleFeasibility).toBe(30)
  })
})

describe('computeBidDecision — margin viability component', () => {
  const company = { name: 'C' }
  const t = (procurement_method: string | null, estimated_value?: number | null) => ({
    title: 'T',
    procurement_method,
    estimated_value,
  })

  it.each([
    ['unknown method, baseline', t(null), 75],
    ['method with no keyword hit', t('National Open Bidding'), 75],
    ['direct contracting', t('Direct Contracting'), 90],
    ['single-source selection (contains "single")', t('single-source selection'), 90],
    ['international open bidding', t('International Competitive Bidding'), 60],
    ['lowercase icb keyword', t('icb'), 60],
    ['value above 250k adds +10 over baseline', t(null, 300000), 85],
    ['value exactly 250k gets no bump (> is strict)', t(null, 250000), 75],
    ['direct + big value clamps at 95 (not 100)', t('Direct Contracting', 900000), 95],
    ['international + big value', t('International Bidding', 300000), 70],
  ])('%s -> %i', (_label, tender, expected) => {
    expect(computeBidDecision(tender, company).breakdown.marginViability).toBe(expected)
  })
})

describe('computeBidDecision — compliance ease component', () => {
  const t = (requirements: string[]) => ({ title: 'T', requirements })

  it.each([
    ['no requirements, no credentials', t([]), undefined as const, 70],
    ['exactly 5 requirements (penalty needs > 5)', t(['r1', 'r2', 'r3', 'r4', 'r5']), undefined, 70],
    ['6 requirements trigger -15', t(['r1', 'r2', 'r3', 'r4', 'r5', 'r6']), undefined, 55],
    ['both credentials add +20 even with heavy requirements', t(['r1', 'r2', 'r3', 'r4', 'r5', 'r6']), { name: 'C', tax_id: 'T', registration_number: 'R' }, 75],
    ['both credentials without requirements reach 90 (cap 95 never binds)', t([]), { name: 'C', tax_id: 'T', registration_number: 'R' }, 90],
  ])('%s -> %i', (_label, tender, company, expected) => {
    expect(computeBidDecision(tender, company).breakdown.complianceEase).toBe(expected)
  })
})

describe('computeBidDecision — win-probability decision bands', () => {
  it('awards BID exactly at the winProbability == 75 boundary', () => {
    // cap 80 (tax only) * 0.35 = 28; margin 60 (icb, value<=250k) * 0.25 = 15;
    // sched 90 (>= 30 days) * 0.20 = 18; comp 70 (2 reqs, no reg) * 0.20 = 14
    // winProbability = round(75) = 75 -> ">= 75" admits BID.
    const result = computeBidDecision(
      {
        title: 'ICB Package',
        procurement_method: 'ICB National Competitive',
        estimated_value: 100000,
        deadline: inDays(30),
        requirements: ['a', 'b'],
      },
      { name: 'Taxpayer Co', tax_id: 'T1' }
    )
    expect(result.breakdown).toEqual({
      capabilityFit: 80,
      marginViability: 60,
      scheduleFeasibility: 90,
      complianceEase: 70,
    })
    expect(result.winProbability).toBe(75)
    expect(result.decision).toBe('BID')
    expect(result.decisionLabel).toBe('Bid with Confidence 🚀')
    expect(result.badgeClass).toBe('text-emerald-400 bg-emerald-500/10 border-emerald-500/30')
    expect(result.riskLevel).toBe('Low Risk')
    expect(result.riskBadgeClass).toBe('text-emerald-400 bg-emerald-500/10 border-emerald-500/30')
    expect(result.executiveAdvice).toBe(
      'Strong commercial fit with high win probability. Proceed immediately to SBD document review and distributor price requests.'
    )
  })

  it('drops to BID_WITH_CAUTION just below the band (winProbability 72 via compliance penalty)', () => {
    // Same inputs as the BID boundary case, but 6 requirements push compliance
    // ease 70 -> 55, taking winProbability to 72 (< 75).
    const result = computeBidDecision(
      {
        title: 'ICB Package',
        procurement_method: 'ICB National Competitive',
        estimated_value: 100000,
        deadline: inDays(30),
        requirements: ['1', '2', '3', '4', '5', '6'],
      },
      { name: 'Taxpayer Co', tax_id: 'T1' }
    )
    expect(result.winProbability).toBe(72)
    expect(result.decision).toBe('BID_WITH_CAUTION')
    expect(result.decisionLabel).toBe('Bid with Caution ⚠️')
    expect(result.badgeClass).toBe('text-cyan-400 bg-cyan-500/10 border-cyan-500/30')
    expect(result.riskLevel).toBe('Moderate Risk')
    expect(result.executiveAdvice).toBe(
      'Opportunity is commercially viable, but requires partnering with a certified subcontractor or joint-venture partner to satisfy full specs.'
    )
  })

  it('withholds BID when winProbability clears 75 but the company lacks a tax_id', () => {
    // cap 65, margin 90 (direct), sched 90, comp 70 -> winProbability 77 (>= 75)
    // yet the BID branch additionally requires company.tax_id.
    const result = computeBidDecision({
      title: 'Direct Award',
      procurement_method: 'Direct Contracting',
      estimated_value: 50000,
      deadline: inDays(40),
      requirements: ['only one'],
    })
    expect(result.winProbability).toBe(77)
    expect(result.decision).toBe('BID_WITH_CAUTION')
  })

  it('withholds BID when the submission window is tight even with a high winProbability', () => {
    // cap 80 (tax), margin 90 (direct), sched 55 (10 days out < 60), comp 70
    // -> winProbability rounds to 76, but scheduleFeasibility 55 < 60 blocks BID.
    const result = computeBidDecision(
      {
        title: 'Rush Direct Award',
        procurement_method: 'Direct Contracting',
        estimated_value: 50000,
        deadline: inDays(10),
        requirements: ['a', 'b'],
      },
      { name: 'Taxpayer Co', tax_id: 'T1' }
    )
    expect(result.breakdown.scheduleFeasibility).toBe(55)
    expect(result.decision).toBe('BID_WITH_CAUTION')
    expect(result.riskLevel).toBe('Moderate Risk')
  })

  it('never reaches NO_BID even under worst-case inputs (dead branch characterization)', () => {
    // Minimum achievable weighted sum: cap 65 + margin 60 + sched 30 + comp 55
    // = 54.75 -> rounds to 55, which still lands in the >= 50 caution band.
    // The NO_BID branch is therefore unreachable with current scoring ranges.
    const result = computeBidDecision({
      title: 'Impossible Package',
      procurement_method: 'International Competitive Bidding',
      estimated_value: 1000,
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      requirements: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    })
    expect(result.breakdown).toEqual({
      capabilityFit: 65,
      marginViability: 60,
      scheduleFeasibility: 30,
      complianceEase: 55,
    })
    expect(result.winProbability).toBe(55)
    expect(result.decision).toBe('BID_WITH_CAUTION')
  })
})

describe('computeBidDecision — key risks identification', () => {
  it('flags tight timeline, missing tax certificate, and light compliance for a small unregistered bidder', () => {
    const result = computeBidDecision(
      { title: 'T', deadline: inDays(13), requirements: ['a', 'b', 'c'] },
      { name: 'Unregistered Co' }
    )
    expect(result.keyRisks).toEqual([
      'Tight submission timeline (13 days remaining to assemble bidding dossier).',
      'Missing GDT Tax Patent Certificate (Mandatory requirement for Cambodian public tenders).',
      'Standard 2-year warranty and localized on-site technical support SLA required.',
    ])
  })

  it('suppresses the timeline risk at exactly 14 days and flags OEM burden at >= 4 requirements', () => {
    const result = computeBidDecision(
      { title: 'T', deadline: inDays(14), requirements: ['a', 'b', 'c', 'd'] },
      { name: 'Registered Co', tax_id: 'T1' }
    )
    expect(result.keyRisks).toEqual([
      'High compliance burden (Requires OEM Manufacturer Authorization Form & Audited Financials).',
    ])
  })
})

describe('computeBidDecision — strategic advantages identification', () => {
  it('lists taxpayer status and prep-window advantages plus the constant confidence line', () => {
    const result = computeBidDecision(
      { title: 'T', deadline: inDays(45), requirements: [] },
      { name: 'Verified Co', tax_id: 'T1' }
    )
    expect(result.strategicAdvantages).toEqual([
      'Verified Cambodian taxpayer status provides scoring advantage in national competitive bidding.',
      'Ample preparation window allows optimization of bill-of-materials pricing.',
      'High extraction confidence on procurement specifications ensures accurate cost estimation.',
    ])
  })

  it('reduces to the constant confidence line when unverified and rushed', () => {
    const result = computeBidDecision(
      { title: 'T', deadline: inDays(8), requirements: [] },
      { name: 'Unknown Co' }
    )
    expect(result.strategicAdvantages).toEqual([
      'High extraction confidence on procurement specifications ensures accurate cost estimation.',
    ])
  })
})
