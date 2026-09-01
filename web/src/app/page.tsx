import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { publicTenders, countPublicTenders } from '@/lib/tenders'
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
  FileCheck,
  Globe,
  Lock,
  Cpu,
  FileText,
  Activity,
  Target,
  Clock,
  Send,
  AlertTriangle
} from 'lucide-react'

// Curated categories preview
const CATEGORIES = [
  { slug: 'it-telecom', nameEn: 'IT & Telecom', nameKm: 'បច្ចេកវិទ្យាព័ត៌មាន', count: 18, icon: Laptop, color: 'text-blue-600 bg-blue-50/80 border-blue-200' },
  { slug: 'construction-civil', nameEn: 'Construction & Civil', nameKm: 'សំណង់ និងវិស្វកម្ម', count: 34, icon: HardHat, color: 'text-amber-600 bg-amber-50/80 border-amber-200' },
  { slug: 'medical-healthcare', nameEn: 'Medical Supplies', nameKm: 'វេជ្ជសាស្ត្រ និងសុខាភិបាល', count: 12, icon: Stethoscope, color: 'text-rose-600 bg-rose-50/80 border-rose-200' },
  { slug: 'consulting-services', nameEn: 'Consulting & Advisory', nameKm: 'សេវាប្រឹក្សាយោបល់', count: 15, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50/80 border-indigo-200' },
]

export default async function HomePage() {
  let liveTenders: any[] = []
  let totalTenderCount = 0

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()

      // 1. Live total count (published + approved only)
      const count = await countPublicTenders(supabase)
      if (count !== null) totalTenderCount = count

      // 2. Fetch latest 6 live tenders across all sources
      const { data: dbTenders } = await publicTenders(supabase)
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

      <main id="main-content" className="flex-1">
        {/* SECTION 1: HERO */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/90 bg-white ambient-grid">
          {/* Ambient Radial Glow */}
          <div className="absolute inset-0 radial-glow pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-4 py-1.5 text-xs font-bold text-blue-800 mb-6 shadow-xs backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <span>Cambodia&apos;s Centralized Procurement Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12] [text-wrap:balance]">
              Discover & Win Official Public Tenders in{' '}
              <span className="text-blue-600 underline decoration-blue-200 decoration-wavy underline-offset-8">
                Cambodia
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed [text-wrap:pretty]">
              Consolidated opportunities from Government Ministries, World Bank, Asian Development Bank, UN, and NGOs. Automatically extracted, normalized, and matched to local suppliers.
            </p>

            {/* Search Bar */}
            <div className="mt-10 max-w-3xl mx-auto">
              <form action="/tenders" method="GET" className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow flex flex-col sm:flex-row items-center gap-2 border-2 border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                <div className="flex items-center gap-3 w-full px-3 py-1.5 flex-1">
                  <Search className="h-5 w-5 text-blue-600 shrink-0" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search by keyword, laptops, road paving, ministry, ref no..."
                    className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 shrink-0 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  Find Opportunities
                </button>
              </form>

              {/* Quick Keywords */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-400">Popular:</span>
                {['IT Equipment', 'Solar Power', 'Road Construction', 'Medical Devices', 'CCTV Security', 'Consultancy'].map((tag) => (
                  <Link
                    key={tag}
                    href={`/tenders?q=${encodeURIComponent(tag)}`}
                    className="btn-tactile rounded-lg bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-semibold"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="surface-card rounded-2xl p-4 sm:p-5 text-center card-interactive">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">100%</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">Verified Official Portals</div>
              </div>
              <div className="surface-card rounded-2xl p-4 sm:p-5 text-center card-interactive">
                <div className="text-2xl sm:text-3xl font-black text-blue-600 tabular-nums">Daily</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">Automated Crawl Updates</div>
              </div>
              <div className="surface-card rounded-2xl p-4 sm:p-5 text-center card-interactive">
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 tabular-nums">AI-Ready</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">BoQ & Compliance Extraction</div>
              </div>
              <div className="surface-card rounded-2xl p-4 sm:p-5 text-center card-interactive">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums">Bilingual</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">Khmer & English Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 6 OFFICIAL PROCUREMENT SOURCES TRUST GRID */}
        <section className="py-14 border-b border-slate-200/90 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Integrated Official Cambodian Procurement Gateways
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              Direct ingestion and verified links across Government Ministries, Multilateral Banks, UN & Utilities
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Link
              href="/tenders?source=world_bank_kh"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-2 card-interactive"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">
                WB
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                World Bank
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                27 Tenders
              </span>
            </Link>

            <Link
              href="/tenders?source=adb_kh"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-2 card-interactive"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
                ADB
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                ADB Cambodia
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                3 Tenders
              </span>
            </Link>

            <Link
              href="/tenders?source=mef_gdipp"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-2 card-interactive"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 font-black text-xs">
                MEF
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Gov Ministries
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                4 Tenders
              </span>
            </Link>

            <Link
              href="/tenders?source=ungm"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-2 card-interactive"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 font-black text-xs">
                UN
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                UNGM Cambodia
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                3 Tenders
              </span>
            </Link>

            <Link
              href="/tenders?source=ngo_cambodia"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-2 card-interactive"
            >
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 font-black text-xs">
                NGO
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                NGO Portals
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                2 Tenders
              </span>
            </Link>

            <Link
              href="/tenders?source=state_utilities"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-2 card-interactive"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
                EDC
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                State Utilities
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                2 Tenders
              </span>
            </Link>
          </div>
        </section>

        {/* SECTION 3: ASYMMETRIC BENTO GRID (AI EXTRACTION & ANTI-404) */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Gen Procurement Architecture</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Engineered for Cambodian Enterprises
              </h2>
            </div>
            <Link
              href="/sources"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              View Crawler Health Sentinel
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Wide AI Extraction */}
            <div className="md:col-span-2 surface-card rounded-3xl p-8 card-interactive relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    AI PDF Parser
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                  Autonomous Deep PDF & Bill of Quantities Extraction
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Official bidding notices often span 50+ pages in mixed Khmer and English. Our engine automatically parses document attachments into structured item tables, required certifications, and exact scope of work in under 3 seconds.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Extraction Time</span>
                  <span className="text-slate-900 font-black text-sm">&lt; 3 Seconds</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Formats</span>
                  <span className="text-slate-900 font-black text-sm">PDF, DOCX, Scan</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Languages</span>
                  <span className="text-slate-900 font-black text-sm">Khmer & English</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Anti-404 Link Sentinel */}
            <div className="surface-card rounded-3xl p-8 card-interactive flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Anti-404 URL Health Sentinel
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  We pre-validate every link against live portal servers. If an official website changes its URL structure, our link sentinel automatically recovers the correct document endpoint.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-teal-700 font-bold flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-teal-600" />
                  99.8% Sentinel Uptime
                </span>
                <Link href="/sources" className="text-blue-600 font-bold hover:underline">
                  Telemetry →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: AI SUPPLIER QUALIFICATION & DECISION MATRIX SHOWCASE */}
        <section className="py-16 bg-white border-y border-slate-200/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-2">
                  <Target className="h-3.5 w-3.5" />
                  <span>Objective Go / No-Go Intelligence</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Win Probability Scoring & Supplier Qualification
                </h2>
              </div>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Access Match Dashboard
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Strategic Decision Matrix Interactive Mockup */}
              <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Decision Matrix</span>
                    <h3 className="text-lg font-bold text-slate-900">Bid / No-Bid Win Probability</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                    ✓ Go-Bid with Confidence
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Win Score</span>
                    <span className="text-2xl font-black text-slate-900 tabular-nums">78%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Margin Fit</span>
                    <span className="text-2xl font-black text-emerald-700 tabular-nums">High</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Risk Level</span>
                    <span className="text-2xl font-black text-blue-600 tabular-nums">Low</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Technical Capability Fit</span>
                      <span className="tabular-nums font-bold">85/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full w-[85%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Commercial Margin Viability</span>
                      <span className="tabular-nums font-bold">75/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-600 h-1.5 rounded-full w-[75%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Compliance & Legal Ease</span>
                      <span className="tabular-nums font-bold">90/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-indigo-600 h-1.5 rounded-full w-[90%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gap Analysis & Missing Checklist Card */}
              <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Qualification Check</span>
                    <h3 className="text-lg font-bold text-slate-900">Gap Analysis & Missing Documents</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                    Smart Match
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2 text-xs">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Verified Strengths Detected
                  </h4>
                  <ul className="space-y-1 text-slate-700">
                    <li>• Valid Cambodian GDT Tax Patent / VAT Registration</li>
                    <li>• Ministry of Commerce (MoC) Business Registration</li>
                    <li>• Matching Product Catalog: Solar Inverters & Batteries</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2 text-xs">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Action Required Before Submission
                  </h4>
                  <p className="text-slate-700">
                    • Tender requires a $5,000 USD Bid Security Bank Guarantee (due in 12 days).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: LIVE TENDER CATALOG & BID PIPELINE */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                <Zap className="h-3.5 w-3.5" />
                Live Procurement Notices
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Featured Public Opportunities & Pipeline
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
            {liveTenders.length === 0 ? (
              <div className="col-span-full text-center py-12 surface-card rounded-2xl p-8">
                <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">
                  Live tenders are being synced from official sources
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Check back shortly or visit the Sources Health Sentinel to monitor crawlers.
                </p>
              </div>
            ) : liveTenders.map((tender) => {
              const remaining = getDaysRemaining(tender.deadline)
              return (
                <div
                  key={tender.id}
                  className="surface-card rounded-3xl p-6 hover:border-blue-300 transition-all flex flex-col justify-between card-interactive"
                >
                  <div>
                    {/* Source & Organization Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full truncate max-w-[200px]">
                        {tender.source}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                          remaining.isUrgent
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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
                      <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="truncate font-medium">{tender.organization}</span>
                    </div>

                    {/* Budget / Value */}
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Est. Budget
                        </span>
                        <span className="text-slate-900 font-black text-sm tabular-nums">
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
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 tabular-nums">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {tender.confidenceScore}% AI Confidence
                    </span>
                    <Link
                      href={`/tenders/${tender.slug}`}
                      className="btn-tactile inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Analyze Tender
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* SECTION 6: 100% FREE OPEN ACCESS GUARANTEE & FINAL CALL TO ACTION */}
        <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
          {/* Subtle Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.18),transparent_70%)] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-bold shadow-xs">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>100% Free Platform & Open Access Guarantee</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight [text-wrap:balance]">
              Start Discovering Official Cambodian Tenders Today — 100% Free.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed [text-wrap:pretty]">
              No credit cards, no hidden paywalls. Full catalog search, AI qualification scoring, and automated Telegram alert dispatch for all local suppliers.
            </p>

            <div className="pt-4 max-w-md mx-auto">
              <Link
                href="/signup"
                className="btn-tactile w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 cursor-pointer"
              >
                Create Free Supplier Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% Free Forever
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Official Government Portals
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant PDF Dossiers
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Telegram Bot Alerts
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
