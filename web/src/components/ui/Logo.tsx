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
    <Link href="/" className={`group flex items-center gap-3 select-none ${className}`}>
      {/* Brandkit Precision Vector Emblem */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} transition-all duration-300 ease-out group-hover:scale-105`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Subtle Outer Glow & Orbit Ring */}
          <circle
            cx="24"
            cy="24"
            r="21"
            className="stroke-blue-100 group-hover:stroke-blue-200 transition-colors"
            strokeWidth="2"
          />

          {/* Primary Royal Cobalt Orbit Arc */}
          <path
            d="M8 24C8 15.1634 15.1634 8 24 8C30.2 8 35.6 11.5 38.2 16.6"
            stroke="#2563EB"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M40 24C40 32.8366 32.8366 40 24 40C17.8 40 12.4 36.5 9.8 31.4"
            stroke="#1D4ED8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Upward Bid Velocity Diagonal Arrow (Amber Gold) */}
          <path
            d="M13 35L35 13"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M26 13H35V22"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision Auction Gavel (Royal Cobalt & Navy) */}
          {/* Gavel Head */}
          <rect
            x="14"
            y="18"
            width="13"
            height="6.5"
            rx="1.75"
            transform="rotate(-45 14 18)"
            fill="#2563EB"
            stroke="#0F172A"
            strokeWidth="1.75"
          />

          {/* Gavel Sound Base / Impact Stand */}
          <rect
            x="10"
            y="32"
            width="8"
            height="3.5"
            rx="1"
            transform="rotate(-45 10 32)"
            fill="#0F172A"
          />

          {/* Central Precision Target Pip */}
          <circle cx="24" cy="24" r="2" fill="#F59E0B" />
        </svg>
      </div>

      {/* Typography with clean official badge */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-slate-900 ${titleSizes[size]} group-hover:text-blue-600 transition-colors`}>
            BidHub
          </span>

          {/* Clean Official Cambodian Badge */}
          <span className="relative inline-flex items-center justify-center font-bold text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
            KH
          </span>
        </div>

        {showTagline && (
          <span className="text-[10px] font-semibold text-slate-500 tracking-wide mt-0.5">
            Tender Intelligence · ប៊ីតហាប់
          </span>
        )}
      </div>
    </Link>
  )
}
