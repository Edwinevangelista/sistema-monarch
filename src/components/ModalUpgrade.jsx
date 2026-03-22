// src/components/ModalUpgrade.jsx
// Pricing modal — triggers Stripe checkout or app store IAP
// Shown when user hits a free limit or clicks "Upgrade"

import React, { useState, useEffect } from 'react'
import { X, Crown, Zap, TrendingUp, Shield, Repeat, Sparkles } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'

const PREMIUM_FEATURES = [
  { icon: Zap, text: 'Unlimited expenses, income & subscriptions' },
  { icon: TrendingUp, text: 'AI Financial Assistant — unlimited analysis' },
  { icon: Shield, text: 'Debt tracker & savings plans — unlimited' },
  { icon: Repeat, text: 'Fixed expenses & bill reminders — unlimited' },
  { icon: Crown, text: 'Advanced reports & PDF/Excel export' },
  { icon: Sparkles, text: 'Priority support & early access to new features' },
]

export default function ModalUpgrade({ isOpen, onClose }) {
  const { isTrial, trialUsed, trialDaysRemaining, startTrial } = usePlan()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [trialLoading, setTrialLoading] = useState(false)

  // Listen for global event to open this modal
  useEffect(() => {
    const handler = () => { /* parent controls isOpen */ }
    window.addEventListener('open-upgrade-modal', handler)
    return () => window.removeEventListener('open-upgrade-modal', handler)
  }, [])

  if (!isOpen) return null

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in to upgrade.')

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/dashboard?upgrade=cancelled`,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      toast.error('Could not start checkout. Please try again.')
      console.error('Checkout error:', err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleStartTrial = async () => {
    setTrialLoading(true)
    try {
      const { error } = await startTrial()
      if (error) throw new Error(error)
      toast.success('🎉 Your 7-day free trial has started!')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not start trial. Please try again.')
    } finally {
      setTrialLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-600/30 to-orange-600/20 p-6 border-b border-white/5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
              <Crown className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">FinGuide Premium</h2>
              <p className="text-amber-300 text-sm">Full financial control, zero limits</p>
            </div>
          </div>
          {isTrial && trialDaysRemaining > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-amber-300 text-sm font-medium">
              ⏳ {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in your free trial
            </div>
          )}
        </div>

        {/* Features */}
        <div className="p-6 space-y-3">
          {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/15 rounded-lg border border-emerald-500/20">
                <Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-gray-200 text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* Pricing + CTA */}
        <div className="px-6 pb-6 space-y-3">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">Premium Monthly</p>
              <p className="text-gray-400 text-xs">Cancel anytime • No hidden fees</p>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-2xl">$6.99</p>
              <p className="text-gray-500 text-xs">/month</p>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
          >
            {checkoutLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Crown className="w-5 h-5" />
            )}
            {checkoutLoading ? 'Opening checkout...' : 'Subscribe — $6.99/mo'}
          </button>

          {/* Trial CTA — only if not used */}
          {!trialUsed && !isTrial && (
            <button
              onClick={handleStartTrial}
              disabled={trialLoading}
              className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-60 text-gray-300 hover:text-white font-semibold py-3 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              {trialLoading ? (
                <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400" />
              )}
              {trialLoading ? 'Starting trial...' : 'Start 7-day free trial'}
            </button>
          )}

          <p className="text-center text-gray-600 text-xs">
            Secure payment via Stripe · iOS & Android supported
          </p>
        </div>
      </div>
    </div>
  )
}
