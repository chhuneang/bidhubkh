'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserNav } from './UserNav'
import { Search, Bell, ShieldCheck, Compass, Bookmark, LayoutDashboard, User } from 'lucide-react'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Listen for real-time auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                BidHub<span className="text-blue-600">KH</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500 -mt-1">
                Tender Intelligence
              </span>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/tenders" className="hover:text-blue-600 transition-colors">
              Find Tenders
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-blue-600" />
              Bid Pipeline
            </Link>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span className="text-blue-600 font-bold">$</span>
              Pricing
            </Link>
            <Link href="/admin" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Sources Health
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserNav user={user} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                Sign In
              </Link>

              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Supplier Portal
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
