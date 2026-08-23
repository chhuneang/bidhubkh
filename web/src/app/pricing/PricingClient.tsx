'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KHQRResult } from '@/lib/bakong'
import { createBakongPayment } from '@/app/actions/billing'
import { BakongCheckoutModal } from '@/components/billing/BakongCheckoutModal'
import {
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  QrCode,
  Building2,
  Lock
} from 'lucide-react'

interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price_usd: number
  price_khr: number
  features: string[]
  is_popular: boolean
}

interface PricingClientProps {
  plans: Plan[]
  currentPlanSlug: string
  isLoggedIn: boolean
}

export function PricingClient({ plans, currentPlanSlug, isLoggedIn }: PricingClientProps) {
  const router = useRouter()
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD')
  const [activeKHQR, setActiveKHQR] = useState<{ khqr: KHQRResult; planName: string } | null>(null)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSelectPlan = async (plan: Plan) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/pricing`)
      return
    }

    if (plan.slug === 'free' || plan.slug === currentPlanSlug) {
      return
    }

    setLoadingSlug(plan.slug)
    setErrorMsg(null)

    try {
      const res = await createBakongPayment(plan.slug, currency)
      if (res.success && res.khqr) {
        setActiveKHQR({ khqr: res.khqr, planName: plan.name })
      } else {
        setErrorMsg(res.error || 'Could not initiate checkout')
      }
    } catch {
      setErrorMsg('Failed to start checkout. Please try again.')
    } finally {
      setLoadingSlug(null)
    }
  }

  const handlePaymentSuccess = (planName: string) => {
    setActiveKHQR(null)
    router.refresh()
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          Cambodia&apos;s #1 Tender Intelligence Platform
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Win More Public Tenders with <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            AI-Powered Intelligence
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Choose the right plan to unlock unlimited AI tender analysis, instant Telegram alert notifications, and win probability scoring.
        </p>

        {/* Currency Switcher */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('KHR')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currency === 'KHR'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>KHR (៛)</span>
              <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-md font-semibold">
                Bakong
              </span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-md mx-auto p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-center">
          {errorMsg}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = currentPlanSlug === plan.slug
          const price = currency === 'USD' ? `$${plan.price_usd}` : `${plan.price_khr.toLocaleString()} ៛`
          const isPro = plan.is_popular

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                isPro
                  ? 'glass-panel border-2 border-blue-500/50 bg-gradient-to-b from-blue-950/30 to-slate-950/80 shadow-2xl shadow-blue-500/10 scale-105 z-10'
                  : 'glass-panel border border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">
                    {price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-4 border-t border-slate-800/80">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || loadingSlug === plan.slug}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'border border-slate-700 bg-slate-900 text-slate-400 cursor-default'
                      : isPro
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-cyan-400'
                      : 'border border-slate-800 bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCurrent ? (
                    'Current Active Plan'
                  ) : loadingSlug === plan.slug ? (
                    'Generating KHQR...'
                  ) : plan.slug === 'free' ? (
                    'Get Started Free'
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      <span>Pay with Bakong KHQR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust & FAQ Section */}
      <div className="max-w-4xl mx-auto pt-10 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <QrCode className="h-4 w-4 text-rose-500" />
            Instant Bakong KHQR
          </div>
          <p className="text-xs text-slate-400">
            Pay seamlessly using ABA PAY, ACLEDA mobile, Wing, or any Bakong-enabled Cambodian banking app.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Tax & GDT Invoicing
          </div>
          <p className="text-xs text-slate-400">
            Automatic monthly tax-compliant corporate e-invoices with VAT numbers available for enterprise accounting.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Zap className="h-4 w-4 text-amber-400" />
            Zero Commitment
          </div>
          <p className="text-xs text-slate-400">
            Upgrade, downgrade, or cancel your subscription at any time without penalty or cancellation fees.
          </p>
        </div>
      </div>

      {/* Active Bakong Checkout Modal */}
      {activeKHQR && (
        <BakongCheckoutModal
          khqr={activeKHQR.khqr}
          planName={activeKHQR.planName}
          onClose={() => setActiveKHQR(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
