import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { PricingClient } from './PricingClient'

export const metadata = {
  title: 'Pricing & Subscription Plans — BidHubKH',
  description: 'Unlock unlimited AI tender summaries, win probability scores, and Telegram alerts with transparent Cambodian Bakong KHQR pricing.'
}

const FALLBACK_PLANS = [
  {
    id: 'plan-free',
    slug: 'free',
    name: 'Free Starter',
    description: 'Essential access for small contractors exploring public tenders.',
    price_usd: 0,
    price_khr: 0,
    features: [
      'Browse all 6 Cambodian procurement sources',
      '5 AI Tender Summaries / month',
      '1 Active Telegram Alert Rule',
      'Basic Search & Sector Filters'
    ],
    is_popular: false
  },
  {
    id: 'plan-pro',
    slug: 'pro',
    name: 'Pro Supplier',
    description: 'Designed for growing Cambodian suppliers & contractors actively bidding.',
    price_usd: 29,
    price_khr: 118000,
    features: [
      'Unlimited AI Tender Summaries & BoQ Extraction',
      'AI Bid / No-Bid Decision Matrix & Win Probability',
      'Instant Telegram & Email Notification Alerts',
      'Full Saved Bids Pipeline Management',
      'Supplier Qualification Match & Gap Analysis',
      'Priority Email Support'
    ],
    is_popular: true
  },
  {
    id: 'plan-enterprise',
    slug: 'enterprise',
    name: 'Enterprise GovTech',
    description: 'For enterprise contractors, engineering firms & multi-person bid teams.',
    price_usd: 99,
    price_khr: 400000,
    features: [
      'Everything in Pro Supplier',
      'Unlimited Telegram Alert Channels',
      'AI Proposal & Technical Spec Drafter',
      'Multi-Seat Team Collaboration (Up to 5 seats)',
      'Export Custom Decision Memos & Word Proposals',
      'Dedicated Account Manager & Phone Support'
    ],
    is_popular: false
  }
]

export default async function PricingPage() {
  let plans = FALLBACK_PLANS
  let currentPlanSlug = 'free'
  let user = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser

      // 1. Fetch live plans from DB
      const { data: dbPlans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_usd', { ascending: true })

      if (dbPlans && dbPlans.length > 0) {
        plans = dbPlans.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description || '',
          price_usd: Number(p.price_usd),
          price_khr: Number(p.price_khr),
          features: Array.isArray(p.features) ? p.features.map((f) => String(f)) : [],
          is_popular: p.is_popular
        }))
      }

      // 2. Fetch user's active subscription
      if (user) {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('subscription_plans (slug)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (sub?.subscription_plans && typeof sub.subscription_plans === 'object' && 'slug' in sub.subscription_plans) {
          currentPlanSlug = (sub.subscription_plans as { slug: string }).slug
        }
      }
    } catch {
      // Fallback to static
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <PricingClient
          plans={plans}
          currentPlanSlug={currentPlanSlug}
          isLoggedIn={!!user}
        />
      </main>

      <Footer />
    </div>
  )
}
