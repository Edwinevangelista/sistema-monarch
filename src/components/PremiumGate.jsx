import React from 'react'
import { Crown, Lock } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'

export default function PremiumGate({ feature, children, fallback = null }) {
  const { canUseFeature, loading } = usePlan()

  if (loading) return null
  if (canUseFeature(feature)) return children
  if (fallback) return fallback

  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <div className="absolute inset-0 flex items-center justify-center bg-white px-4 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-slate-900">Función Premium</p>
          <p className="mt-1 text-xs text-slate-600">Desbloquea herramientas avanzadas para analizar y planificar tu dinero.</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-600"
          >
            <Crown className="h-4 w-4" />
            Desbloquear con Premium
          </button>
        </div>
      </div>
    </div>
  )
}
