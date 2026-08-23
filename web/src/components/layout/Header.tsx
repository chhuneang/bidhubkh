import Link from 'next/link'
import { Search, Bell, ShieldCheck, Compass, Bookmark, LayoutDashboard, User } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-md shadow-blue-500/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">
                BidHub<span className="text-blue-400">KH</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 -mt-1">
                Tender Intelligence
              </span>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/tenders" className="hover:text-blue-400 transition-colors">
              Find Tenders
            </Link>
            <Link href="/dashboard" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-blue-400" />
              Bid Pipeline
            </Link>
            <Link href="/admin" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Sources Health
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-all"
          >
            <User className="h-3.5 w-3.5 text-slate-400" />
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95 cursor-pointer"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Supplier Portal
          </Link>
        </div>
      </div>
    </header>
  )
}
