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
      <div className="rounded-3xl p-6 sm:p-7 border border-blue-200/90 bg-gradient-to-br from-blue-50/90 to-indigo-50/40 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-700">
            <Sparkles className="h-6 w-6" />
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
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Want to see how your company qualifies for this tender?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in or create a supplier account to get an automated qualification match score, compliance check, and missing gap analysis.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
              >
                Sign In to Match
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/signup"
                className="btn-tactile text-xs font-bold text-blue-600 hover:text-blue-700"
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
    <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
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
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Qualification Compatibility Assessment
            </h3>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 leading-none tabular-nums">
              {matchResult.score}%
            </span>
            <span className="text-[10px] block text-slate-500 font-medium">
              Match Score
            </span>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold border ${
              matchResult.tier === 'High Fit'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : matchResult.tier === 'Moderate Fit'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {matchResult.tier}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            matchResult.score >= 70
              ? 'bg-emerald-600'
              : matchResult.score >= 40
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}
          style={{ width: `${matchResult.score}%` }}
        />
      </div>

      {/* Summary Advice */}
      {matchResult.summary && (
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
          {matchResult.summary}
        </p>
      )}

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verified Strengths / Passed Requirements */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Verified Capabilities & Strengths ({matchResult.passedRequirements.length + matchResult.matchedProducts.length})
          </h4>
          {matchResult.passedRequirements.length > 0 || matchResult.matchedProducts.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-700">
              {matchResult.passedRequirements.map((req: string, idx: number) => (
                <li key={`req-${idx}`} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
              {matchResult.matchedProducts.map((prod: string, idx: number) => (
                <li key={`prod-${idx}`} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Product capability match: {prod}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No matching keywords detected in company catalog yet.
            </p>
          )}
        </div>

        {/* Missing Gaps / Requirements */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Missing Documents & Gaps ({matchResult.missingRequirements.length + matchResult.unmatchedProducts.length})
          </h4>
          {matchResult.missingRequirements.length > 0 || matchResult.unmatchedProducts.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-700">
              {matchResult.missingRequirements.map((gap: string, idx: number) => (
                <li key={`gap-${idx}`} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{gap}</span>
                </li>
              ))}
              {matchResult.unmatchedProducts.map((prod: string, idx: number) => (
                <li key={`unmatched-${idx}`} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Unmatched tender item: {prod}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> All standard compliance criteria satisfied!
            </p>
          )}
        </div>
      </div>

      {/* Action Advice */}
      {matchResult.actionAdvice && (
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            Recommended Next Action
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {matchResult.actionAdvice}
          </p>
        </div>
      )}

      {/* Bottom Link */}
      <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
        <span>Looking to improve your score? Update your catalog in dashboard.</span>
        <Link
          href="/dashboard"
          className="btn-tactile text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
        >
          Edit Profile <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
