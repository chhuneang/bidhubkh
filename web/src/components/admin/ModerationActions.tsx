'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Copy, Loader2 } from 'lucide-react'
import { approveTender, rejectTender, markDuplicate } from '@/app/actions/admin'

interface ModerationActionsProps {
  tenderId: string
  /** Set when the pipeline flagged a suspected original (duplicate_review). */
  suspectedOriginalId?: string | null
}

export function ModerationActions({ tenderId, suspectedOriginalId }: ModerationActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<void>) => {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Action failed')
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        {pending ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Working…
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => run(() => approveTender(tenderId))}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Check className="h-3 w-3" /> Approve
            </button>
            <button
              type="button"
              onClick={() => run(() => rejectTender(tenderId))}
              className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <X className="h-3 w-3" /> Reject
            </button>
            {suspectedOriginalId && (
              <button
                type="button"
                onClick={() => run(() => markDuplicate(tenderId, suspectedOriginalId))}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Copy className="h-3 w-3" /> Mark Duplicate
              </button>
            )}
          </>
        )}
      </div>
      {error && <span className="text-[10px] font-semibold text-red-600">{error}</span>}
    </div>
  )
}
