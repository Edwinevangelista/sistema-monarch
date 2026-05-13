// src/hooks/useMetas.js
// CRUD para metas financieras — tabla `metas` en Supabase

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useMetas() {
  const [metas, setMetas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMetas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data, error: err } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('activa', true)
        .order('created_at', { ascending: false })

      if (err) throw err
      setMetas(data || [])
    } catch (e) {
      setError(e.message)
      console.error('useMetas fetch:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMetas() }, [fetchMetas])

  const addMeta = useCallback(async (metaData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('metas')
      .insert({ ...metaData, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setMetas(prev => [data, ...prev])
    return data
  }, [])

  const updateMeta = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('metas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setMetas(prev => prev.map(m => m.id === id ? data : m))
    return data
  }, [])

  const deleteMeta = useCallback(async (id) => {
    const { error } = await supabase
      .from('metas')
      .update({ activa: false })
      .eq('id', id)
    if (error) throw error
    setMetas(prev => prev.filter(m => m.id !== id))
  }, [])

  const abonarMeta = useCallback(async (id, monto) => {
    const meta = metas.find(m => m.id === id)
    if (!meta) throw new Error('Meta no encontrada')
    const nuevoMonto = Math.min(Number(meta.monto_actual || 0) + Number(monto), Number(meta.monto_objetivo))
    const completada = nuevoMonto >= Number(meta.monto_objetivo)
    return updateMeta(id, { monto_actual: nuevoMonto, completada })
  }, [metas, updateMeta])

  return { metas, loading, error, addMeta, updateMeta, deleteMeta, abonarMeta, refresh: fetchMetas }
}
