import { useState, useEffect } from 'react'
import { supabase, getCurrentUserId } from '../lib/supabase'

export const usePagosTarjeta = () => {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPagos = async () => {
    setLoading(true)
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('pagos_tarjetas')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
    
    if (!error) setPagos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPagos()
  }, [])

  const addPago = async (nuevoPago) => {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('pagos_tarjetas')
      .insert([{ 
        ...nuevoPago,
        user_id: userId 
      }])
      .select()
    
    if (!error && data) {
      setPagos([...data, ...pagos])
      return { success: true, data }
    }
    return { success: false, error }
  }

  return { pagos, loading, addPago, refresh: fetchPagos }
}
