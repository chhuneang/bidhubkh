import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import {
  Search,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Laptop,
  HardHat,
  Stethoscope,
  Briefcase,
  Layers,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'

// Curated categories preview
const CATEGORIES = [
  { slug: 'it-telecom', nameEn: 'IT & Telecom', nameKm: 'បច្ចេកវិទ្យាព័ត៌មាន', count: 18, icon: Laptop },
  { slug: 'construction-civil', nameEn: 'Construction & Civil', nameKm: 'សំណង់ និងវិស្វកម្ម', count: 34, icon: HardHat },
  { slug: 'medical-healthcare', nameEn: 'Medical Supplies', nameKm: 'វេជ្ជសាស្ត្រ និងសុខាភិបាល', count: 12, icon: Stethoscope },
  { slug: 'consulting-services', nameEn: 'Consulting & Advisory', nameKm: 'សេវាប្រឹក្សាយោបល់', count: 15, icon: Briefcase },
]

// Sample featured tenders
const FEATURED_TENDERS = [
  {
    id: '1',
    slug: 'procurement-of-450-high-performance-laptops-and-it-infrastructure-wb-kh-2026-0891',
    title: 'Procurement of 450 High-Performance Laptops and IT Infrastructure for Digital Education Project',
    organization: 'World Bank Cambodia / MoEYS',
    orgType: 'Multilateral Bank',
    category: 'IT, Computers & Telecom',
    deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 285000,
    currency: 'USD',
    source: 'World Bank Cambodia',
    location: 'Phnom Penh & 12 Provinces',
    confidenceScore: 98,
    matchHighlight: 'High SME Eligibility',
  },
  {
    id: '2',
    slug: 'rehabilitation-and-asphalt-concrete-paving-rural-roads-kampong-cham-adb-cam-48218',
    title: 'Rehabilitation and Asphalt Concrete Paving of 38.5 km Rural Connectivity Roads in Kampong Cham',
    organization: 'Asian Development Bank / Ministry of Rural Development',
    orgType: 'Development Bank',
    category: 'Construction & Civil Works',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 1450000,
    currency: 'USD',
    source: 'ADB Cambodia',
    location: 'Kampong Cham Province',
    confidenceScore: 95,
    matchHighlight: 'ICB Civil Works',
  },
  {
    id: '3',
    slug: 'supply-and-installation-diagnostic-ultrasound-scanners-icu-monitors-moh-2026',
    title: 'Supply and Installation of Digital Diagnostic Ultrasound Scanners and Hospital ICU Monitors',
    organization: 'Ministry of Health (MoH)',
    orgType: 'Government Ministry',
    category: 'Medical & Healthcare',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 420000,
    currency: 'USD',
    source: 'GDIPP / MEF',
    location: 'Siem Reap & Battambang',
    confidenceScore: 96,
    matchHighlight: 'Medical ISO Certified',
  },
]

import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  let liveTenders: any[] = FEATURED_TENDERS
  let totalTenderCount = 41
  let sourceCount = 6

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()

      // 1. Live total count
      const { count } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
      if (count !== null) totalTenderCount = count

      // 2. Fetch latest 6 live tenders across all sources
      const { data: dbTenders } = await supabase
        .from('tenders')
        .select(`
          id,
          slug,
          title,
          deadline,
          published_at,
          estimated_value,
          currency,
          location,
          confidence_score,
          organizations (name_en),
          categories (slug, name_en),
          sources (name, code)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6)

      if (dbTenders && dbTenders.length > 0) {
        liveTenders = dbTenders.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          organization: t.organizations?.name_en || 'Public Procurement Agency',
          category: t.categories?.name_en || 'Procurement Package',
          deadline: t.deadline || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: t.published_at,
          estimatedValue: t.estimated_value,
          currency: t.currency || 'USD',
          source: t.sources?.name || 'Verified Source',
          location: t.location || 'Cambodia',
          confidenceScore: t.confidence_score || 95
        }))
      }
    } catch {
      // Fallback
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800/60">
          <div className="absolute inset-0 gradient-glow pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300 mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Cambodia&apos;s Next-Gen Procurement Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
              Discover & Win Public Tenders in{' '}
              <span className="gradient-text">Cambodia</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Consolidated opportunities from Government Ministries, World Bank, ADB, and NGOs. Automatically extracted, normalized, and matched to your business.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-3xl mx-auto">
              <form action="/tenders" method="GET" className="glass-panel rounded-2xl p-2 sm:p-3 shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-700/60">
                <div className="flex items-center gap-3 w-full px-3 py-2 flex-1">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search by keyword, laptops, road paving, ministry..."
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95 shrink-0"
                >
                  <Search className="h-4 w-4" />
                  Find Opportunities
                </button>
              </form>

              {/* Quick Keywords */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500">Popular:</span>
                {['IT Equipment', 'Solar Power', 'Road Construction', 'Medical Devices', 'CCTV Security'].map((tag) => (
                  <Link
                    key={tag}
                    href={`/tenders?q=${encodeURIComponent(tag)}`}
                    className="rounded-md bg-slate-900/60 px-2.5 py-1 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="glass-panel rounded-xl p-4 text-center border border-slate-800/80">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-slate-400 mt-1">Verified Public Sources</div>
              </div>
              <div className="glass-panel rounded-xl p-4 text-center border border-slate-800/80">
                <div className="text-2xl font-bold text-blue-400">Daily</div>
                <div className="text-xs text-slate-400 mt-1">Automated Updates</div>
              </div>
              <div className="glass-panel rounded-xl p-4 text-center border border-slate-800/80">
                <div className="text-2xl font-bold text-cyan-400">AI-Powered</div>
                <div className="text-xs text-slate-400 mt-1">PDF Extraction & Summaries</div>
              </div>
              <div className="glass-panel rounded-xl p-4 text-center border border-slate-800/80">
                <div className="text-2xl font-bold text-indigo-400">Bilingual</div>
                <div className="text-xs text-slate-400 mt-1">Khmer & English Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Explore by Sector
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Browse procurement opportunities categorized by industry taxonomy
              </p>
            </div>
            <Link
              href="/categories"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group"
            >
              View All Categories
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.slug}
                  href={`/tenders?category=${cat.slug}`}
                  className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                      {cat.count} Active
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {cat.nameEn}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cat.nameKm}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* 6 OFFICIAL PROCUREMENT SOURCES SHOWCASE */}
        <section className="py-12 border-b border-slate-800/60 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Integrated Official Cambodian Procurement Sources
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct ingestion and verified links across Government, Multilateral Banks, UN & Utilities
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/tenders?source=world_bank_kh"
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">
                WB
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                World Bank
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">27 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=adb_kh"
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-xs">
                ADB
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                ADB Cambodia
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">3 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=mef_gdipp"
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-black text-xs">
                MEF
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                Gov Ministries
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">4 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=ungm"
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xs">
                UN
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                UNGM Cambodia
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">3 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=ngo_cambodia"
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 font-black text-xs">
                NGO
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                NGO Portals
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">2 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=state_utilities"
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs">
                EDC
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                State Utilities
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">2 Live Tenders</span>
            </Link>
          </div>
        </section>

        {/* LATEST OPPORTUNITIES */}
        <section className="py-16 bg-slate-950/40 border-y border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                  <Zap className="h-3.5 w-3.5" />
                  Live Opportunities
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Featured & Recent Public Tenders
                </h2>
              </div>
              <Link
                href="/tenders"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group"
              >
                Browse All {totalTenderCount} Tenders
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveTenders.map((tender) => {
                const remaining = getDaysRemaining(tender.deadline)
                return (
                  <div
                    key={tender.id}
                    className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      {/* Source & Organization Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full truncate max-w-[200px]">
                          {tender.source}
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            remaining.isUrgent
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {remaining.text}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-white line-clamp-2 hover:text-blue-400 transition-colors leading-snug">
                        <Link href={`/tenders/${tender.slug}`}>{tender.title}</Link>
                      </h3>

                      {/* Organization & Location */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{tender.organization}</span>
                      </div>

                      {/* Budget / Value */}
                      <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                            Est. Budget
                          </span>
                          <span className="text-slate-200 font-bold">
                            {formatCurrency(tender.estimatedValue, tender.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                            Sector
                          </span>
                          <span className="text-slate-300 truncate block">
                            {tender.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {tender.confidenceScore}% AI Confidence
                      </span>
                      <Link
                        href={`/tenders/${tender.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Analyze Tender
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION / PIPELINE FLOW */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">
              The BidHubKH Advantage
            </h2>
            <p className="text-3xl font-bold text-white tracking-tight sm:text-4xl">
              From Discovery to Winning Bids
            </p>
            <p className="text-sm text-slate-400 mt-3">
              We eliminate hours of manual browsing across fragmented portals so your team can focus on preparing winning proposals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 mb-5 border border-blue-500/30">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1. Centralized Aggregation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated crawlers continuously monitor Cambodian ministries, ADB, World Bank, and development agencies so no deadline slips through.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 mb-5 border border-cyan-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">2. AI Tender Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                LLM engine parses 50+ page PDFs in Khmer and English to extract key eligibility criteria, required guarantees, and product specifications.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 mb-5 border border-indigo-500/30">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">3. Bid / No-Bid Decision</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches your company’s product catalog and past experience against tender requirements to generate objective qualification scores.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
