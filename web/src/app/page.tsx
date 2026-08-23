import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
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
  ExternalLink,
  Compass,
  FileCheck
} from 'lucide-react'

// Curated categories preview
const CATEGORIES = [
  { slug: 'it-telecom', nameEn: 'IT & Telecom', nameKm: 'បច្ចេកវិទ្យាព័ត៌មាន', count: 18, icon: Laptop },
  { slug: 'construction-civil', nameEn: 'Construction & Civil', nameKm: 'សំណង់ និងវិស្វកម្ម', count: 34, icon: HardHat },
  { slug: 'medical-healthcare', nameEn: 'Medical Supplies', nameKm: 'វេជ្ជសាស្ត្រ និងសុខាភិបាល', count: 12, icon: Stethoscope },
  { slug: 'consulting-services', nameEn: 'Consulting & Advisory', nameKm: 'សេវាប្រឹក្សាយោបល់', count: 15, icon: Briefcase },
]

// Fallback featured tenders
const FEATURED_TENDERS = [
  {
    id: '1',
    slug: 'procurement-of-450-high-performance-laptops-and-it-infrastructure-wb-kh-2026-0891',
    title: 'Procurement of 450 High-Performance Laptops and IT Infrastructure for Digital Education Project',
    organization: 'World Bank Cambodia / MoEYS',
    category: 'IT, Computers & Telecom',
    deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 285000,
    currency: 'USD',
    source: 'World Bank Cambodia',
    location: 'Phnom Penh & 12 Provinces',
    confidenceScore: 98,
  }
]

export default async function HomePage() {
  let liveTenders: any[] = FEATURED_TENDERS
  let totalTenderCount = 41

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
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-18 lg:pt-18 lg:pb-24 border-b border-slate-200/80 bg-white">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-6 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Cambodia&apos;s Next-Gen Procurement Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
              Discover & Win Public Tenders in{' '}
              <span className="text-blue-600">Cambodia</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Consolidated opportunities from Government Ministries, World Bank, ADB, and NGOs. Automatically extracted, normalized, and matched to your business.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-3xl mx-auto">
              <form action="/tenders" method="GET" className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-md flex flex-col sm:flex-row items-center gap-2 border border-slate-200">
                <div className="flex items-center gap-3 w-full px-3 py-1.5 flex-1">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search by keyword, laptops, road paving, ministry..."
                    className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  Find Opportunities
                </button>
              </form>

              {/* Quick Keywords */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Popular:</span>
                {['IT Equipment', 'Solar Power', 'Road Construction', 'Medical Devices', 'CCTV Security'].map((tag) => (
                  <Link
                    key={tag}
                    href={`/tenders?q=${encodeURIComponent(tag)}`}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-slate-200/80">
                <div className="text-2xl font-bold text-slate-900">100%</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Verified Public Sources</div>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-slate-200/80">
                <div className="text-2xl font-bold text-blue-600">Daily</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Automated Updates</div>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-slate-200/80">
                <div className="text-2xl font-bold text-blue-600">AI-Powered</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">PDF Extraction & Summaries</div>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-slate-200/80">
                <div className="text-2xl font-bold text-slate-900">Bilingual</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Khmer & English Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 OFFICIAL PROCUREMENT SOURCES SHOWCASE */}
        <section className="py-12 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Integrated Official Cambodian Procurement Sources
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Direct ingestion and verified links across Government, Multilateral Banks, UN & Utilities
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/tenders?source=world_bank_kh"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                WB
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                World Bank
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">27 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=adb_kh"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                ADB
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                ADB Cambodia
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">3 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=mef_gdipp"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
                MEF
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Gov Ministries
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">4 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=ungm"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                UN
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                UNGM Cambodia
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">3 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=ngo_cambodia"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-xs">
                NGO
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                NGO Portals
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">2 Live Tenders</span>
            </Link>

            <Link
              href="/tenders?source=state_utilities"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                EDC
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                State Utilities
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">2 Live Tenders</span>
            </Link>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Explore by Sector
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Browse procurement opportunities categorized by industry taxonomy
              </p>
            </div>
            <Link
              href="/tenders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
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
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {cat.count} Active
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {cat.nameEn}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cat.nameKm}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* LATEST OPPORTUNITIES */}
        <section className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  <Zap className="h-3.5 w-3.5" />
                  Live Opportunities
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Featured & Recent Public Tenders
                </h2>
              </div>
              <Link
                href="/tenders"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
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
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Source & Organization Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full truncate max-w-[200px]">
                          {tender.source}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            remaining.isUrgent
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {remaining.text}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors leading-snug">
                        <Link href={`/tenders/${tender.slug}`}>{tender.title}</Link>
                      </h3>

                      {/* Organization & Location */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{tender.organization}</span>
                      </div>

                      {/* Budget / Value */}
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Est. Budget
                          </span>
                          <span className="text-slate-900 font-extrabold text-sm">
                            {formatCurrency(tender.estimatedValue, tender.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Sector
                          </span>
                          <span className="text-slate-700 font-medium truncate block">
                            {tender.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {tender.confidenceScore}% AI Confidence
                      </span>
                      <Link
                        href={`/tenders/${tender.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              The BidHubKH Advantage
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              From Discovery to Winning Bids
            </p>
            <p className="text-sm text-slate-600 mt-3">
              We eliminate hours of manual browsing across fragmented portals so your team can focus on preparing winning proposals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-5 border border-blue-100">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Centralized Aggregation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated crawlers continuously monitor Cambodian ministries, ADB, World Bank, and development agencies so no deadline slips through.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-5 border border-blue-100">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. AI Tender Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                LLM engine parses 50+ page PDFs in Khmer and English to extract key eligibility criteria, required guarantees, and product specifications.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-5 border border-blue-100">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Bid / No-Bid Decision</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
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
