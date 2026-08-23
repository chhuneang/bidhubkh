'use client'

import { useState, useEffect } from 'react'
import { KHQRResult } from '@/lib/bakong'
import { confirmBakongPayment } from '@/app/actions/billing'
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

interface BakongCheckoutModalProps {
  khqr: KHQRResult
  planName: string
  onClose: () => void
  onSuccess: (planName: string) => void
}

export function BakongCheckoutModal({
  khqr,
  planName,
  onClose,
  onSuccess
}: BakongCheckoutModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const handleConfirm = async () => {
    setIsVerifying(true)
    setErrorMsg(null)
    try {
      const res = await confirmBakongPayment(khqr.billNumber)
      if (res.success) {
        setIsSuccess(true)
        setTimeout(() => {
          onSuccess(res.planName || planName)
        }, 1500)
      } else {
        setErrorMsg(res.error || 'Payment verification failed')
      }
    } catch {
      setErrorMsg('An unexpected error occurred during verification')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-xs shadow-sm">
              KH
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Bakong KHQR Checkout
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  NBC Official
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Scan with any Cambodian Mobile Banking App
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Payment Confirmed!</h4>
            <p className="text-xs text-slate-600">
              Your account has been upgraded to <strong>{planName}</strong>. Unlocking AI features...
            </p>
          </div>
        ) : (
          <>
            {/* Amount & Plan Summary */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Selected Tier</span>
                <strong className="text-sm text-slate-900 font-bold">{planName}</strong>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block font-medium">Total Amount</span>
                <span className="text-base font-extrabold text-slate-900">
                  {khqr.currency === 'USD' ? `$${khqr.amount.toFixed(2)} USD` : `${khqr.amount.toLocaleString()} KHR`}
                </span>
              </div>
            </div>

            {/* Dynamic KHQR Card */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              {/* KHQR Header Banner */}
              <div className="w-full flex items-center justify-between px-2 text-[11px] font-black tracking-wider text-rose-600 uppercase border-b border-slate-200 pb-2">
                <span>KHQR</span>
                <span className="text-slate-600 font-mono font-semibold">{khqr.billNumber}</span>
              </div>

              {/* QR Image */}
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
                <img
                  src={khqr.qrImageUrl}
                  alt="Bakong KHQR Payment Code"
                  className="h-48 w-48 object-contain"
                />
              </div>

              {/* Bank logos prompt */}
              <div className="text-[10px] text-slate-500 font-medium text-center">
                ABA • ACLEDA • Wing • Bakong • Canadia • Chip Mong
              </div>
            </div>

            {/* Timer & Instructions */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Expires in: {formattedTime}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Instant Activation</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isVerifying || secondsLeft === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  'Verifying Payment...'
                ) : (
                  <>
                    <span>I Have Completed Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Transaction reference: <code className="font-mono text-slate-600">{khqr.billNumber}</code>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
