'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ProposalCoPilotModal } from '@/components/proposals/ProposalCoPilotModal'

interface ProposalCoPilotButtonProps {
  tender: {
    id: string
    title: string
    tender_number?: string | null
    estimated_amount?: number | null
    currency?: string | null
    submission_deadline?: string | null
    source_code?: string | null
    ai_summary?: string | null
    bill_of_quantities?: any
    eligibility_checklist?: any
    organization?: { name_en?: string; name_km?: string } | null
  }
  company?: any
}

export function ProposalCoPilotButton({
  tender,
  company
}: ProposalCoPilotButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-tactile w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-3.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer group"
      >
        <Sparkles className="h-4 w-4 animate-pulse text-blue-200 group-hover:rotate-12 transition-transform" />
        <span>Draft Bid Proposal with AI</span>
      </button>

      <ProposalCoPilotModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tender={tender}
        company={company}
      />
    </>
  )
}
