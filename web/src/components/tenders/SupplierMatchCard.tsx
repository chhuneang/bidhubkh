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
      <div className="rounded-2xl p-6 border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 backdrop-blur-md relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                AI Supplier Qualification Match
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                Beta
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Want to see how your company qualifies for this tender?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in or create a supplier account to get an automated qualification match score, compliance check, and missing gap analysis.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
              >
                Sign In to Match
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/signup"
                className="text-xs font-semibold text-slate-300 hover:text-white"
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
    <div className="rounded-2xl p-6 sm:p-7 border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                AI Supplier Match & Gap Analysis
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                for {company?.name || 'Your Company'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Qualification Compatibility Assessment
            </h3>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-white leading-none">
              {matchResult.score}%
            </span>
            <span className="text-[10px] block text-slate-400 font-medium">
              Match Score
            </span>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold border ${matchResult.badgeColor}`}
          >
            {matchResult.tier}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 ${
            matchResult.score >= 80
              ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
              : matchResult.score >= 60
              ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
              : 'bg-gradient-to-r from-amber-500 to-rose-500'
          }`}
          style={{ width: `${matchResult.score}%` }}
        />
      </div>

      {/* AI Summary */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
        {matchResult.summary}
      </p>

      {/* Grid: Matched vs Missing Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Passed Qualifications */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Verified Company Strengths ({matchResult.passedRequirements.length + matchResult.matchedProducts.length})
          </span>
          <ul className="space-y-1.5">
            {matchResult.passedRequirements.map((req, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{req}</span>
              </li>
            ))}
            {matchResult.matchedProducts.map((prod, idx) => (
              <li key={`p-${idx}`} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Catalog Match: {prod}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Requirements / Gap Analysis */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Gap Analysis & Missing Documents ({matchResult.missingRequirements.length > 0 ? matchResult.missingRequirements.length : 1})
          </span>
          <ul className="space-y-1.5">
            {matchResult.missingRequirements.length > 0 ? (
              matchResult.missingRequirements.map((gap, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>{gap}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-blue-400 font-bold">ℹ</span>
                <span>Standard OEM manufacturer warranty certificate required at bid submission.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Action Recommendation */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
        <div>
          <span className="font-semibold block text-indigo-200">Recommended Next Step:</span>
          <span>{matchResult.actionAdvice}</span>
        </div>
      </div>
    </div>
  )
}
