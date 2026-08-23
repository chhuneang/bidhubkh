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
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {user ? (
            /* Already Signed In View */
            <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-blue-500/20 mx-auto">
                {user.email?.[0].toUpperCase() || 'S'}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Currently Signed In
                </div>
                <h1 className="text-xl font-bold text-white">
                  You already have an active account
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {user.email}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Supplier Dashboard
                </Link>

                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-4">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Join Cambodia&apos;s B2B Tender Network
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Create Supplier Account
                </h1>
                <p className="text-sm text-slate-400 mt-2">
                  Start matching your product catalog against government & donor bids
                </p>
              </div>

              <SignUpForm />

              <p className="text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300">
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
