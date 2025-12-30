import { useState, useEffect } from 'react'
import { supabase, getCurrentUserId } from '../lib/supabase'

export const useGastosFijos = () => {
  const [gastosFijos, setGastosFijos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGastosFijos = async () => {
    setLoading(true)
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('gastos_fijos')
      .select('*')
      .eq('user_id', userId)
      .order('dia_venc', { ascending: true })
    
    if (!error) setGastosFijos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchGastosFijos()
  }, [])

  const addGastoFijo = async (nuevoGasto) => {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('gastos_fijos')
      .insert([{ ...nuevoGasto, user_id: userId }])
      .select()
    
    if (!error && data) {
      setGastosFijos([...gastosFijos, ...data])
      return { success: true, data }
    }
    return { success: false, error }
  }

  const updateGastoFijo = async (id, datosActualizados) => {
    const { data, error } = await supabase
      .from('gastos_fijos')
      .update(datosActualizados)
      .eq('id', id)
      .select()
    
    if (!error && data) {
      setGastosFijos(gastosFijos.map(g => g.id === id ? data[0] : g))
      return { success: true, data }
    }
    return { success: false, error }
  }

  const updateEstado = async (id, nuevoEstado) => {
    return updateGastoFijo(id, { estado: nuevoEstado })
  }

  const deleteGastoFijo = async (id) => {
    const { error } = await supabase
      .from('gastos_fijos')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setGastosFijos(gastosFijos.filter(g => g.id !== id))
      return { success: true }
    }
    return { success: false, error }
  }

  return { 
    gastosFijos, 
    loading, 
    addGastoFijo, 
    updateGastoFijo,
    updateEstado, 
    deleteGastoFijo,
    refresh: fetchGastosFijos 
  }
}
