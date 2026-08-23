'use client'

import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { User, LogOut, LayoutDashboard, Bookmark, Settings } from 'lucide-react'

interface UserNavProps {
  user: {
    email?: string
    user_metadata?: {
      company_name?: string
      full_name?: string
      avatar_url?: string
    }
  }
}

export function UserNav({ user }: UserNavProps) {
  const displayName = user.user_metadata?.company_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Supplier'
  const avatarLetter = displayName[0].toUpperCase()

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 hover:border-slate-700 transition-all group"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-sm shadow-blue-500/20">
          {avatarLetter}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors leading-tight max-w-[130px] truncate">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-400 leading-tight">Supplier Hub</span>
        </div>
      </Link>

      <form action={logout}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
