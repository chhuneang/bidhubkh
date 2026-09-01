import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Search, Compass, ArrowRight, ShieldCheck, FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full text-center space-y-8">
          {/* Visual Icon Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="h-24 w-24 rounded-3xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 shadow-lg shadow-blue-500/10">
              <FileQuestion className="h-12 w-12 stroke-[1.5]" />
            </div>
            <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono text-xs font-bold shadow-sm">
              404
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tender Notice or Page Not Found
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              The procurement notice you are looking for may have expired, been archived, or the link may have been updated by the procuring entity.
            </p>
          </div>

          {/* Quick Search */}
          <div className="max-w-md mx-auto">
            <form action="/tenders" method="GET" className="flex items-center gap-2 rounded-2xl bg-white border-2 border-slate-200 p-1.5 shadow-sm focus-within:border-blue-500 transition-all">
              <Search className="h-4 w-4 text-blue-600 ml-2.5 shrink-0" />
              <input
                type="text"
                name="q"
                placeholder="Search active tenders..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium px-2"
              />
              <button
                type="submit"
                className="btn-tactile rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Suggested Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tenders"
              className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              Browse Tender Catalog
            </Link>
            <Link
              href="/sources"
              className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Check Sources Health
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
