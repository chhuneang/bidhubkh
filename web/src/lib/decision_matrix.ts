/**
 * BidHubKH — AI Bid / No-Bid Decision Matrix & Win Probability Engine
 * Evaluates procurement complexity, margin feasibility, timeline risk, and supplier win probability.
 */

export interface BidDecisionResult {
  winProbability: number
  decision: 'BID' | 'BID_WITH_CAUTION' | 'NO_BID'
  decisionLabel: string
  badgeClass: string
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk'
  riskBadgeClass: string
  breakdown: {
    capabilityFit: number
    marginViability: number
    scheduleFeasibility: number
    complianceEase: number
  }
  keyRisks: string[]
  strategicAdvantages: string[]
  executiveAdvice: string
}

export function computeBidDecision(
  tender: {
    title: string
    estimated_value?: number | null
    deadline?: string | null
    procurement_method?: string | null
    requirements?: any
    products_services?: any
  },
  company?: {
    name?: string
    tax_id?: string | null
    registration_number?: string | null
    industry?: string | null
    description?: string | null
  } | null
): BidDecisionResult {
  const parseList = (val: any): string[] =>
    Array.isArray(val) ? val : (typeof val === 'string' ? JSON.parse(val || '[]') : [])

  const products = parseList(tender.products_services)
  const requirements = parseList(tender.requirements)

  // 1. Calculate Days Remaining
  let daysRemaining = 30
  if (tender.deadline) {
    const diff = new Date(tender.deadline).getTime() - Date.now()
    daysRemaining = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  // 2. Score 4 Core Dimensions (0 - 100 each)
  
  // A. Capability Fit (Base 65, +15 if company tax/registered, +10 for keyword matches)
  let capabilityFit = 65
  if (company?.tax_id) capabilityFit += 15
  if (company?.registration_number) capabilityFit += 10
  capabilityFit = Math.min(capabilityFit, 95)

  // B. Schedule Feasibility (Timeline risk)
  let scheduleFeasibility = 80
  if (daysRemaining < 7) {
    scheduleFeasibility = 30
  } else if (daysRemaining < 15) {
    scheduleFeasibility = 55
  } else if (daysRemaining >= 30) {
    scheduleFeasibility = 90
  }

  // C. Margin Viability (Procurement method & estimated budget)
  let marginViability = 75
  const method = (tender.procurement_method || '').toLowerCase()
  if (method.includes('direct') || method.includes('single')) {
    marginViability = 90
  } else if (method.includes('international') || method.includes('icb')) {
    marginViability = 60 // Higher competitive pressure
  }
  if (tender.estimated_value && tender.estimated_value > 250000) {
    marginViability += 10
  }
  marginViability = Math.min(Math.max(marginViability, 40), 95)

  // D. Compliance & Documentation Ease
  let complianceEase = 70
  if (requirements.length > 5) {
    complianceEase -= 15
  }
  if (company?.tax_id && company?.registration_number) {
    complianceEase += 20
  }
  complianceEase = Math.min(Math.max(complianceEase, 35), 95)

  // 3. Win Probability Weighted Calculation
  // 35% Capability + 25% Margin + 20% Schedule + 20% Compliance
  const winProbability = Math.round(
    capabilityFit * 0.35 +
    marginViability * 0.25 +
    scheduleFeasibility * 0.20 +
    complianceEase * 0.20
  )

  // 4. Strategic Risks & Advantages Identification
  const keyRisks: string[] = []
  const strategicAdvantages: string[] = []

  if (daysRemaining < 14) {
    keyRisks.push(`Tight submission timeline (${daysRemaining} days remaining to assemble bidding dossier).`)
  }
  if (!company?.tax_id) {
    keyRisks.push('Missing GDT Tax Patent Certificate (Mandatory requirement for Cambodian public tenders).')
  }
  if (requirements.length >= 4) {
    keyRisks.push('High compliance burden (Requires OEM Manufacturer Authorization Form & Audited Financials).')
  } else {
    keyRisks.push('Standard 2-year warranty and localized on-site technical support SLA required.')
  }

  if (company?.tax_id) {
    strategicAdvantages.push('Verified Cambodian taxpayer status provides scoring advantage in national competitive bidding.')
  }
  if (scheduleFeasibility >= 75) {
    strategicAdvantages.push('Ample preparation window allows optimization of bill-of-materials pricing.')
  }
  strategicAdvantages.push('High extraction confidence on procurement specifications ensures accurate cost estimation.')

  // 5. Decision Profile
  const isBid = winProbability >= 75 && scheduleFeasibility >= 60 && Boolean(company?.tax_id)
  const isCaution = !isBid && winProbability >= 50

  const profile = isBid
    ? {
        decision: 'BID' as const,
        decisionLabel: 'Bid with Confidence 🚀',
        badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        riskLevel: 'Low Risk' as const,
        riskBadgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        executiveAdvice: 'Strong commercial fit with high win probability. Proceed immediately to SBD document review and distributor price requests.'
      }
    : isCaution
    ? {
        decision: 'BID_WITH_CAUTION' as const,
        decisionLabel: 'Bid with Caution ⚠️',
        badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        riskLevel: 'Moderate Risk' as const,
        riskBadgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        executiveAdvice: 'Opportunity is commercially viable, but requires partnering with a certified subcontractor or joint-venture partner to satisfy full specs.'
      }
    : {
        decision: 'NO_BID' as const,
        decisionLabel: 'No-Bid Recommended 🛑',
        badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        riskLevel: 'High Risk' as const,
        riskBadgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        executiveAdvice: 'High barrier to entry or insufficient preparation time. Bidding resource investment is not justified by expected win margins.'
      }

  return {
    winProbability,
    ...profile,
    breakdown: {
      capabilityFit,
      marginViability,
      scheduleFeasibility,
      complianceEase
    },
    keyRisks,
    strategicAdvantages
  }
}
