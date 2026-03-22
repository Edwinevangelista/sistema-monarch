// src/hooks/usePlan.js
// Central hook for plan/subscription state management
// Reads from perfiles table: plan, plan_expires_at, trial_used, trial_ends_at

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const PLAN_LIMITS = {
  free: {
    gastos: 20,
    ingresos: 20,
    gastosFijos: 5,
    suscripciones: 3,
    deudas: 3,
    cuentas: 1,
  },
  trial: null,    // unlimited during trial
  premium: null,  // unlimited
}

export function usePlan() {
  const [planData, setPlanData] = useState({
    plan: 'free',         // 'free' | 'trial' | 'premium'
    planExpiresAt: null,  // ISO string or null
    trialUsed: false,
    trialEndsAt: null,
    loading: true,
  })

  const loadPlan = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setPlanData(p => ({ ...p, loading: false }))
      return
    }

    const { data, error } = await supabase
      .from('perfiles')
      .select('plan, plan_expires_at, trial_used, trial_ends_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !data) {
      setPlanData(p => ({ ...p, loading: false }))
      return
    }

    // Determine effective plan (check expiry)
    let effectivePlan = data.plan || 'free'
    const now = new Date()

    if (effectivePlan === 'premium' && data.plan_expires_at) {
      if (new Date(data.plan_expires_at) < now) effectivePlan = 'free'
    }
    if (effectivePlan === 'trial' && data.trial_ends_at) {
      if (new Date(data.trial_ends_at) < now) effectivePlan = 'free'
    }

    setPlanData({
      plan: effectivePlan,
      planExpiresAt: data.plan_expires_at,
      trialUsed: data.trial_used || false,
      trialEndsAt: data.trial_ends_at,
      loading: false,
    })
  }, [])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  const isPremium = planData.plan === 'premium' || planData.plan === 'trial'
  const isFree = planData.plan === 'free'
  const isTrial = planData.plan === 'trial'

  // Check if user can add more items of a given type
  const canAddMore = useCallback((type, currentCount) => {
    if (isPremium) return true
    const limit = PLAN_LIMITS.free[type]
    if (limit === null || limit === undefined) return true
    return currentCount < limit
  }, [isPremium])

  // Get the limit for a given type
  const getLimit = useCallback((type) => {
    if (isPremium) return null // unlimited
    return PLAN_LIMITS.free[type] ?? null
  }, [isPremium])

  // Start 7-day trial
  const startTrial = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    if (planData.trialUsed) return { error: 'Trial already used' }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const { error } = await supabase
      .from('perfiles')
      .update({
        plan: 'trial',
        trial_used: true,
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .eq('id', user.id)

    if (!error) await loadPlan()
    return { error }
  }, [planData.trialUsed, loadPlan])

  // Days remaining in trial
  const trialDaysRemaining = (() => {
    if (!isTrial || !planData.trialEndsAt) return 0
    const diff = new Date(planData.trialEndsAt) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })()

  return {
    ...planData,
    isPremium,
    isFree,
    isTrial,
    canAddMore,
    getLimit,
    startTrial,
    trialDaysRemaining,
    refresh: loadPlan,
  }
}
