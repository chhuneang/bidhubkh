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
  QrCode
} from 'lucide-react'

interface DashboardClientProps {
  user: any
  company: any
  savedTenders: any[]
  alerts: any[]
  categories: any[]
  recommendedTenders?: any[]
}

const STAGES = [
  { key: 'all', label: 'All Tracked Bids' },
  { key: 'interested', label: 'Interested' },
  { key: 'reviewing', label: 'Reviewing Specs' },
  { key: 'preparing_bid', label: 'Preparing Bid' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'won', label: 'Won 🎉' },
  { key: 'lost', label: 'Lost' },
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
  const [activeTab, setActiveTab] = useState<'pipeline' | 'matches' | 'company' | 'alerts' | 'billing'>('pipeline')
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
      if (res.success) {
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

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" />
            Supplier Intelligence Center
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {initialCompany?.name || 'My Supplier Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Account: {user.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Explore New Tenders
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tracked Bids</span>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{savedTenders.length}</div>
          <div className="text-[11px] text-blue-600 mt-1 font-semibold">In active bid pipeline</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pipeline Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(totalPipelineValue, 'USD')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total contract value target</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Top AI Match</span>
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">
            {matchedOpportunities.length > 0 ? `${matchedOpportunities[0].match.score}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Highest qualification fit</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Company Tax Status</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {initialCompany?.tax_id ? 'Verified' : 'Pending'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {initialCompany?.tax_id ? initialCompany.tax_id : 'Add GDT Tax ID to qualify'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'pipeline'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          Bid Pipeline ({savedTenders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'matches'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-4 w-4 text-blue-600" />
          AI Matched Opportunities ({matchedOpportunities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'company'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Company Profile & Catalog
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="h-4 w-4" />
          Tender Alerts ({alerts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'billing'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="text-blue-600 font-bold">$</span>
          Plan & Bakong Billing
        </button>
      </div>

      {/* TAB 1: SAVED BIDS PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStageFilter(s.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  stageFilter === s.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filteredBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBids.map((item) => {
                const tender = item.tenders
                const remaining = getDaysRemaining(tender?.deadline)

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          {tender?.sources?.name || 'Verified Source'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              remaining.isUrgent
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {remaining.text}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/tenders/${tender?.slug}`}
                        className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors"
                      >
                        {tender?.title}
                      </Link>

                      <div className="mt-3 text-xs text-slate-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-medium">Budget:</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(tender?.estimated_value, tender?.currency)}
                          </span>
                        </div>
                        {tender?.reference_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px] font-medium">Ref:</span>
                            <span className="font-mono text-[10px] truncate max-w-[160px] text-slate-600">
                              {tender.reference_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 font-medium"
                      >
                        <option value="interested">Interested</option>
                        <option value="reviewing">Reviewing Specs</option>
                        <option value="preparing_bid">Preparing Bid</option>
                        <option value="submitted">Submitted</option>
                        <option value="won">Won 🎉</option>
                        <option value="lost">Lost</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteBid(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove from pipeline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
              <Bookmark className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No tenders in this stage</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore Cambodia&apos;s government and development bank tenders and click &quot;Save to Bid Pipeline&quot;.
              </p>
              <Link
                href="/tenders"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-xs"
              >
                Browse Tender Catalog
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
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Opportunities Ranked by Qualification Match
              </h2>
              <p className="text-xs text-slate-500 mt-1">
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
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
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
                      className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors line-clamp-2"
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
                      Fit: <strong className="text-slate-900">{tender.match.tier}</strong>
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
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-3xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Company Profile & Matching Data</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide your official business credentials to enable automatic AI qualification matching against government tenders.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-4 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">GDT Tax ID Number (VAT / TIN)</label>
                <input
                  type="text"
                  name="taxId"
                  placeholder="e.g. K008-902348123"
                  defaultValue={initialCompany?.tax_id || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Industry</label>
                <input
                  type="text"
                  name="industry"
                  defaultValue={initialCompany?.industry || 'IT, Computers & Telecom'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+855 12 345 678"
                  defaultValue={initialCompany?.phone || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Core Product Offerings & Keywords</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={initialCompany?.description || 'Laptops, server hardware, networking cables, uninterruptible power supply (UPS), technical support, CCTV surveillance, road civil works, medical hospital equipment'}
                placeholder="List your products and services separated by commas to match tender requirements..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                The AI Match Engine uses these keywords to calculate match percentages against incoming tender line items.
              </span>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
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
              <h2 className="text-lg font-bold text-slate-900">Tender Notification Triggers</h2>
              <p className="text-xs text-slate-500 mt-1">
                Receive instant email notifications whenever matching government or donor opportunities appear.
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
                <div key={rule.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                      Active
                    </span>
                  </div>

                  {rule.keywords && rule.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rule.keywords.map((k: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>Email Digest</span>
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
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
              <Bell className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No alert rules active</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
              <div className="rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 bg-white shadow-2xl">
                <h3 className="text-base font-bold text-slate-900">Create New Tender Alert</h3>
                <form onSubmit={handleCreateAlert} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alert Rule Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. IT Laptops & Networking Bids"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      name="keywords"
                      placeholder="laptop, server, network, workstation"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
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
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Get your Telegram ID from @userinfobot to receive instant bot notifications.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAlertModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
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

      {/* TAB 5: PLAN & BAKONG BILLING */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-xs shadow-sm">
                  KH
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Active Subscription Plan</h3>
                  <p className="text-xs text-slate-500">
                    Cambodian Bakong KHQR & Corporate Invoicing
                  </p>
                </div>
              </div>

              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-sm shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Change or Upgrade Plan
              </Link>
            </div>

            {/* Current Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">Subscription Tier</span>
                <span className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Pro Supplier
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md font-bold">
                    Active
                  </span>
                </span>
                <p className="text-[11px] text-slate-500">Billed monthly via Bakong KHQR</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">AI Extraction Quota</span>
                <span className="text-lg font-bold text-blue-600">Unlimited</span>
                <p className="text-[11px] text-slate-500">Full BOQ & Win probability models</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">Telegram Alert Channels</span>
                <span className="text-lg font-bold text-blue-600">Up to 10 Rules</span>
                <p className="text-[11px] text-slate-500">Real-time instant bot push alerts</p>
              </div>
            </div>

            {/* Invoicing info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Payment Method: <strong>Bakong KHQR (NBC Standard)</strong></span>
              </div>
              <Link
                href="/pricing"
                className="text-blue-600 hover:text-blue-700 font-bold"
              >
                View Plans →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
