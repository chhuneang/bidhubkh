'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { User, LogOut, LayoutDashboard, Bookmark, Settings, AlertTriangle, Loader2 } from 'lucide-react'

interface UserNavProps {
  user: {
    email?: string
    phone?: string
    user_metadata?: {
      company_name?: string
      full_name?: string
      avatar_url?: string
    }
  }
}

export function UserNav({ user }: UserNavProps) {
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const displayName = user.user_metadata?.company_name || user.user_metadata?.full_name || user.email?.split('@')[0] || user.phone || 'Supplier'
  const avatarLetter = displayName[0].toUpperCase()

  const handleConfirmSignOut = () => {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <>
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

        <button
          type="button"
          onClick={() => setShowSignOutModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Confirmation Sign Out Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-slate-800 max-w-sm w-full space-y-5 bg-slate-950 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Sign Out Confirmation</h3>
                <p className="text-xs text-slate-400 mt-0.5">End your current session</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to sign out of <span className="text-white font-semibold">{user.email || user.phone || 'your account'}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  'Yes, Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
