import { useState, useEffect } from 'react'
import { supabase, getCurrentUserId } from '../lib/supabase'

export const useIngresos = () => {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchIngresos = async () => {
    setLoading(true)
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('ingresos')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
    
    if (!error) setIngresos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchIngresos()
  }, [])

  const addIngreso = async (nuevoIngreso) => {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('ingresos')
      .insert([{ ...nuevoIngreso, user_id: userId }])
      .select()
    
    if (!error && data) {
      setIngresos([...data, ...ingresos])
      return { success: true, data }
    }
    return { success: false, error }
  }

  const updateIngreso = async (id, datosActualizados) => {
    const { data, error } = await supabase
      .from('ingresos')
      .update(datosActualizados)
      .eq('id', id)
      .select()
    
    if (!error && data) {
      setIngresos(ingresos.map(i => i.id === id ? data[0] : i))
      return { success: true, data }
    }
    return { success: false, error }
  }

  const deleteIngreso = async (id) => {
    const { error } = await supabase
      .from('ingresos')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setIngresos(ingresos.filter(i => i.id !== id))
      return { success: true }
    }
    return { success: false, error }
  }

  return { ingresos, loading, addIngreso, updateIngreso, deleteIngreso, refresh: fetchIngresos }
}
