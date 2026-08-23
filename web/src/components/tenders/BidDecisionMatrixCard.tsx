'use client'

import { BidDecisionResult } from '@/lib/decision_matrix'
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Compass,
  FileCheck,
  Zap,
  Target,
  Clock,
  DollarSign
} from 'lucide-react'

interface BidDecisionMatrixCardProps {
  decisionResult: BidDecisionResult
  tenderTitle: string
}

export function BidDecisionMatrixCard({ decisionResult, tenderTitle }: BidDecisionMatrixCardProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-blue-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
              AI Strategic Intelligence
            </span>
            <h2 className="text-lg font-bold text-white">
              Bid / No-Bid Decision Matrix
            </h2>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-sm shrink-0"
        >
          <Printer className="h-3.5 w-3.5 text-slate-400" />
          Export Decision Memo
        </button>
      </div>

      {/* Main Score & Decision Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 border border-slate-800">
        {/* Win Probability */}
        <div className="space-y-1">
          <span className="text-xs text-slate-400 font-medium block">
            Estimated Win Probability
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {decisionResult.winProbability}%
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {decisionResult.winProbability >= 70 ? 'High Likelihood' : 'Competitive'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Weighted across 4 commercial & technical dimensions
          </p>
        </div>

        {/* Executive Verdict */}
        <div className="space-y-1">
          <span className="text-xs text-slate-400 font-medium block">
            Executive Recommendation
          </span>
          <div>
            <span className={`inline-block text-xs px-3 py-1.5 rounded-xl font-bold border shadow-sm ${decisionResult.badgeClass}`}>
              {decisionResult.decisionLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Algorithmic go/no-go assessment
          </p>
        </div>

        {/* Execution Risk Level */}
        <div className="space-y-1">
          <span className="text-xs text-slate-400 font-medium block">
            Execution Risk Level
          </span>
          <div>
            <span className={`inline-block text-xs px-3 py-1.5 rounded-xl font-bold border ${decisionResult.riskBadgeClass}`}>
              {decisionResult.riskLevel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Based on lead-time, warranty SLAs, and penalties
          </p>
        </div>
      </div>

      {/* 4-Factor Dimension Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Target className="h-4 w-4 text-blue-400" />
          Evaluation Dimension Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Capability Alignment */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-blue-400" />
                Technical Capability Fit
              </span>
              <span className="font-bold text-white">
                {decisionResult.breakdown.capabilityFit}/100
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${decisionResult.breakdown.capabilityFit}%` }}
              />
            </div>
          </div>

          {/* 2. Margin Viability */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Commercial Margin Viability
              </span>
              <span className="font-bold text-white">
                {decisionResult.breakdown.marginViability}/100
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${decisionResult.breakdown.marginViability}%` }}
              />
            </div>
          </div>

          {/* 3. Schedule Feasibility */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Timeline & Schedule Feasibility
              </span>
              <span className="font-bold text-white">
                {decisionResult.breakdown.scheduleFeasibility}/100
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${decisionResult.breakdown.scheduleFeasibility}%` }}
              />
            </div>
          </div>

          {/* 4. Compliance & Legal Ease */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                Compliance & Legal Friction
              </span>
              <span className="font-bold text-white">
                {decisionResult.breakdown.complianceEase}/100
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full"
                style={{ width: `${decisionResult.breakdown.complianceEase}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Risks & Strengths Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strategic Advantages */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2.5">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Competitive Advantages
          </span>
          <ul className="space-y-1.5">
            {decisionResult.strategicAdvantages.map((adv, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Identified Risk Factors */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2.5">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Identified Risk Factors
          </span>
          <ul className="space-y-1.5">
            {decisionResult.keyRisks.map((risk, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">!</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Executive Advice Footer */}
      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-3">
        <Compass className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
        <div>
          <strong className="block text-cyan-100 font-semibold mb-0.5">
            Strategic Action Recommendation:
          </strong>
          <span className="leading-relaxed">
            {decisionResult.executiveAdvice}
          </span>
        </div>
      </div>
    </div>
  )
}
