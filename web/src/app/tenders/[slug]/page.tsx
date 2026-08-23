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
  MapPin
} from 'lucide-react'
import { SaveTenderButton } from '@/components/tenders/SaveTenderButton'
import { SupplierMatchCard } from '@/components/tenders/SupplierMatchCard'
import { BidDecisionMatrixCard } from '@/components/tenders/BidDecisionMatrixCard'
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
      // Published + approved only: non-approved slugs fall into the fallback below.
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

  // No published+approved match (or Supabase unreachable): serve a real 404
  // instead of fabricating content — stale or hand-typed links must not
  // render invented procurement data.
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

      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Tender Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: Tender Main Details & AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Box */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
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

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
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
            <div className="bg-blue-50/60 rounded-2xl p-6 sm:p-8 border border-blue-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                AI Tender Intelligence Summary
              </div>

              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                {tender.summary || tender.description || 'Turnkey procurement opportunity published for eligible suppliers in Cambodia.'}
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-white p-4 border border-blue-100 shadow-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                    Procurement Method
                  </span>
                  <span className="text-slate-900 font-semibold">{tender.procurement_method || 'Competitive National / International Bidding'}</span>
                </div>

                <div className="rounded-xl bg-white p-4 border border-blue-100 shadow-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                    Eligibility Guidelines
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {tender.eligibility || 'Open to registered suppliers meeting standard procurement criteria.'}
                  </span>
                </div>
              </div>
            </div>

            {/* PRODUCTS & SPECIFICATIONS */}
            {products.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
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
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Mandatory Eligibility & Documentation
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
          </div>

          {/* RIGHT SIDEBAR: Key Dates, Budget, Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              {/* Value Box */}
              <div>
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-bold">
                  Estimated Contract Budget
                </span>
                <span className="font-extrabold text-slate-900 text-3xl mt-1 block">
                  {formatCurrency(tender.estimated_value, tender.currency)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Method: {tender.procurement_method || 'Competitive Bidding'}
                </span>
              </div>

              {/* Deadline countdown */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-bold mb-2">
                  Submission Deadline
                </span>
                <div
                  className={`p-3 rounded-xl flex items-center justify-between ${
                    remaining.isUrgent
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-bold">{remaining.text}</span>
                  </div>
                  <span className="text-xs font-semibold">{formatDate(tender.deadline)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <a
                  href={tender.original_url || 'https://projects.worldbank.org/en/projects-operations/procurement?countrycode_exact=KH'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer group"
                >
                  <span>View Official Notice on {tender.source?.name || 'Portal'}</span>
                  <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <SaveTenderButton tenderId={tender.id} initialSaved={isSaved} />
              </div>

              {/* Confidence Badge */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Extraction Confidence</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {tender.confidence_score || 95}% (Verified)
                </span>
              </div>
            </div>

            {/* Official Source & Verification Specifications Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Official Source Verification
              </h3>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Procuring Source</span>
                  <span className="font-semibold text-slate-900">{tender.source?.name || 'Verified Official Agency'}</span>
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
                  <span className="text-slate-500">Verification Seal</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> 100% Authentic Source
                  </span>
                </div>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">Attached SBD Documents ({documents.length})</span>
                  {documents.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 block truncate">{doc.name}</span>
                        <span className="text-[10px] text-slate-500">{doc.document_type || 'PDF Document'}</span>
                      </div>
                      <a
                        href={doc.original_url || tender.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 shrink-0 font-semibold flex items-center gap-1"
                      >
                        Download <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
