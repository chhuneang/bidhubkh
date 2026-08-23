'use client'

import Link from 'next/link'
import { SupplierMatchResult } from '@/lib/matching'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Layers,
  Lightbulb
} from 'lucide-react'

interface SupplierMatchCardProps {
  matchResult: SupplierMatchResult
  company: any | null
  isLoggedIn: boolean
}

export function SupplierMatchCard({ matchResult, company, isLoggedIn }: SupplierMatchCardProps) {
  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl p-6 border border-blue-200 bg-blue-50/60 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                AI Supplier Qualification Match
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                Smart Match
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Want to see how your company qualifies for this tender?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in or create a supplier account to get an automated qualification match score, compliance check, and missing gap analysis.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
              >
                Sign In to Match
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/signup"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Create Supplier Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6 sm:p-7 border border-slate-200 bg-white shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                AI Supplier Match & Gap Analysis
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                for {company?.name || 'Your Company'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Qualification Compatibility Assessment
            </h3>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 leading-none">
              {matchResult.score}%
            </span>
            <span className="text-[10px] block text-slate-500 font-medium">
              Match Score
            </span>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold border ${
              matchResult.score >= 70
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : matchResult.score >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {matchResult.tier}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            matchResult.score >= 80
              ? 'bg-emerald-500'
              : matchResult.score >= 60
              ? 'bg-blue-600'
              : 'bg-amber-500'
          }`}
          style={{ width: `${matchResult.score}%` }}
        />
      </div>

      {/* AI Summary */}
      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        {matchResult.summary}
      </p>

      {/* Grid: Matched vs Missing Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Passed Qualifications */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2.5">
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Verified Company Strengths ({matchResult.passedRequirements.length + matchResult.matchedProducts.length})
          </span>
          <ul className="space-y-1.5">
            {matchResult.passedRequirements.map((req, idx) => (
              <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{req}</span>
              </li>
            ))}
            {matchResult.matchedProducts.map((prod, idx) => (
              <li key={`p-${idx}`} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Catalog Match: {prod}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Requirements / Gap Analysis */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Gap Analysis & Missing Documents ({matchResult.missingRequirements.length > 0 ? matchResult.missingRequirements.length : 1})
          </span>
          <ul className="space-y-1.5">
            {matchResult.missingRequirements.length > 0 ? (
              matchResult.missingRequirements.map((gap, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="text-amber-600 font-bold">!</span>
                  <span>{gap}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-blue-600 font-bold">ℹ</span>
                <span>Standard OEM manufacturer warranty certificate required at bid submission.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Action Recommendation */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
        <div>
          <span className="font-bold block text-blue-900">Recommended Next Step:</span>
          <span className="text-slate-700">{matchResult.actionAdvice}</span>
        </div>
      </div>
    </div>
  )
}
