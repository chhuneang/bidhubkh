import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
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

// Realistic tender detail mock data
const SAMPLE_TENDER = {
  id: 't1',
  slug: 'procurement-of-450-high-performance-laptops-and-it-infrastructure-wb-kh-2026-0891',
  referenceNumber: 'WB/GDIPP/G/2026/014',
  title: 'Procurement of 450 High-Performance Laptops and IT Infrastructure for Digital Education Project',
  organization: 'The World Bank Cambodia Country Office / MoEYS',
  category: 'IT, Computers & Telecom',
  deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  estimatedValue: 285000,
  currency: 'USD',
  source: 'World Bank Cambodia',
  location: 'Phnom Penh & 12 Provinces (Secondary School Computer Labs)',
  procurementMethod: 'National Competitive Bidding (NCB)',
  originalUrl: 'https://projects.worldbank.org/en/projects-operations/procurement-detail/WB-KH-2026-0891',
  confidenceScore: 98,
  aiSummary: {
    overview: 'The Ministry of Education, Youth and Sport (MoEYS) financed by World Bank is seeking qualified Cambodian IT suppliers to deliver 450 enterprise laptops, 24 server rack cabinets, and UPS units to modernise digital learning laboratories.',
    keyBuyerIntent: 'Complete turnkey hardware supply with 3-year on-site manufacturer warranty support across 12 provinces.',
    bidSecurity: 'USD 5,500 Bank Guarantee required from a licensed Cambodian commercial bank.',
    urgencyLevel: 'Standard (24 days remaining until submission deadline)',
  },
  products: [
    '450x Enterprise Core i7/16GB/512GB SSD Laptops with Pre-installed OS',
    '24x 42U Server Rack Cabinets with PDU and Cable Management',
    '24x 3kVA Online Uninterruptible Power Supply (UPS) units',
    '150x Cat6 Gigabit 24-Port Managed Layer-2 Switches',
  ],
  requirements: [
    'Valid Certificate of Tax Compliance (GDT) and Ministry of Commerce Registration.',
    'Manufacturer Authorization Form (MAF) for all core computing hardware.',
    'Proof of at least 3 completed IT hardware supply contracts of similar scale (> USD 100k) within the last 5 years.',
    'Established physical technical service center presence in Phnom Penh with provincial support dispatch capability.',
  ],
  documents: [
    { name: 'Standard Bidding Document (SBD) - Goods.pdf', size: '2.4 MB', type: 'Bidding Document' },
    { name: 'Technical Specifications & Provincial Lab Distribution List.pdf', size: '1.1 MB', type: 'TOR / Specs' },
  ]
}

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tender = SAMPLE_TENDER
  const remaining = getDaysRemaining(tender.deadline)

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header />

      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Tender Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: Tender Main Details & AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Box */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  {tender.source}
                </span>
                <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                  Ref: {tender.referenceNumber}
                </span>
                <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                  {tender.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {tender.title}
              </h1>

              <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Procuring Organization</span>
                    <span className="font-semibold">{tender.organization}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Target Location</span>
                    <span className="font-semibold">{tender.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI TENDER INTELLIGENCE SUMMARY */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-blue-500/30 bg-blue-950/20 relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-4">
                <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                AI Tender Intelligence Summary
              </div>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {tender.aiSummary.overview}
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                    Key Buyer Objective
                  </span>
                  <span className="text-slate-200">{tender.aiSummary.keyBuyerIntent}</span>
                </div>

                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                    Bid Security Requirement
                  </span>
                  <span className="text-amber-300 font-medium">{tender.aiSummary.bidSecurity}</span>
                </div>
              </div>
            </div>

            {/* PRODUCTS & SPECIFICATIONS */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-400" />
                Products & Scope of Supply
              </h2>
              <ul className="space-y-3">
                {tender.products.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* MANDATORY ELIGIBILITY & REQUIREMENTS */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                Mandatory Eligibility & Documentation
              </h2>
              <ul className="space-y-3">
                {tender.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Key Dates, Budget, Actions */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
              {/* Value Box */}
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold">
                  Estimated Contract Budget
                </span>
                <span className="font-extrabold text-emerald-400 text-3xl mt-1 block">
                  {formatCurrency(tender.estimatedValue, tender.currency)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Method: {tender.procurementMethod}
                </span>
              </div>

              {/* Deadline countdown */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-2">
                  Submission Deadline
                </span>
                <div
                  className={`p-3 rounded-xl flex items-center justify-between ${
                    remaining.isUrgent
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-bold">{remaining.text}</span>
                  </div>
                  <span className="text-xs">{formatDate(tender.deadline)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <a
                  href={tender.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
                >
                  View Official Tender Portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:text-white transition-all"
                >
                  <Bookmark className="h-3.5 w-3.5 text-blue-400" />
                  Save to Bid Pipeline
                </button>
              </div>

              {/* Confidence Badge */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Extraction Confidence</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {tender.confidenceScore}% (Verified)
                </span>
              </div>
            </div>

            {/* Official Documents Box */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-400" />
                Attached Documents ({tender.documents.length})
              </h3>
              <div className="space-y-2.5">
                {tender.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate">
                      <span className="font-semibold text-white block truncate">{doc.name}</span>
                      <span className="text-[10px] text-slate-500">{doc.type} • {doc.size}</span>
                    </div>
                    <a
                      href={tender.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 shrink-0 font-medium"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
