'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface StageOption {
  key: string
  label: string
  dotColor: string
  badgeColor: string
}

const STAGE_OPTIONS: StageOption[] = [
  { key: 'interested', label: 'Interested', dotColor: 'bg-blue-500', badgeColor: 'text-blue-700 bg-blue-50 border-blue-200' },
  { key: 'reviewing', label: 'Reviewing Specs', dotColor: 'bg-amber-500', badgeColor: 'text-amber-800 bg-amber-50 border-amber-200' },
  { key: 'preparing_bid', label: 'Preparing Bid', dotColor: 'bg-purple-500', badgeColor: 'text-purple-700 bg-purple-50 border-purple-200' },
  { key: 'submitted', label: 'Submitted', dotColor: 'bg-cyan-500', badgeColor: 'text-cyan-800 bg-cyan-50 border-cyan-200' },
  { key: 'won', label: 'Won 🎉', dotColor: 'bg-emerald-500', badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { key: 'lost', label: 'Lost', dotColor: 'bg-rose-500', badgeColor: 'text-rose-800 bg-rose-50 border-rose-200' },
]

interface StageDropdownProps {
  currentStatus: string
  onChange: (newStatus: string) => void
}

export function StageDropdown({ currentStatus, onChange }: StageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeOption = STAGE_OPTIONS.find((s) => s.key === currentStatus) || STAGE_OPTIONS[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (key: string) => {
    onChange(key)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Custom Framed Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition-all cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${activeOption.dotColor}`} />
          <span className="truncate">{activeOption.label}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </button>

      {/* Floating Custom Popup Menu */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1.5 z-50 w-full min-w-[180px] rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 space-y-0.5 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Change Bid Stage
          </div>
          {STAGE_OPTIONS.map((opt) => {
            const isSelected = opt.key === currentStatus
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelect(opt.key)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${opt.dotColor}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
