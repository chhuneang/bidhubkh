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
      className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all cursor-pointer shadow-xs ${
        saved
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          Updating...
        </>
      ) : saved ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Saved in Bid Pipeline
        </>
      ) : (
        <>
          <Bookmark className="h-3.5 w-3.5 text-blue-600" />
          Save to Bid Pipeline
        </>
      )}
    </button>
  )
}
