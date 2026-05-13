// src/hooks/usePresupuestoCategorias.js
// Sincroniza presupuestos por categoría con Supabase (perfiles.presupuesto_categorias)
// Con fallback a localStorage mientras carga o cuando Supabase no responde

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const LS_KEY = 'monarch_budget_by_cat'

function loadFromLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveToLS(b) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(b)) } catch {}
}

export function usePresupuestoCategorias() {
  const [budgets, setBudgets] = useState(loadFromLS)
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef(null)

  // ── Cargar desde Supabase al montar ───────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error } = await supabase
          .from('perfiles')
          .select('presupuesto_categorias')
          .eq('id', user.id)
          .single()

        if (!cancelled && !error && data?.presupuesto_categorias) {
          const remote = data.presupuesto_categorias
          // Merge: remote wins, but keep LS keys not in remote
          const merged = { ...loadFromLS(), ...remote }
          setBudgets(merged)
          saveToLS(merged)
        }
      } catch (e) {
        console.warn('usePresupuestoCategorias: no se pudo cargar desde Supabase', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Guardar en Supabase (debounced 800ms para evitar múltiples writes) ─
  const persistToSupabase = useCallback(async (newBudgets) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase
        .from('perfiles')
        .update({ presupuesto_categorias: newBudgets })
        .eq('id', user.id)
    } catch (e) {
      console.warn('usePresupuestoCategorias: no se pudo guardar en Supabase', e)
    }
  }, [])

  const setBudget = useCallback((cat, valor) => {
    setBudgets(prev => {
      const next = { ...prev, [cat]: valor }
      saveToLS(next)
      // Debounce Supabase write
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => persistToSupabase(next), 800)
      return next
    })
  }, [persistToSupabase])

  return { budgets, setBudget, loading }
}
