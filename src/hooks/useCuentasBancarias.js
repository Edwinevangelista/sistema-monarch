// src/hooks/useCuentasBancarias.js
// ✅ Hook para gestionar cuentas bancarias

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCuentasBancarias() {
  const [cuentas, setCuentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const user = supabase.auth.getUser()

  // Cargar cuentas
  const fetchCuentas = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setCuentas([])
        return
      }

      const { data, error } = await supabase
        .from('cuentas_bancarias')
        .select('*')
        .eq('user_id', user.id)
        .order('nombre', { ascending: true })

      if (error) throw error
      
      setCuentas(data || [])
    } catch (err) {
      console.error('Error cargando cuentas:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Agregar cuenta
  const addCuenta = async (cuentaData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('cuentas_bancarias')
        .insert([{
          ...cuentaData,
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error
      
      await fetchCuentas()
      return data[0]
    } catch (err) {
      console.error('Error agregando cuenta:', err)
      throw err
    }
  }

  // Actualizar cuenta
  const updateCuenta = async (id, cuentaData) => {
    try {
      const { data, error } = await supabase
        .from('cuentas_bancarias')
        .update(cuentaData)
        .eq('id', id)
        .select()

      if (error) throw error
      
      await fetchCuentas()
      return data[0]
    } catch (err) {
      console.error('Error actualizando cuenta:', err)
      throw err
    }
  }

  // Eliminar cuenta
  const deleteCuenta = async (id) => {
    try {
      const { error } = await supabase
        .from('cuentas_bancarias')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchCuentas()
    } catch (err) {
      console.error('Error eliminando cuenta:', err)
      throw err
    }
  }

  // Actualizar balance
  const updateBalance = async (id, nuevoBalance) => {
    return updateCuenta(id, { balance: nuevoBalance })
  }

  useEffect(() => {
    fetchCuentas()
  }, [])

  return {
    cuentas,
    loading,
    error,
    addCuenta,
    updateCuenta,
    deleteCuenta,
    updateBalance,
    refresh: fetchCuentas
  }
}