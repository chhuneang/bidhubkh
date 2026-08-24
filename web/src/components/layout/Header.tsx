'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserNav } from './UserNav'
import { Logo } from '@/components/ui/Logo'
import {
  Search,
  Bookmark,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  User,
  Menu,
  X,
  Sparkles
} from 'lucide-react'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Listen for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const navItems = [
    {
      name: 'Find Tenders',
      href: '/tenders',
      icon: Search,
      activeColor: 'text-blue-600 bg-white border-blue-200 shadow-xs ring-2 ring-blue-500/10',
      hoverColor: 'hover:text-blue-600 hover:bg-blue-50/60',
      badgeDot: 'bg-blue-500',
    },
    {
      name: 'Bid Pipeline',
      href: '/dashboard',
      icon: Bookmark,
      activeColor: 'text-indigo-600 bg-white border-indigo-200 shadow-xs ring-2 ring-indigo-500/10',
      hoverColor: 'hover:text-indigo-600 hover:bg-indigo-50/60',
      badgeDot: 'bg-indigo-500',
    },
    {
      name: 'Sources Health',
      href: '/sources',
      icon: ShieldCheck,
      activeColor: 'text-teal-700 bg-white border-teal-200 shadow-xs ring-2 ring-teal-500/10',
      hoverColor: 'hover:text-teal-700 hover:bg-teal-50/60',
      badgeDot: 'bg-teal-500',
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Hand-drawn Doodle */}
        <div className="flex items-center gap-6">
          <Logo size="md" showTagline={true} />

          {/* Framed & Colorful Navigation Bar (Desktop) */}
          <nav className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-100/80 border border-slate-200/90 shadow-inner gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)

              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${
                    isActive
                      ? `${item.activeColor} scale-[1.02] border`
                      : `text-slate-600 border border-transparent hover:scale-105 active:scale-95 ${item.hoverColor}`
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12 ${
                    isActive ? 'scale-110' : 'text-slate-400 group-hover:text-current'
                  }`} />
                  <span>{item.name}</span>

                  {/* Unique active indicator dot with pulse animation */}
                  {isActive && (
                    <span className="relative flex h-1.5 w-1.5 ml-0.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.badgeDot} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${item.badgeDot}`} />
                    </span>
                  )}
                </Link>
              )
            })}
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
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0"
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                Sign In
              </Link>

              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Supplier Portal</span>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Framed Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="p-1.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)

              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? `${item.activeColor} border`
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>

                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold">
                      <span className={`inline-block h-2 w-2 rounded-full ${item.badgeDot}`} />
                      Active
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {!user && (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-xs"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
