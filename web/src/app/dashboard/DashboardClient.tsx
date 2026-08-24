'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import { calculateSupplierMatch } from '@/lib/matching'
import {
  updateSavedTenderStatus,
  deleteSavedTender,
  updateCompanyProfile,
  createAlertRule,
  deleteAlertRule
} from '@/app/actions/dashboard'
import {
  Building2,
  Bookmark,
  Bell,
  Sparkles,
  TrendingUp,
  FolderKanban,
  ExternalLink,
  Trash2,
  Plus,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  Layers,
  ChevronRight,
  Filter,
  Check,
  AlertTriangle,
  Lightbulb,
  Tag,
  DollarSign,
  Trophy,
  ArrowRight
} from 'lucide-react'
import { StageDropdown } from '@/components/dashboard/StageDropdown'

interface DashboardClientProps {
  user: any
  company: any
  savedTenders: any[]
  alerts: any[]
  categories: any[]
  recommendedTenders?: any[]
}

const STAGES = [
  { key: 'all', label: 'All Tracked Bids', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'interested', label: 'Interested', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'reviewing', label: 'Reviewing Specs', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { key: 'preparing_bid', label: 'Preparing Bid', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'submitted', label: 'Submitted', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { key: 'won', label: 'Won 🎉', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { key: 'lost', label: 'Lost', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' },
]

export function DashboardClient({
  user,
  company: initialCompany,
  savedTenders,
  alerts,
  categories,
  recommendedTenders = []
}: DashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'matches' | 'company' | 'alerts'>('pipeline')
  const [stageFilter, setStageFilter] = useState('all')
  const [isPending, startTransition] = useTransition()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [alertModalOpen, setAlertModalOpen] = useState(false)

  // Rank recommended tenders by AI match score
  const matchedOpportunities = recommendedTenders.map((tender) => {
    const match = calculateSupplierMatch(tender, initialCompany)
    return {
      ...tender,
      match
    }
  }).sort((a, b) => b.match.score - a.match.score)

  // Filtered saved tenders
  const filteredBids = stageFilter === 'all'
    ? savedTenders
    : savedTenders.filter((b) => b.status === stageFilter)

  // Pipeline total value calculation
  const totalPipelineValue = savedTenders.reduce((sum, item) => {
    return sum + (item.tenders?.estimated_value || 0)
  }, 0)

  const wonBidsCount = savedTenders.filter((b) => b.status === 'won').length
  const activeBidsCount = savedTenders.filter((b) => ['interested', 'reviewing', 'preparing_bid', 'submitted'].includes(b.status)).length

  const handleStatusChange = (savedId: string, newStatus: string) => {
    startTransition(async () => {
      await updateSavedTenderStatus(savedId, newStatus)
      router.refresh()
    })
  }

  const handleDeleteBid = (savedId: string) => {
    if (!confirm('Are you sure you want to remove this tender from your pipeline?')) return
    startTransition(async () => {
      await deleteSavedTender(savedId)
      router.refresh()
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateCompanyProfile(formData)
      if (res?.success) {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 3000)
        router.refresh()
      }
    })
  }

  const handleCreateAlert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await createAlertRule(formData)
      setAlertModalOpen(false)
      router.refresh()
    })
  }

  const handleDeleteAlert = (alertId: string) => {
    startTransition(async () => {
      await deleteAlertRule(alertId)
      router.refresh()
    })
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'interested':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'reviewing':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      case 'preparing_bid':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'submitted':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200'
      case 'won':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'lost':
        return 'bg-rose-50 text-rose-800 border-rose-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'interested':
        return 'Interested'
      case 'reviewing':
        return 'Reviewing Specs'
      case 'preparing_bid':
        return 'Preparing Bid'
      case 'submitted':
        return 'Submitted'
      case 'won':
        return 'Won 🎉'
      case 'lost':
        return 'Lost'
      default:
        return status
    }
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-xs">
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
            Supplier Command Center
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {initialCompany?.name || 'My Supplier Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Signed in as: <span className="font-semibold text-slate-700">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Explore New Tenders
          </Link>
        </div>
      </div>

      {/* Metrics Row with High-Contrast Colorful Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tracked Bids</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{savedTenders.length}</div>
          <div className="text-[11px] text-blue-600 mt-1 font-bold">
            {activeBidsCount} actively in progress
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Pipeline Value</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {formatCurrency(totalPipelineValue, 'USD')}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-bold">
            Target contract opportunity
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Top AI Qualification</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-2">
            {matchedOpportunities.length > 0 ? `${matchedOpportunities[0].match.score}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Highest compatibility fit
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tax & Legal Patent</span>
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {initialCompany?.tax_id ? 'Verified' : 'Pending'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium truncate">
            {initialCompany?.tax_id ? initialCompany.tax_id : 'Add GDT Tax ID to qualify'}
          </div>
        </div>
      </div>

      {/* Framed Tabs Navigation matching Header Dock */}
      <div className="p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/90 shadow-inner flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
            activeTab === 'pipeline'
              ? 'bg-white text-blue-600 shadow-xs border border-blue-200 ring-2 ring-blue-500/10 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
          }`}
        >
          <FolderKanban className="h-3.5 w-3.5" />
          <span>Bid Pipeline</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
            {savedTenders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
            activeTab === 'matches'
              ? 'bg-white text-indigo-600 shadow-xs border border-indigo-200 ring-2 ring-indigo-500/10 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Matched Opportunities</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold">
            {matchedOpportunities.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
            activeTab === 'company'
              ? 'bg-white text-blue-600 shadow-xs border border-blue-200 ring-2 ring-blue-500/10 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Company Profile & Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-white text-amber-700 shadow-xs border border-amber-200 ring-2 ring-amber-500/10 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Tender Alerts</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
            {alerts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SAVED BIDS PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Stage Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STAGES.map((s) => {
              const count = s.key === 'all'
                ? savedTenders.length
                : savedTenders.filter((b) => b.status === s.key).length

              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStageFilter(s.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    stageFilter === s.key
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    stageFilter === s.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {filteredBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBids.map((item) => {
                const tender = item.tenders
                const remaining = getDaysRemaining(tender?.deadline)

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all card-interactive group"
                  >
                    <div className="space-y-3">
                      {/* Top Header: Source & Stage Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full truncate max-w-[140px]">
                          {tender?.sources?.name || 'Verified Source'}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadgeStyle(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      {/* Tender Title */}
                      <Link
                        href={`/tenders/${tender?.slug}`}
                        className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug"
                      >
                        {tender?.title}
                      </Link>

                      {/* Budget & Due Date Box */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium text-[11px]">Budget:</span>
                          <span className="font-extrabold text-slate-900">
                            {formatCurrency(tender?.estimated_value, tender?.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium text-[11px]">Deadline:</span>
                          <span className={`font-bold ${remaining.isUrgent ? 'text-amber-700' : 'text-slate-700'}`}>
                            {remaining.text}
                          </span>
                        </div>
                        {tender?.reference_number && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-slate-400 font-mono text-[10px] truncate max-w-[180px]">
                              Ref: {tender.reference_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status Selector & Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <StageDropdown
                          currentStatus={item.status}
                          onChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/tenders/${tender?.slug}`}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                          title="View Tender Intelligence"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteBid(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove from pipeline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                <Bookmark className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No tenders in this stage</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                Explore Cambodia&apos;s government and development bank tenders and click <strong>&quot;Save to Bid Pipeline&quot;</strong> to track deadlines and win rates.
              </p>
              <Link
                href="/tenders"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-xs"
              >
                Browse Tender Catalog <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI MATCHED OPPORTUNITIES */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Opportunities Ranked by AI Qualification Match
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                AI computes compatibility against your company profile, GDT tax patent, and core sector offerings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedOpportunities.map((tender) => {
              const remaining = getDaysRemaining(tender.deadline)
              return (
                <div
                  key={tender.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 card-interactive"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        {tender.sources?.name || 'Verified Source'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          tender.match.score >= 70
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tender.match.score >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {tender.match.score}% Match
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/tenders/${tender.slug}`}
                      className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
                    >
                      {tender.title}
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                      {tender.summary || tender.title}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Budget:</span>
                        <span className="text-slate-900 font-bold">
                          {formatCurrency(tender.estimated_value, tender.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Deadline:</span>
                        <span className={remaining.isUrgent ? 'text-amber-700 font-bold' : 'text-slate-700 font-medium'}>
                          {remaining.text} ({formatDate(tender.deadline)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Fit Tier: <strong className="text-slate-900 font-bold">{tender.match.tier}</strong>
                    </span>
                    <Link
                      href={`/tenders/${tender.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View AI Gap Analysis
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY PROFILE & CATALOG */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Company Profile & Matching Data</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Provide your official business credentials to enable automatic AI qualification matching against government tenders.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Company profile updated successfully!
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Legal Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={initialCompany?.name || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">GDT Tax ID Number (VAT / TIN)</label>
                <input
                  type="text"
                  name="taxId"
                  placeholder="e.g. K008-902348123"
                  defaultValue={initialCompany?.tax_id || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">MoC Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  placeholder="e.g. 00049281/2023"
                  defaultValue={initialCompany?.registration_number || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Industry</label>
                <input
                  type="text"
                  name="industry"
                  defaultValue={initialCompany?.industry || 'IT, Computers & Telecom'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Operating Location</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={initialCompany?.location || 'Phnom Penh, Cambodia'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+855 12 345 678"
                  defaultValue={initialCompany?.phone || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Website</label>
              <input
                type="url"
                name="website"
                placeholder="https://yourcompany.com.kh"
                defaultValue={initialCompany?.website || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Core Product Offerings & Keywords</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={initialCompany?.description || 'Laptops, server hardware, networking cables, uninterruptible power supply (UPS), technical support, CCTV surveillance, road civil works, medical hospital equipment'}
                placeholder="List your products and services separated by commas to match tender requirements..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                The AI Match Engine uses these keywords to calculate match percentages against incoming tender line items.
              </span>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              {isPending ? 'Saving...' : 'Save Company Profile & Catalog'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ALERT RULES */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Tender Notification Triggers</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Receive instant email and Telegram notifications whenever matching government or donor opportunities appear.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAlertModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Alert Rule
            </button>
          </div>

          {alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((rule) => (
                <div key={rule.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 card-interactive">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                      Active
                    </span>
                  </div>

                  {rule.keywords && rule.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rule.keywords.map((k: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Email Digest</span>
                      {rule.telegram_chat_id && (
                        <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                          ✈ Telegram Linked
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(rule.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No alert rules active</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Set up keyword and Telegram rules to get notified when new bids match your business.
              </p>
              <button
                type="button"
                onClick={() => setAlertModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Alert Rule
              </button>
            </div>
          )}

          {/* Modal to create alert */}
          {alertModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="rounded-3xl p-6 sm:p-8 border border-slate-200 max-w-md w-full space-y-4 bg-white shadow-2xl">
                <h3 className="text-base font-bold text-slate-900">Create New Tender Alert</h3>
                <form onSubmit={handleCreateAlert} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alert Rule Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. IT Laptops & Networking Bids"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      name="keywords"
                      placeholder="laptop, server, network, workstation"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telegram Chat ID / Channel (Optional)
                    </label>
                    <input
                      type="text"
                      name="telegramChatId"
                      placeholder="e.g. 123456789 or @mycompany_tenders"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                      Get your Telegram ID from @userinfobot to receive instant bot notifications.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAlertModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                    >
                      {isPending ? 'Saving...' : 'Save Alert Rule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
