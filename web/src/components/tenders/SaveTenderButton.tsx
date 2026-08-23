'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Check, Loader2 } from 'lucide-react'

interface SaveTenderButtonProps {
  tenderId: string
  initialSaved?: boolean
}

export function SaveTenderButton({ tenderId, initialSaved = false }: SaveTenderButtonProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggleSave = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to login
        router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      if (saved) {
        // Remove from saved
        await supabase
          .from('saved_tenders')
          .delete()
          .eq('user_id', user.id)
          .eq('tender_id', tenderId)
        setSaved(false)
      } else {
        // Add to saved pipeline
        await supabase
          .from('saved_tenders')
          .upsert({
            user_id: user.id,
            tender_id: tenderId,
            status: 'interested',
            notes: 'Saved from tender intelligence catalog'
          }, { onConflict: 'user_id,tender_id' })
        setSaved(true)
      }
    } catch (err) {
      console.error('Failed to toggle save tender:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggleSave}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
        saved
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-600 hover:text-white'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating...
        </>
      ) : saved ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          Saved in Bid Pipeline
        </>
      ) : (
        <>
          <Bookmark className="h-3.5 w-3.5 text-blue-400" />
          Save to Bid Pipeline
        </>
      )}
    </button>
  )
}
