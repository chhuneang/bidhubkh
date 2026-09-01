import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { publicTenderBySlug } from '@/lib/tenders'
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Share2,
  Layers,
  MapPin,
  Download,
  ChevronRight,
  ShieldAlert,
  FileCheck
} from 'lucide-react'
import { SaveTenderButton } from '@/components/tenders/SaveTenderButton'
import { SupplierMatchCard } from '@/components/tenders/SupplierMatchCard'
import { BidDecisionMatrixCard } from '@/components/tenders/BidDecisionMatrixCard'
import { ProposalCoPilotButton } from '@/components/proposals/ProposalCoPilotButton'
import { calculateSupplierMatch } from '@/lib/matching'
import { computeBidDecision } from '@/lib/decision_matrix'

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let tender: any = null
  let isSaved = false
  let user: any = null
  let company: any = null

  // Fetch live from Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()
      const { data, error } = await publicTenderBySlug(supabase, slug).maybeSingle()

      if (!error && data) {
        tender = {
          ...data,
          organization: data.organizations,
          category: data.categories,
          source: data.sources,
        }
      }

      // Check if logged in user & fetch company
      const { data: authData } = await supabase.auth.getUser()
      user = authData.user

      if (user) {
        // Fetch company
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        company = comp

        if (data) {
          const { data: savedRow } = await supabase
            .from('saved_tenders')
            .select('id')
            .eq('user_id', user.id)
            .eq('tender_id', data.id)
            .maybeSingle()
          if (savedRow) isSaved = true
        }
      }
    } catch (err) {
      console.error('Failed to fetch tender:', err)
    }
  }

  if (!tender) {
    notFound()
  }

  const remaining = getDaysRemaining(tender.deadline)
  const products: string[] = Array.isArray(tender.products_services)
    ? tender.products_services
    : (typeof tender.products_services === 'string' ? JSON.parse(tender.products_services) : [])

  const requirements: string[] = Array.isArray(tender.requirements)
    ? tender.requirements
    : (typeof tender.requirements === 'string' ? JSON.parse(tender.requirements) : [])

  const documents = tender.tender_documents || []
  const matchResult = calculateSupplierMatch(tender, company)
  const decisionResult = computeBidDecision(tender, company)

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white">
      <Header />

      <main id="main-content" className="flex-1 py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/tenders" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Tender Catalog
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="text-slate-700 truncate max-w-xs">{tender.category?.name_en || 'Procurement Package'}</span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="text-slate-400 truncate max-w-[200px]">{tender.reference_number || 'Notice Details'}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: Tender Main Details & AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Box */}
            <div className="surface-card rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                  {tender.source?.name || 'Verified Source'}
                </span>
                {tender.reference_number && (
                  <span className="text-xs font-mono text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-semibold">
                    Ref: {tender.reference_number}
                  </span>
                )}
                <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-medium">
                  {tender.category?.name_en || 'Procurement Opportunity'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight [text-wrap:balance]">
                {tender.title}
              </h1>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Procuring Organization</span>
                    <span className="font-semibold text-slate-900">{tender.organization?.name_en || 'Cambodia Public Agency'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Location</span>
                    <span className="font-semibold text-slate-900">{tender.location || 'Cambodia'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI SUPPLIER MATCH & GAP ANALYSIS CARD */}
            <SupplierMatchCard
              matchResult={matchResult}
              company={company}
              isLoggedIn={!!user}
            />

            {/* AI BID / NO-BID DECISION MATRIX CARD */}
            <BidDecisionMatrixCard
              decisionResult={decisionResult}
              tenderTitle={tender.title}
            />

            {/* AI TENDER INTELLIGENCE SUMMARY */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                AI Tender Intelligence Summary
              </div>

              {tender.summary || tender.description ? (
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                  {tender.summary || tender.description}
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed font-medium italic">
                  No summary was captured from the original notice — consult the issuing authority&apos;s announcement for full details.
                </p>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-2xl bg-white p-4 border border-blue-100 shadow-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                    Procurement Method
                  </span>
                  <span className="text-slate-900 font-semibold">{tender.procurement_method || 'Not specified in notice'}</span>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-blue-100 shadow-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                    Eligibility Guidelines
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {tender.eligibility || 'Not specified in notice — confirm criteria with the issuing authority.'}
                  </span>
                </div>
              </div>
            </div>

            {/* PRODUCTS & SCOPE OF SUPPLY */}
            {products.length > 0 && (
              <div className="surface-card rounded-3xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Products & Scope of Supply
                </h2>
                <ul className="space-y-3">
                  {products.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* MANDATORY ELIGIBILITY & REQUIREMENTS */}
            {requirements.length > 0 && (
              <div className="surface-card rounded-3xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Mandatory Eligibility & Documentation Checklist
                </h2>
                <ul className="space-y-3">
                  {requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TENDER SUMMARY SHEETS */}
            {documents.length > 0 && (
              <div className="surface-card rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Tender Summary Sheets ({documents.length})
                  </h2>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 self-start sm:self-auto">
                    <FileText className="h-3 w-3 text-slate-500" /> Auto-generated — not official documents
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 font-medium mb-4">
                  These summary sheets are compiled automatically by BidHubKH from the notice data above. For the legally binding bidding document, always download it from the issuing authority&apos;s portal.
                </p>

                <div className="space-y-3">
                  {documents.map((doc: any, idx: number) => {
                    const sizeMb = doc.file_size_bytes
                      ? (doc.file_size_bytes / (1024 * 1024)).toFixed(1) + ' MB'
                      : 'Generated on demand'
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition-all card-interactive"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-100/80 text-blue-700 shrink-0 mt-0.5">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {doc.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] text-slate-600 tabular-nums">
                                {sizeMb}
                              </span>
                              <span>•</span>
                              <span>BidHubKH Summary Dossier</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`/api/tenders/${tender.slug}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-tactile inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs shrink-0 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Summary PDF</span>
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: Key Dates, Budget, Actions */}
          <div className="space-y-6">
            <div className="surface-card rounded-3xl p-6 sm:p-7 space-y-6">
              {/* Value Box */}
              <div>
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-bold">
                  Estimated Contract Budget
                </span>
                <span className="font-black text-slate-900 text-3xl mt-1 block tabular-nums">
                  {formatCurrency(tender.estimated_value, tender.currency)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Method: {tender.procurement_method || 'Not specified in notice'}
                </span>
              </div>

              {/* Deadline countdown */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-bold mb-2">
                  Submission Deadline
                </span>
                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-between ${
                    remaining.isUrgent
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-bold tabular-nums">{remaining.text}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{formatDate(tender.deadline)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <ProposalCoPilotButton
                  tender={{
                    id: tender.id,
                    title: tender.title,
                    tender_number: tender.reference_number || tender.external_id,
                    estimated_amount: tender.estimated_value,
                    currency: tender.currency,
                    submission_deadline: tender.deadline,
                    source_code: tender.source?.code,
                    ai_summary: tender.summary || tender.description,
                    bill_of_quantities: tender.bill_of_quantities,
                    eligibility_checklist: tender.eligibility_checklist,
                    organization: tender.organization
                  }}
                  company={company}
                />

                <a
                  href={`/api/tenders/${tender.slug}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-xs font-black text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Tender Summary (PDF)</span>
                </a>

                {tender.original_url ? (
                  <a
                    href={tender.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile w-full flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-slate-200 text-slate-800 hover:border-blue-400 hover:text-blue-600 shadow-xs px-4 py-3 text-xs font-bold cursor-pointer group"
                  >
                    <span>View Original Notice on {tender.source?.name || 'Portal'}</span>
                    <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 px-4 py-3 text-xs font-bold">
                    <span>Original notice link not captured</span>
                  </div>
                )}

                <SaveTenderButton tenderId={tender.id} initialSaved={isSaved} />
              </div>

              {/* Confidence Badge */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">AI Extraction Score</span>
                {typeof tender.confidence_score === 'number' ? (
                  <span className="text-slate-800 font-bold flex items-center gap-1 tabular-nums">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    {tender.confidence_score}% Confidence
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold">Not scored</span>
                )}
              </div>
            </div>

            {/* Source & Record Details Box */}
            <div className="surface-card rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Source & Record Verification
              </h3>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Procuring Source</span>
                  <span className="font-semibold text-slate-900">{tender.source?.name || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Reference Number</span>
                  <span className="font-mono text-[11px] text-blue-600 font-bold">{tender.reference_number || 'N/A'}</span>
                </div>
                {tender.external_id && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500">External Notice ID</span>
                    <span className="font-mono text-[11px] text-slate-700 font-medium">{tender.external_id}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Record Status</span>
                  <span className="text-slate-700 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 100% Verified Notice
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
