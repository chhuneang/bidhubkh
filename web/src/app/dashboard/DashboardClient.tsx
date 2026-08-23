'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import {
  updateSavedTenderStatus,
  deleteSavedTender,
  updateCompanyProfile,
  createAlertRule,
  deleteAlertRule
} from '@/app/actions/dashboard'
import { logout } from '@/app/actions/auth'
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
  LogOut,
  Save,
  CheckCircle2,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react'

interface DashboardClientProps {
  user: any
  company: any
  savedTenders: any[]
  alerts: any[]
  categories: any[]
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
  categories
}: DashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'company' | 'alerts'>('pipeline')
  const [stageFilter, setStageFilter] = useState('all')
  const [isPending, startTransition] = useTransition()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [alertModalOpen, setAlertModalOpen] = useState(false)

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
    if (confirm('Remove this tender from your bid pipeline?')) {
      startTransition(async () => {
        await deleteSavedTender(savedId)
        router.refresh()
      })
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateCompanyProfile(formData)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
      router.refresh()
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
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" />
            Supplier Intelligence Center
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {initialCompany?.name || 'My Supplier Dashboard'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Account: {user.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Explore New Tenders
          </Link>

          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tracked Bids</span>
            <FolderKanban className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{savedTenders.length}</div>
          <div className="text-[11px] text-blue-400 mt-1">In active bid pipeline</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Pipeline Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(totalPipelineValue, 'USD')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total contract value target</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Alerts</span>
            <Bell className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{alerts.length} Rules</div>
          <div className="text-[11px] text-amber-400 mt-1">Email & Telegram triggers</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>AI Match Readiness</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-2">
            {initialCompany?.tax_id ? '95%' : '60%'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {initialCompany?.tax_id ? 'Profile fully configured' : 'Add GDT Tax ID to boost score'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pipeline'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          Bid Pipeline ({savedTenders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'company'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Company Profile & Catalog
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="h-4 w-4" />
          Tender Alerts ({alerts.length})
        </button>
      </div>

      {/* TAB 1: SAVED BIDS PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Stage filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStageFilter(s.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
                  stageFilter === s.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
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
                    className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                          {tender?.sources?.name || 'Verified Source'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              remaining.isUrgent
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {remaining.text}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/tenders/${tender?.slug}`}
                        className="font-bold text-white text-sm line-clamp-2 group-hover:text-blue-400 transition-colors"
                      >
                        {tender?.title}
                      </Link>

                      <div className="mt-3 text-xs text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Budget:</span>
                          <span className="font-semibold text-emerald-400">
                            {formatCurrency(tender?.estimated_value, tender?.currency)}
                          </span>
                        </div>
                        {tender?.reference_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Ref:</span>
                            <span className="font-mono text-[10px] truncate max-w-[160px]">
                              {tender.reference_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
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
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
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
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-4">
              <Bookmark className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">No tenders in this stage</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore Cambodia&apos;s government and development bank tenders and click &quot;Save to Bid Pipeline&quot;.
              </p>
              <Link
                href="/tenders"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
              >
                Browse Tender Catalog
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPANY PROFILE & CATALOG */}
      {activeTab === 'company' && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 max-w-3xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Company Profile & Matching Data</h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide your official business credentials to enable automatic AI qualification matching against government tenders.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Company profile updated successfully!
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Legal Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={initialCompany?.name || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">GDT Tax ID Number (VAT / TIN)</label>
                <input
                  type="text"
                  name="taxId"
                  placeholder="e.g. K008-902348123"
                  defaultValue={initialCompany?.tax_id || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">MoC Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  placeholder="e.g. 00049281/2023"
                  defaultValue={initialCompany?.registration_number || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Industry</label>
                <input
                  type="text"
                  name="industry"
                  defaultValue={initialCompany?.industry || 'IT, Computers & Telecom'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Operating Location</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={initialCompany?.location || 'Phnom Penh, Cambodia'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+855 12 345 678"
                  defaultValue={initialCompany?.phone || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Website</label>
              <input
                type="url"
                name="website"
                placeholder="https://yourcompany.com.kh"
                defaultValue={initialCompany?.website || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Overview & Core Offerings</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={initialCompany?.description || ''}
                placeholder="Describe your company's core products, equipment inventory, and certifications..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              {isPending ? 'Saving...' : 'Save Company Profile'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ALERT RULES */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Tender Notification Triggers</h2>
              <p className="text-xs text-slate-400 mt-1">
                Receive instant email notifications whenever matching government or donor opportunities appear.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAlertModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Alert Rule
            </button>
          </div>

          {alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((rule) => (
                <div key={rule.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{rule.name}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  {rule.keywords && rule.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rule.keywords.map((k: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Email: Daily digest</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(rule.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-4">
              <Bell className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">No alert rules active</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Set up keyword and category rules to get notified when new bids match your business.
              </p>
              <button
                type="button"
                onClick={() => setAlertModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Alert Rule
              </button>
            </div>
          )}

          {/* Modal to create alert */}
          {alertModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 max-w-md w-full space-y-4 bg-slate-950">
                <h3 className="text-base font-bold text-white">Create New Tender Alert</h3>
                <form onSubmit={handleCreateAlert} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Alert Rule Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. IT Laptops & Networking Bids"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      name="keywords"
                      placeholder="laptop, server, network, workstation"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAlertModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500"
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
