import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      <Header />

      <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-pulse">
        {/* Top Header Shimmer */}
        <div className="space-y-3 mb-8">
          <div className="h-4 w-32 bg-slate-200 rounded-full" />
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>

        {/* Content Shimmer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-48 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-10 w-40 bg-slate-200 rounded-xl mt-4" />
            </div>

            <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-60 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="h-5 w-32 bg-slate-200 rounded" />
              <div className="h-8 w-full bg-slate-100 rounded-xl" />
              <div className="h-8 w-full bg-slate-100 rounded-xl" />
              <div className="h-10 w-full bg-blue-100 rounded-xl" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
