import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/dashboard')
  }

  // 1. Fetch Company profile
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // 2. Fetch Saved Tenders
  const { data: savedTenders } = await supabase
    .from('saved_tenders')
    .select(`
      id,
      status,
      notes,
      last_viewed_at,
      created_at,
      tenders (
        id,
        title,
        slug,
        reference_number,
        estimated_value,
        currency,
        deadline,
        published_at,
        sources (name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 3. Fetch Alert rules
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 4. Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name_en', { ascending: true })

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header />

      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <DashboardClient
          user={user}
          company={company}
          savedTenders={savedTenders || []}
          alerts={alerts || []}
          categories={categories || []}
        />
      </main>

      <Footer />
    </div>
  )
}
