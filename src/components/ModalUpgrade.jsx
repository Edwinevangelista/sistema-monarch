// src/components/ModalUpgrade.jsx
// Pricing modal — uses RevenueCat on native (Android/iOS), Stripe on web

import React, { useState, useEffect } from 'react'
import { X, Crown, Zap, TrendingUp, Shield, Repeat, Sparkles } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { useRevenueCat } from '../hooks/useRevenueCat'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'

const PREMIUM_FEATURES = [
  { icon: Zap,         text: 'Gastos, ingresos y suscripciones ilimitados' },
  { icon: TrendingUp,  text: 'Asistente financiero IA — análisis ilimitado' },
  { icon: Shield,      text: 'Seguimiento de deudas y planes de ahorro' },
  { icon: Repeat,      text: 'Gastos fijos y recordatorios de pagos' },
  { icon: Crown,       text: 'Reportes avanzados y exportación PDF/Excel' },
  { icon: Sparkles,    text: 'Soporte prioritario y acceso anticipado a novedades' },
]

export default function ModalUpgrade({ isOpen, onClose }) {
  const { isTrial, trialUsed, trialDaysRemaining, startTrial } = usePlan()
  const [userId, setUserId] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [trialLoading, setTrialLoading] = useState(false)

  const { isNative, loadOfferings, purchasePackage, restorePurchases } = useRevenueCat(userId)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  if (!isOpen) return null

  // ── Native (Android/iOS): use RevenueCat ──────────────────────────────────
  const handleNativePurchase = async () => {
    setCheckoutLoading(true)
    try {
      const offering = await loadOfferings()
      if (!offering) throw new Error('No se pudieron cargar las opciones de suscripción.')

      // Use the monthly package by default
      const pkg = offering.monthly ?? offering.availablePackages?.[0]
      if (!pkg) throw new Error('No hay paquete de suscripción disponible.')

      const success = await purchasePackage(pkg)
      if (success) {
        toast.success('🎉 ¡Bienvenido a FinGuide Premium!')
        onClose()
      }
    } catch (err) {
      if (err?.message !== 'PURCHASE_CANCELLED') {
        toast.error('No se pudo completar la compra. Intenta de nuevo.')
        console.error('RC purchase error:', err)
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleRestore = async () => {
    setCheckoutLoading(true)
    try {
      const restored = await restorePurchases()
      if (restored) {
        toast.success('✅ ¡Compras restauradas!')
        onClose()
      } else {
        toast.info('No se encontró una suscripción activa.')
      }
    } catch {
      toast.error('No se pudieron restaurar las compras.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ── Web: use Stripe ───────────────────────────────────────────────────────
  const handleStripeCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión para mejorar tu plan.')

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl:  `${window.location.origin}/dashboard?upgrade=cancelled`,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      toast.error('No se pudo iniciar el pago. Intenta de nuevo.')
      console.error('Stripe error:', err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleCheckout = isNative ? handleNativePurchase : handleStripeCheckout

  const handleStartTrial = async () => {
    setTrialLoading(true)
    try {
      const { error } = await startTrial()
      if (error) throw new Error(error)
      toast.success('🎉 ¡Tu prueba gratuita de 7 días ha comenzado!')
      onClose()
    } catch (err) {
      toast.error(err.message || 'No se pudo iniciar la prueba. Intenta de nuevo.')
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
              <p className="text-amber-300 text-sm">Control total de tus finanzas, sin límites</p>
            </div>
          </div>
          {isTrial && trialDaysRemaining > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-amber-300 text-sm font-medium">
              ⏳ Te quedan {trialDaysRemaining} día{trialDaysRemaining !== 1 ? 's' : ''} de prueba gratuita
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
              <p className="text-white font-bold text-lg">Premium Mensual</p>
              <p className="text-gray-400 text-xs">Cancela cuando quieras · Sin cargos ocultos</p>
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
            {checkoutLoading ? 'Procesando...' : 'Suscribirme — $6.99/mes'}
          </button>

          {/* Trial CTA */}
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
              {trialLoading ? 'Iniciando prueba...' : 'Probar 7 días gratis'}
            </button>
          )}

          {/* Restore purchases (native only) */}
          {isNative && (
            <button
              onClick={handleRestore}
              disabled={checkoutLoading}
              className="w-full text-gray-500 hover:text-gray-400 text-xs py-2 transition-all"
            >
              Restaurar compras
            </button>
          )}

          <p className="text-center text-gray-600 text-xs">
            {isNative ? 'Pago procesado por Google Play' : 'Pago seguro a través de Stripe'}
          </p>
        </div>
      </div>
    </div>
  )
}
