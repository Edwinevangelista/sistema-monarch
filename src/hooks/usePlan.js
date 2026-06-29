import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getLimitesPlan } from '../config/limites'

const DEV_FORCE_PREMIUM = process.env.REACT_APP_FORCE_PREMIUM === 'true'

export function usePlan() {
  const [state, setState] = useState({ plan: DEV_FORCE_PREMIUM ? 'premium' : 'free', loading: true })

  const loadPlan = useCallback(async () => {
    if (DEV_FORCE_PREMIUM) {
      setState({ plan: 'premium', loading: false })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setState({ plan: 'free', loading: false })
      return
    }

    const { data, error } = await supabase
      .from('user_plan')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

    setState({
      plan: error ? 'free' : data?.plan || 'free',
      loading: false,
    })
  }, [])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  const limites = useMemo(() => getLimitesPlan(state.plan), [state.plan])
  const isPremium = state.plan === 'premium'

  const canUseFeature = useCallback((feature) => {
    return Boolean(limites?.[feature])
  }, [limites])

  const canAddMore = useCallback((type, currentCount) => {
    if (isPremium) return true
    const map = {
      cuentas: 'maxCuentas',
      cuenta: 'maxCuentas',
      tarjetas: 'maxTarjetas',
      deudas: 'maxTarjetas',
      tarjeta: 'maxTarjetas',
    }
    const limitKey = map[type]
    if (!limitKey) return true
    return currentCount < limites[limitKey]
  }, [isPremium, limites])

  const getLimit = useCallback((type) => {
    const map = {
      cuentas: 'maxCuentas',
      cuenta: 'maxCuentas',
      tarjetas: 'maxTarjetas',
      deudas: 'maxTarjetas',
      tarjeta: 'maxTarjetas',
    }
    return limites[map[type] || type] ?? null
  }, [limites])

  return {
    plan: state.plan,
    isPremium,
    isFree: !isPremium,
    loading: state.loading,
    limites,
    canUseFeature,
    canAddMore,
    getLimit,
    refresh: loadPlan,
    // Compatibilidad temporal con pantallas existentes; Stripe/trial se integran despues.
    isTrial: false,
    trialUsed: false,
    trialDaysRemaining: 0,
    startTrial: async () => ({ error: 'Trial no configurado' }),
  }
}
