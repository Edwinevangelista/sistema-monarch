import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// ✅ FUNCIÓN PRINCIPAL (Exportación con Nombre para coincidir con import { })
export function useCuentasBancarias() {
  const [cuentas, setCuentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar cuentas
  const fetchCuentas = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setCuentas([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('cuentas_bancarias')
        .select('*')
        .eq('user_id', user.id)
        .order('nombre', { ascending: true })

      if (error) throw error
      
      console.log('✅ Cuentas cargadas:', data)
      setCuentas(data || [])
    } catch (err) {
      console.error('❌ Error cargando cuentas:', err)
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
      
      console.log('✅ Cuenta agregada:', data[0])
      await fetchCuentas()
      return data[0]
    } catch (err) {
      console.error('❌ Error agregando cuenta:', err)
      throw err
    }
  }

  // Actualizar cuenta
  const updateCuenta = async (id, cuentaData) => {
    try {
      console.log('🔄 Actualizando cuenta:', id, cuentaData)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      
      const { data, error } = await supabase
        .from('cuentas_bancarias')
        .update(cuentaData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()

      if (error) throw error
      
      console.log('✅ Cuenta actualizada en BD:', data[0])
      
      // ✅ Actualizar estado local INMEDIATAMENTE
      setCuentas(prevCuentas => 
        prevCuentas.map(cuenta => 
          cuenta.id === id 
            ? { ...cuenta, ...cuentaData } 
            : cuenta
        )
      )
      
      // ✅ También refrescar desde BD para estar seguros
      await fetchCuentas()
      
      return data[0]
    } catch (err) {
      console.error('❌ Error actualizando cuenta:', err)
      throw err
    }
  }

  // Eliminar cuenta
  const deleteCuenta = async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('cuentas_bancarias')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      console.log('✅ Cuenta eliminada:', id)
      await fetchCuentas()
    } catch (err) {
      console.error('❌ Error eliminando cuenta:', err)
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
// ✅ IMPORTANTE: NO DEJAR NINGÚN CÓDIGO DESPUÉS DE ESTA LLAVE }
