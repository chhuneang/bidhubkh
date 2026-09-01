'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AlertTriangle, RefreshCw, Home, Search } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('BidHubKH Client Error Boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="h-20 w-20 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-md shadow-rose-500/10 mx-auto">
            <AlertTriangle className="h-10 w-10 stroke-[1.75]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Temporary Connection Issue
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              We encountered an unexpected error while retrieving this procurement view. Please try reloading or return home.
            </p>
          </div>

          {error.digest && (
            <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-500">
              Error Digest: {error.digest}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
            <Link
              href="/"
              className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              Return Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
