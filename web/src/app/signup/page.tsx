import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { SignUpForm } from './SignUpForm'
import {
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
  LogOut
} from 'lucide-react'

export default async function SignUpPage() {
  let user: any = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      // Ignored
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {user ? (
            /* Already Signed In View */
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white shadow-md shadow-blue-600/20 mx-auto">
                {user.email?.[0].toUpperCase() || 'S'}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Currently Signed In
                </div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  You already have an active account
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {user.email}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Supplier Dashboard
                </Link>

                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/30 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out & Switch Account
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Registration Form View */
            <>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-4 shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Join Cambodia&apos;s B2B Tender Network
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Create Supplier Account
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Start matching your product catalog against government & donor bids
                </p>
              </div>

              <SignUpForm />

              <p className="text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
