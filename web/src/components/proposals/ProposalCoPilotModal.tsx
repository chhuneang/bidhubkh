'use client'

import { useState } from 'react'
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
  Download,
  Save,
  Printer,
  X,
  Languages,
  Check,
  RotateCcw,
  Sliders,
  Building2,
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react'
import {
  type ProposalLanguage,
  type ProposalSectionKey,
  type ProposalSection,
  type GeneratedProposal,
  ALL_PROPOSAL_SECTIONS,
  assembleProposalMarkdown
} from '@/lib/proposal_engine'

interface ProposalCoPilotModalProps {
  isOpen: boolean
  onClose: () => void
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
  company?: {
    business_name?: string | null
    tax_id?: string | null
    registration_number?: string | null
    description?: string | null
    operating_provinces?: string[] | null
    contact_email?: string | null
    contact_phone?: string | null
    products?: any[] | null
  } | null
}

const SECTION_METADATA: Record<
  ProposalSectionKey,
  { label: string; desc: string; icon: any }
> = {
  cover_letter: {
    label: '1. Executive Cover Letter',
    desc: 'Official submission memo to the Ministry / Procuring Entity',
    icon: Building2
  },
  methodology: {
    label: '2. Technical Scope & Methodology',
    desc: 'Delivery approach, QA/QC, and BoQ alignment',
    icon: FileText
  },
  compliance: {
    label: '3. Compliance & Eligibility Matrix',
    desc: 'GDT Tax clearance, MoC patent, and certifications',
    icon: ShieldCheck
  },
  team_schedule: {
    label: '4. Team & Delivery Milestones',
    desc: 'Key staff qualifications and project timeline',
    icon: Calendar
  },
  commercial_pricing: {
    label: '5. Commercial Pricing & Terms',
    desc: 'Payment schedule and all-inclusive pricing framework',
    icon: DollarSign
  }
}

export function ProposalCoPilotModal({
  isOpen,
  onClose,
  tender,
  company
}: ProposalCoPilotModalProps) {
  const [language, setLanguage] = useState<ProposalLanguage>('en')
  const [selectedSections, setSelectedSections] = useState<ProposalSectionKey[]>([
    ...ALL_PROPOSAL_SECTIONS
  ])
  const [customInstructions, setCustomInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [generatedProposal, setGeneratedProposal] = useState<GeneratedProposal | null>(null)
  const [activeTab, setActiveTab] = useState<ProposalSectionKey>('cover_letter')
  const [editableContent, setEditableContent] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const toggleSection = (key: ProposalSectionKey) => {
    if (selectedSections.includes(key)) {
      if (selectedSections.length === 1) return // Keep at least one
      setSelectedSections(selectedSections.filter((k) => k !== key))
    } else {
      setSelectedSections([...selectedSections, key])
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setSaveSuccess(false)
    try {
      const res = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender: {
            id: tender.id,
            title: tender.title,
            tender_number: tender.tender_number,
            organization_name: tender.organization?.name_en || tender.organization?.name_km,
            source_code: tender.source_code,
            estimated_amount: tender.estimated_amount,
            currency: tender.currency,
            submission_deadline: tender.submission_deadline,
            ai_summary: tender.ai_summary,
            bill_of_quantities: tender.bill_of_quantities,
            eligibility_checklist: tender.eligibility_checklist
          },
          company,
          language,
          selectedSections,
          customInstructions
        })
      })

      const data = await res.json()
      if (data.success && data.proposal) {
        setGeneratedProposal(data.proposal)
        const initialContent: Record<string, string> = {}
        Object.entries(data.proposal.sections).forEach(([k, sec]: [string, any]) => {
          initialContent[k] = sec.content
        })
        setEditableContent(initialContent)
        // Set active tab to first available section
        const firstKey = Object.keys(data.proposal.sections)[0] as ProposalSectionKey
        if (firstKey) setActiveTab(firstKey)
      }
    } catch (err) {
      console.error('Failed to generate proposal', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!generatedProposal) return
    setIsSaving(true)
    try {
      const updatedSections: Record<string, ProposalSection> = {}
      Object.entries(generatedProposal.sections).forEach(([k, sec]) => {
        if (sec) {
          updatedSections[k] = {
            ...sec,
            content: editableContent[k] || sec.content
          }
        }
      })

      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_id: tender.id,
          title: generatedProposal.title,
          language: generatedProposal.language,
          sections: updatedSections,
          custom_notes: customInstructions || null,
          status: 'draft'
        })
      })

      const data = await res.json()
      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save proposal draft', err)
    } finally {
      setIsSaving(false)
    }
  }

  const getFullMarkdownText = () => {
    if (!generatedProposal) return ''
    const currentSections: Record<string, ProposalSection> = {}
    Object.entries(generatedProposal.sections).forEach(([k, sec]) => {
      if (sec) {
        currentSections[k] = {
          ...sec,
          content: editableContent[k] || sec.content
        }
      }
    })
    return assembleProposalMarkdown(currentSections, generatedProposal.language)
  }

  const handleCopy = () => {
    const text = getFullMarkdownText()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    const text = getFullMarkdownText()
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Proposal_${tender.tender_number || tender.id}_${language}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">AI Bid Proposal Co-Pilot</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  Bilingual Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                {tender.title} ({tender.tender_number || 'Tender Notice'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Configuration Controls */}
          <div className="lg:col-span-5 space-y-5">
            {/* Language Picker */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                Target Language / ភាសាសំណើ
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    language === 'en'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('km')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    language === 'km'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ភាសាខ្មែរ (KM)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bilingual')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    language === 'bilingual'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Bilingual Dual
                </button>
              </div>
            </div>

            {/* Modular Section Selection */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Included Proposal Sections
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {selectedSections.length} of 5 selected
                </span>
              </label>
              <div className="space-y-2">
                {ALL_PROPOSAL_SECTIONS.map((key) => {
                  const meta = SECTION_METADATA[key]
                  const isChecked = selectedSections.includes(key)
                  const Icon = meta.icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSection(key)}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'bg-white border-blue-300 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                          {meta.label}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          {meta.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Special Instructions / លក្ខខណ្ឌបន្ថែម
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Highlight 3-year on-site warranty, free user training in Siem Reap, and fast 14-day delivery..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || selectedSections.length === 0}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Proposal with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {generatedProposal ? 'Re-Generate Proposal' : 'Generate Proposal Dossier'}
                </>
              )}
            </button>
          </div>

          {/* Right Column: In-Browser Editor & Section Preview */}
          <div className="lg:col-span-7 flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden min-h-[420px]">
            {generatedProposal ? (
              <div className="flex-1 flex flex-col">
                {/* Section Tab Bar */}
                <div className="flex items-center gap-1 overflow-x-auto p-2 border-b border-slate-200 bg-white">
                  {Object.keys(generatedProposal.sections).map((secKey) => {
                    const key = secKey as ProposalSectionKey
                    const isActive = activeTab === key
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        {SECTION_METADATA[key]?.label.split('.')[1]?.trim() || key}
                      </button>
                    )
                  })}
                </div>

                {/* Section Content Editor */}
                <div className="flex-1 p-4 bg-white overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {generatedProposal.sections[activeTab]?.title}
                    </span>
                    <span className="text-[11px] text-slate-400 italic">Editable text</span>
                  </div>
                  <textarea
                    value={editableContent[activeTab] || ''}
                    onChange={(e) =>
                      setEditableContent({ ...editableContent, [activeTab]: e.target.value })
                    }
                    rows={15}
                    className="w-full p-3 font-sans text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Action Export Footer Dock */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                          Saved to Dashboard!
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? 'Saving...' : 'Save Draft'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          Copy All
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadMarkdown}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Markdown (.md)
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      Print / PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-sm font-bold text-slate-800">Proposal Preview Ready</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Select your target language and desired proposal sections on the left, then click{' '}
                    <strong className="text-blue-600">Generate Proposal Dossier</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
