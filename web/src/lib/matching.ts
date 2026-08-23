export interface SupplierMatchResult {
  score: number
  tier: 'High Fit' | 'Moderate Fit' | 'Low Fit'
  badgeColor: string
  matchedProducts: string[]
  unmatchedProducts: string[]
  passedRequirements: string[]
  missingRequirements: string[]
  summary: string
  actionAdvice: string
}

export function calculateSupplierMatch(
  tender: {
    title: string
    products_services?: any
    requirements?: any
    estimated_value?: number | null
    category?: { name_en?: string } | null
  },
  company: {
    name: string
    tax_id?: string | null
    registration_number?: string | null
    industry?: string | null
    description?: string | null
    location?: string | null
  } | null
): SupplierMatchResult {
  if (!company) {
    return {
      score: 0,
      tier: 'Low Fit',
      badgeColor: 'text-slate-400 bg-slate-800 border-slate-700',
      matchedProducts: [],
      unmatchedProducts: [],
      passedRequirements: [],
      missingRequirements: [],
      summary: 'Sign in with your company account to see your personalized AI match analysis.',
      actionAdvice: 'Create or sign in to your supplier account.'
    }
  }

  const products: string[] = Array.isArray(tender.products_services)
    ? tender.products_services
    : (typeof tender.products_services === 'string' ? JSON.parse(tender.products_services || '[]') : [])

  const requirements: string[] = Array.isArray(tender.requirements)
    ? tender.requirements
    : (typeof tender.requirements === 'string' ? JSON.parse(tender.requirements || '[]') : [])

  let score = 50 // Base baseline

  // 1. Legal / Tax Readiness Check (up to +25 points)
  const passedReqs: string[] = []
  const missingReqs: string[] = []

  if (company.tax_id) {
    score += 15
    passedReqs.push('Valid Cambodian GDT Tax Patent / VAT Registration')
  } else {
    missingReqs.push('Missing GDT Tax Patent Number')
  }

  if (company.registration_number) {
    score += 10
    passedReqs.push('Ministry of Commerce (MoC) Business Certificate')
  } else {
    missingReqs.push('Missing MoC Registration Number')
  }

  // 2. Industry & Keyword Matching (up to +25 points)
  const tenderContext = `${tender.title} ${products.join(' ')} ${tender.category?.name_en || ''}`.toLowerCase()
  const companyContext = `${company.industry || ''} ${company.description || ''} ${company.name}`.toLowerCase()

  const matchedItems: string[] = []
  const unmatchedItems: string[] = []

  // Check product keywords
  products.forEach((p) => {
    const pLower = p.toLowerCase()
    // Test for common tokens
    const tokens = pLower.split(/\s+/).filter((t) => t.length > 3)
    const isMatched = tokens.some((token) => companyContext.includes(token)) ||
      companyContext.includes(pLower.slice(0, 8))

    if (isMatched) {
      matchedItems.push(p)
      score += 5
    } else {
      unmatchedItems.push(p)
    }
  })

  // Normalize score between 20 and 98
  score = Math.min(Math.max(score, 25), 98)

  let tier: 'High Fit' | 'Moderate Fit' | 'Low Fit' = 'Moderate Fit'
  let badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  let summary = ''
  let actionAdvice = ''

  if (score >= 80) {
    tier = 'High Fit'
    badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    summary = `Your company profile strongly aligns with this procurement package. You satisfy the core GDT tax and sector requirements.`
    actionAdvice = `Proceed with bid preparation. Download the official Standard Bidding Document (SBD) to review line item specifications.`
  } else if (score >= 60) {
    tier = 'Moderate Fit'
    badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    summary = `Your business has relevant sector experience, but may need additional joint-venture partners or document updates.`
    actionAdvice = `Verify you have the required manufacturer authorization letters or joint-venture consortium agreements.`
  } else {
    tier = 'Low Fit'
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    summary = `Limited direct product catalog match found for this specific procurement.`
    actionAdvice = `Update your company product catalog in Dashboard to improve match accuracy, or consider sub-contracting.`
  }

  return {
    score,
    tier,
    badgeColor,
    matchedProducts: matchedItems.length > 0 ? matchedItems : products.slice(0, 2),
    unmatchedProducts: unmatchedItems,
    passedRequirements: passedReqs,
    missingRequirements: missingReqs,
    summary,
    actionAdvice
  }
}
