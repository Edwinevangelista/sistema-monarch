import { useState, useEffect } from 'react'
import { supabase, getCurrentUserId } from '../lib/supabase'

export const useGastosVariables = () => {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGastos = async () => {
    setLoading(true)
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('gastos_variables')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
    
    if (!error) setGastos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchGastos()
  }, [])

  const addGasto = async (nuevoGasto) => {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('gastos_variables')
      .insert([{ ...nuevoGasto, user_id: userId }])
      .select()
    
    if (!error && data) {
      setGastos([...data, ...gastos])
      return { success: true, data }
    }
    return { success: false, error }
  }

  const updateGasto = async (id, datosActualizados) => {
    const { data, error } = await supabase
      .from('gastos_variables')
      .update(datosActualizados)
      .eq('id', id)
      .select()
    
    if (!error && data) {
      setGastos(gastos.map(g => g.id === id ? data[0] : g))
      return { success: true, data }
    }
    return { success: false, error }
  }

  const deleteGasto = async (id) => {
    const { error } = await supabase
      .from('gastos_variables')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setGastos(gastos.filter(g => g.id !== id))
      return { success: true }
    }
    return { success: false, error }
  }

  return { gastos, loading, addGasto, updateGasto, deleteGasto, refresh: fetchGastos }
}
