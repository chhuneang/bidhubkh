'use client'

import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}

export function Logo({ size = 'md', showTagline = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <Link href="/" className={`group flex items-center gap-2.5 select-none ${className}`}>
      {/* Hand-drawn / MS Paint style Doodle Icon */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110`}>
        {/* Hand-drawn yellow sticky-blob background with sketchy border */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* MS Paint style irregular wobbly background blob */}
          <path
            d="M8 14C7 8 13 5 21 6C29 7 40 5 42 12C44 19 43 32 39 39C35 46 22 43 14 42C6 41 9 20 8 14Z"
            fill="#FEF08A"
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hand-drawn Auction Gavel / Bidding Hammer in MS Paint style */}
          {/* Gavel Head (slanted wobbly block) */}
          <path
            d="M17 14L28 20L25 25L14 19L17 14Z"
            fill="#3B82F6"
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gavel Handle (sketchy stick) */}
          <path
            d="M21 22L33 34"
            stroke="#1E293B"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Handdrawn action spark / impact lines (classic MS Paint doodle) */}
          <path
            d="M11 11L8 8"
            stroke="#EF4444"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M19 8L20 4"
            stroke="#EF4444"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M11 20L7 22"
            stroke="#EF4444"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Cute little hand-drawn happy eyes/sparkle in the corner */}
          <circle cx="36" cy="14" r="1.5" fill="#1E293B" />
          <path
            d="M34 18C35.5 20 37.5 20 39 18"
            stroke="#1E293B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography with hand-drawn sticker badge for KH */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-slate-900 ${titleSizes[size]} group-hover:text-blue-600 transition-colors`}>
            BidHub
          </span>

          {/* Hand-drawn sketchy sticker pill for "KH" */}
          <span className="relative inline-flex items-center justify-center font-black text-[11px] text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] -rotate-3 group-hover:rotate-0 transition-transform">
            KH
          </span>
        </div>

        {showTagline && (
          <span className="text-[10px] font-semibold text-slate-500 tracking-wide mt-0.5">
            Tender Intelligence
          </span>
        )}
      </div>
    </Link>
  )
}
