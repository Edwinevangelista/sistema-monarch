// src/components/PremiumGate.jsx
// Wraps any feature that requires a premium plan.
// Shows a paywall banner inline when the user hits a free limit.

import React from 'react'
import { Crown, Lock } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'

/**
 * Usage:
 *   <PremiumGate feature="gastos" currentCount={gastos.length}>
 *     <button onClick={addGasto}>Add expense</button>
 *   </PremiumGate>
 *
 * Or as a standalone paywall block (no children):
 *   <PremiumGate feature="gastos" currentCount={gastos.length} />
 *
 * Props:
 *   feature       - key from PLAN_LIMITS (e.g. 'gastos', 'suscripciones')
 *   currentCount  - how many items the user already has
 *   onUpgrade     - optional callback; if omitted, opens ModalUpgrade via window event
 *   children      - button/action to wrap (rendered only when allowed)
 *   compact       - show small inline banner instead of full card
 */
export default function PremiumGate({ feature, currentCount, onUpgrade, children, compact = false }) {
  const { canAddMore, getLimit, isPremium, loading } = usePlan()

  if (loading) return children ?? null

  const allowed = canAddMore(feature, currentCount)

  if (allowed) return children ?? null

  const limit = getLimit(feature)

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Broadcast event so DashboardCompleto can open ModalUpgrade
      window.dispatchEvent(new CustomEvent('open-upgrade-modal'))
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleUpgrade}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-semibold hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
      >
        <Crown className="w-4 h-4" />
        Upgrade to add more
      </button>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-2 border-amber-500/30 rounded-2xl p-6 text-center space-y-3">
      <div className="flex items-center justify-center gap-2">
        <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
          <Crown className="w-7 h-7 text-amber-400" />
        </div>
      </div>
      <div>
        <p className="text-white font-bold text-lg">You've reached your free limit</p>
        {limit && (
          <p className="text-gray-400 text-sm mt-1">
            Free plan includes up to <span className="text-amber-300 font-semibold">{limit}</span> {feature}.
          </p>
        )}
        <p className="text-gray-500 text-sm">Upgrade to Premium for unlimited access.</p>
      </div>
      <button
        onClick={handleUpgrade}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
      >
        <Crown className="w-5 h-5" />
        Upgrade to Premium — $4.99/mo
      </button>
    </div>
  )
}
