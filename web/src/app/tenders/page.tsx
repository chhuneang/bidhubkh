import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { publicTenders } from '@/lib/tenders'
import {
  Search,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  ExternalLink,
  MapPin,
  FileText,
  Filter,
  X
} from 'lucide-react'

export const metadata = {
  title: 'Cambodian Tender Catalog & Procurement Search — BidHubKH',
  description: 'Search official Cambodian public tenders from Government Ministries, World Bank, Asian Development Bank, UN, and NGOs.',
}

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; source?: string }>
}) {
  const params = await searchParams
  const query = (params.q || '').toLowerCase()
  const categoryFilter = params.category || ''
  const sourceFilter = params.source || ''

  let tenders: any[] = []

  // Attempt live Supabase query
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()

      let dbQuery = publicTenders(supabase)
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
      // Graceful fallback to empty
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

  const hasActiveFilters = Boolean(query || categoryFilter || sourceFilter)

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white">
      <Header />

      <main id="main-content" className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Title & Search Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Cambodian Tender Catalog
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Aggregating <span className="font-bold text-slate-900 tabular-nums">{filteredTenders.length}</span> official opportunities from 8 verified procurement sources
              </p>
            </div>

            {/* In-page search bar */}
            <form
              action="/tenders"
              method="GET"
              className="flex items-center gap-2 rounded-2xl bg-white border-2 border-slate-200 p-1.5 w-full md:w-88 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
            >
              <Search className="h-4 w-4 text-blue-600 shrink-0 ml-2" />
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Search keyword, ministry, ref no..."
                className="bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium px-1"
              />
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {sourceFilter && <input type="hidden" name="source" value={sourceFilter} />}
              <button
                type="submit"
                className="btn-tactile bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Source Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-200/90 pb-3">
            <span className="text-[11px] uppercase font-bold text-slate-400 mr-2 tracking-wider">Source:</span>
            <Link
              href={`/tenders${categoryFilter ? `?category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                !sourceFilter
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              All 8 Sources
            </Link>
            <Link
              href={`/tenders?source=world_bank_kh${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'world_bank_kh'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              World Bank
            </Link>
            <Link
              href={`/tenders?source=adb_kh${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'adb_kh'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              ADB Cambodia
            </Link>
            <Link
              href={`/tenders?source=mef_gdipp${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'mef_gdipp'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              Gov Ministries (MEF)
            </Link>
            <Link
              href={`/tenders?source=ungm${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'ungm'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              UNGM (United Nations)
            </Link>
            <Link
              href={`/tenders?source=jica_kh${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'jica_kh'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              JICA Japan
            </Link>
            <Link
              href={`/tenders?source=afd_eu_kh${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'afd_eu_kh'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              AFD / EU France
            </Link>
            <Link
              href={`/tenders?source=ngo_cambodia${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'ngo_cambodia'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              NGO Portals
            </Link>
            <Link
              href={`/tenders?source=state_utilities${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-full transition-all ${
                sourceFilter === 'state_utilities'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              State Utilities (EDC / PPWSA)
            </Link>
          </div>

          {/* Sector Category Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pb-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 mr-2 tracking-wider">Sector:</span>
            <Link
              href={`/tenders${sourceFilter ? `?source=${sourceFilter}` : ''}`}
              className={`btn-tactile text-xs px-3 py-1.5 rounded-full transition-all ${
                !categoryFilter
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              All Sectors
            </Link>
            <Link
              href={`/tenders?category=it-telecom${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`btn-tactile text-xs px-3 py-1.5 rounded-full transition-all ${
                categoryFilter === 'it-telecom'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              IT & Telecom
            </Link>
            <Link
              href={`/tenders?category=construction-civil${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`btn-tactile text-xs px-3 py-1.5 rounded-full transition-all ${
                categoryFilter === 'construction-civil'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              Construction & Civil
            </Link>
            <Link
              href={`/tenders?category=medical-healthcare${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`btn-tactile text-xs px-3 py-1.5 rounded-full transition-all ${
                categoryFilter === 'medical-healthcare'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              Medical & Health
            </Link>
            <Link
              href={`/tenders?category=electrical-energy${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`btn-tactile text-xs px-3 py-1.5 rounded-full transition-all ${
                categoryFilter === 'electrical-energy'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              Energy & Solar
            </Link>
            <Link
              href={`/tenders?category=agriculture-water${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`btn-tactile text-xs px-3 py-1.5 rounded-full transition-all ${
                categoryFilter === 'agriculture-water'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              Water & Infrastructure
            </Link>
            <Link
              href={`/tenders?category=consulting-services${sourceFilter ? `&source=${sourceFilter}` : ''}`}
              className={`btn-tactile text-xs px-3 py-1.5 rounded-full transition-all ${
                categoryFilter === 'consulting-services'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs font-medium'
              }`}
            >
              Consulting & Advisory
            </Link>

            {hasActiveFilters && (
              <Link
                href="/tenders"
                className="btn-tactile inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold ml-auto"
              >
                <X className="h-3 w-3" />
                Reset Filters
              </Link>
            )}
          </div>
        </div>

        {/* Tenders Listing */}
        <div className="space-y-4">
          {filteredTenders.length === 0 ? (
            <div className="surface-card rounded-2xl p-12 text-center">
              <Search className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No matching tenders found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                Try refining your keyword search or adjusting the selected sector and portal filters.
              </p>
              <Link
                href="/tenders"
                className="btn-tactile mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700"
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
                  className="surface-card rounded-2xl p-6 hover:border-blue-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-interactive"
                >
                  <div className="space-y-2.5 flex-1">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        {tender.source?.name || 'Public Source'}
                      </span>
                      {tender.reference_number && (
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
                          Ref: {tender.reference_number}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                        {tender.category?.name_en || 'General Procurement'}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug">
                      <Link href={`/tenders/${tender.slug}`}>{tender.title}</Link>
                    </h2>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {tender.organization?.name_en || 'Cambodian Agency'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {tender.location || 'Cambodia'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium tabular-nums">
                        Published: {formatDate(tender.published_at)}
                      </span>
                    </div>
                  </div>

                  {/* Budget & Deadline side box */}
                  <div className="w-full md:w-auto md:min-w-[220px] flex md:flex-col justify-between md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-3">
                    <div className="md:text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Estimated Budget
                      </span>
                      <span className="font-black text-slate-900 text-lg tabular-nums">
                        {formatCurrency(tender.estimated_value, tender.currency)}
                      </span>
                    </div>

                    <div className="flex flex-col md:items-end">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full tabular-nums ${
                          remaining.isUrgent
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {remaining.text}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 font-medium tabular-nums">
                        Due: {formatDate(tender.deadline)}
                      </span>
                    </div>

                    <Link
                      href={`/tenders/${tender.slug}`}
                      className="btn-tactile hidden md:inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-1"
                    >
                      View Analysis <ArrowRight className="h-3.5 w-3.5" />
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
