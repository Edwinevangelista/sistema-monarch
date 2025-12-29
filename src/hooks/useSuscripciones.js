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
      .order('proximo_pago', { ascending: true })
    
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
      .insert([{ 
        ...nuevaSub,
        user_id: userId 
      }])
      .select()
    
    if (!error && data) {
      setSuscripciones([...suscripciones, ...data])
      return { success: true, data }
    }
    return { success: false, error }
  }

  return { suscripciones, loading, addSuscripcion, refresh: fetchSuscripciones }
}
