import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import {
  Search,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  ExternalLink
} from 'lucide-react'

// Fallback seed tenders if database is offline or empty
const FALLBACK_TENDERS = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    slug: 'procurement-of-450-high-performance-laptops-and-it-infrastructure-wb-kh-2026-0891',
    reference_number: 'WB/GDIPP/G/2026/014',
    title: 'Procurement of 450 High-Performance Laptops and IT Infrastructure for Digital Education Project',
    organization: { name_en: 'World Bank Cambodia / MoEYS' },
    category: { slug: 'it-telecom', name_en: 'IT, Computers & Telecom' },
    source: { name: 'World Bank Cambodia' },
    deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_value: 285000,
    currency: 'USD',
    location: 'Phnom Penh & 12 Provinces',
    confidence_score: 98,
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    slug: 'rehabilitation-and-asphalt-concrete-paving-rural-roads-kampong-cham-adb-cam-48218',
    reference_number: 'ADB/MRD/CW-02-2026',
    title: 'Rehabilitation and Asphalt Concrete Paving of 38.5 km Rural Connectivity Roads in Kampong Cham',
    organization: { name_en: 'Asian Development Bank / Ministry of Rural Development' },
    category: { slug: 'construction-civil', name_en: 'Construction & Civil Works' },
    source: { name: 'ADB Cambodia' },
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_value: 1450000,
    currency: 'USD',
    location: 'Kampong Cham Province',
    confidence_score: 95,
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    slug: 'supply-and-installation-diagnostic-ultrasound-scanners-icu-monitors-moh-2026',
    reference_number: 'MOH/HSSP2/G/2026/08',
    title: 'Supply and Installation of Digital Diagnostic Ultrasound Scanners and Hospital ICU Monitors',
    organization: { name_en: 'Ministry of Health (MoH)' },
    category: { slug: 'medical-healthcare', name_en: 'Medical & Healthcare' },
    source: { name: 'GDIPP / MEF' },
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_value: 420000,
    currency: 'USD',
    location: 'Siem Reap & Battambang',
    confidence_score: 96,
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    slug: 'consulting-services-national-public-cloud-security-framework-mptc-2026',
    reference_number: 'MPTC/CS/2026/003',
    title: 'Consulting Services for Development of National Public Cloud Security Framework & Compliance Standards',
    organization: { name_en: 'Ministry of Post and Telecommunications (MPTC)' },
    category: { slug: 'consulting-services', name_en: 'Consulting & Professional Services' },
    source: { name: 'World Bank Cambodia' },
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_value: 95000,
    currency: 'USD',
    location: 'Phnom Penh',
    confidence_score: 92,
  }
]

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; source?: string }>
}) {
  const params = await searchParams
  const query = (params.q || '').toLowerCase()
  const categoryFilter = params.category || ''
  const sourceFilter = params.source || ''

  let tenders = FALLBACK_TENDERS
  let sourcesList: any[] = []
  let categoriesList: any[] = []

  // Attempt live Supabase query if credentials are set
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()

      // Fetch active sources for filter chips
      const { data: dbSources } = await supabase
        .from('sources')
        .select('code, name')
        .eq('active', true)
        .order('name', { ascending: true })
      if (dbSources) sourcesList = dbSources

      // Fetch categories
      const { data: dbCats } = await supabase
        .from('categories')
        .select('slug, name_en')
        .order('sort_order', { ascending: true })
      if (dbCats) categoriesList = dbCats

      let dbQuery = supabase
        .from('tenders')
        .select(`
          id,
          slug,
          reference_number,
          title,
          deadline,
          published_at,
          estimated_value,
          currency,
          location,
          confidence_score,
          organizations (name_en),
          categories (slug, name_en),
          sources (code, name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (query) {
        dbQuery = dbQuery.ilike('title', `%${query}%`)
      }

      const { data, error } = await dbQuery
      if (!error && data && data.length > 0) {
        tenders = data.map((t: any) => ({
          ...t,
          organization: t.organizations,
          category: t.categories,
          source: t.sources,
        }))
      }
    } catch {
      // Graceful fallback to static data
    }
  }

  // Filter client-side
  const filteredTenders = tenders.filter((tender) => {
    const matchesQuery =
      !query ||
      tender.title.toLowerCase().includes(query) ||
      (tender.organization?.name_en || '').toLowerCase().includes(query) ||
      (tender.reference_number || '').toLowerCase().includes(query)

    const matchesCategory =
      !categoryFilter || tender.category?.slug === categoryFilter

    const matchesSource =
      !sourceFilter || (tender.source as any)?.code === sourceFilter

    return matchesQuery && matchesCategory && matchesSource
  })

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header />

      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Title & Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Cambodian Tender Catalog
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Aggregating {filteredTenders.length} official opportunities from 6 verified procurement sources
              </p>
            </div>

            {/* In-page search bar */}
            <form
              action="/tenders"
              method="GET"
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 w-full md:w-80 shadow-sm focus-within:border-blue-500 transition-colors"
            >
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Search keywords, ministry..."
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
              />
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {sourceFilter && <input type="hidden" name="source" value={sourceFilter} />}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Sources Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
            <span className="text-[11px] uppercase font-bold text-slate-500 mr-2 tracking-wider">Source:</span>
            <Link
              href={`/tenders${categoryFilter ? `?category=${categoryFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                !sourceFilter
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All 6 Sources
            </Link>
            <Link
              href={`/tenders?source=world_bank_kh${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                sourceFilter === 'world_bank_kh'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              World Bank
            </Link>
            <Link
              href={`/tenders?source=adb_kh${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                sourceFilter === 'adb_kh'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ADB Cambodia
            </Link>
            <Link
              href={`/tenders?source=mef_gdipp${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                sourceFilter === 'mef_gdipp'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Cambodian Gov (MEF)
            </Link>
            <Link
              href={`/tenders?source=ungm${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                sourceFilter === 'ungm'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              UNGM (United Nations)
            </Link>
            <Link
              href={`/tenders?source=ngo_cambodia${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                sourceFilter === 'ngo_cambodia'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              NGO Portals
            </Link>
            <Link
              href={`/tenders?source=state_utilities${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                sourceFilter === 'state_utilities'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              State Utilities (EDC / PPWSA)
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pb-2">
            <span className="text-[11px] uppercase font-bold text-slate-500 mr-2 tracking-wider">Sector:</span>
            <Link
              href={`/tenders${sourceFilter ? `?source=${sourceFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                !categoryFilter
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Sectors
            </Link>
            <Link
              href={`/tenders?category=it-telecom${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'it-telecom'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              IT & Telecom
            </Link>
            <Link
              href={`/tenders?category=construction-civil${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'construction-civil'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Construction & Civil
            </Link>
            <Link
              href={`/tenders?category=medical-healthcare${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'medical-healthcare'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Medical & Health
            </Link>
            <Link
              href={`/tenders?category=electrical-energy${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'electrical-energy'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Energy & Solar
            </Link>
            <Link
              href={`/tenders?category=agriculture-water${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'agriculture-water'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Water & Infrastructure
            </Link>
            <Link
              href={`/tenders?category=consulting-services${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'consulting-services'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Consulting & Services
            </Link>
          </div>
        </div>

        {/* Tenders Listing */}
        <div className="space-y-4">
          {filteredTenders.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
              <Search className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No matching tenders found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching for a different keyword or category.
              </p>
              <Link
                href="/tenders"
                className="mt-4 inline-block text-xs font-semibold text-blue-400 hover:underline"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            filteredTenders.map((tender) => {
              const remaining = getDaysRemaining(tender.deadline)
              return (
                <div
                  key={tender.id}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2.5 flex-1">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                        {tender.source?.name || 'Public Source'}
                      </span>
                      {tender.reference_number && (
                        <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
                          Ref: {tender.reference_number}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
                        {tender.category?.name_en || 'General Procurement'}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                      <Link href={`/tenders/${tender.slug}`}>{tender.title}</Link>
                    </h2>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        {tender.organization?.name_en || 'Cambodian Agency'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>Location: {tender.location || 'Cambodia'}</span>
                      <span className="text-slate-600">•</span>
                      <span>Published: {formatDate(tender.published_at)}</span>
                    </div>
                  </div>

                  {/* Budget & Deadline side box */}
                  <div className="w-full md:w-auto md:min-w-[200px] flex md:flex-col justify-between md:items-end border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 gap-3">
                    <div className="md:text-right">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
                        Estimated Budget
                      </span>
                      <span className="font-bold text-emerald-400 text-lg">
                        {formatCurrency(tender.estimated_value, tender.currency)}
                      </span>
                    </div>

                    <div className="flex flex-col md:items-end">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          remaining.isUrgent
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {remaining.text}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Due: {formatDate(tender.deadline)}
                      </span>
                    </div>

                    <Link
                      href={`/tenders/${tender.slug}`}
                      className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 mt-1"
                    >
                      View Details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
