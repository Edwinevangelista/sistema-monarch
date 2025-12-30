import { useState, useEffect } from 'react'
import { supabase, getCurrentUserId } from '../lib/supabase'

export const useSuscripciones = () => {
  const [suscripciones, setSuscripciones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSuscripciones = async () => {
    setLoading(true)
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('user_id', userId)
      .order('servicio', { ascending: true })
    
    if (!error) setSuscripciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSuscripciones()
  }, [])

  const addSuscripcion = async (nuevaSub) => {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('suscripciones')
      .insert([{ ...nuevaSub, user_id: userId }])
      .select()
    
    if (!error && data) {
      setSuscripciones([...suscripciones, ...data])
      return { success: true, data }
    }
    return { success: false, error }
  }

  const updateSuscripcion = async (id, datosActualizados) => {
    const { data, error } = await supabase
      .from('suscripciones')
      .update(datosActualizados)
      .eq('id', id)
      .select()
    
    if (!error && data) {
      setSuscripciones(suscripciones.map(s => s.id === id ? data[0] : s))
      return { success: true, data }
    }
    return { success: false, error }
  }

  const deleteSuscripcion = async (id) => {
    const { error } = await supabase
      .from('suscripciones')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setSuscripciones(suscripciones.filter(s => s.id !== id))
      return { success: true }
    }
    return { success: false, error }
  }

  return { 
    suscripciones, 
    loading, 
    addSuscripcion, 
    updateSuscripcion,
    deleteSuscripcion,
    refresh: fetchSuscripciones 
  }
}
