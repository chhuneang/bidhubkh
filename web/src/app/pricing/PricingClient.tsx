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
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          Cambodia&apos;s #1 Tender Intelligence Platform
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Win More Public Tenders with <br className="hidden sm:inline" />
          <span className="text-blue-600">
            AI-Powered Intelligence
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Choose the right plan to unlock unlimited AI tender analysis, instant Telegram alert notifications, and win probability scoring.
        </p>

        {/* Currency Switcher */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('KHR')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currency === 'KHR'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>KHR (៛)</span>
              <span className="text-[9px] bg-white/30 px-1.5 py-0.2 rounded-md font-bold text-white">
                Bakong
              </span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-md mx-auto p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center font-medium">
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
                  ? 'bg-white border-2 border-blue-600 shadow-xl scale-105 z-10'
                  : 'bg-white border border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    {price}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-4 border-t border-slate-100">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{feat}</span>
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
                      ? 'border border-slate-200 bg-slate-100 text-slate-500 cursor-default'
                      : isPro
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
                      : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900'
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
      <div className="max-w-4xl mx-auto pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <QrCode className="h-4 w-4 text-rose-600" />
            Instant Bakong KHQR
          </div>
          <p className="text-xs text-slate-500">
            Pay seamlessly using ABA PAY, ACLEDA mobile, Wing, or any Bakong-enabled Cambodian banking app.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Tax & GDT Invoicing
          </div>
          <p className="text-xs text-slate-500">
            Automatic monthly tax-compliant corporate e-invoices with VAT numbers available for enterprise accounting.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Zap className="h-4 w-4 text-blue-600" />
            Zero Commitment
          </div>
          <p className="text-xs text-slate-500">
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
