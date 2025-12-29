import { useState, useEffect } from 'react'
import { supabase, getCurrentUserId } from '../lib/supabase'

export const useDeudas = () => {
  const [deudas, setDeudas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDeudas = async () => {
    setLoading(true)
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('deudas')
      .select('*')
      .eq('user_id', userId)
      .order('vence', { ascending: true })
    
    if (!error) setDeudas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDeudas()
  }, [])

  const addDeuda = async (nuevaDeuda) => {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('deudas')
      .insert([{ 
        ...nuevaDeuda,
        user_id: userId 
      }])
      .select()
    
    if (!error && data) {
      setDeudas([...deudas, ...data])
      return { success: true, data }
    }
    return { success: false, error }
  }

  const updateSaldo = async (id, nuevoSaldo) => {
    const { data, error } = await supabase
      .from('deudas')
      .update({ saldo: nuevoSaldo })
      .eq('id', id)
      .select()
    
    if (!error && data) {
      setDeudas(deudas.map(d => d.id === id ? data[0] : d))
      return { success: true }
    }
    return { success: false, error }
  }

  return { deudas, loading, addDeuda, updateSaldo, refresh: fetchDeudas }
}
