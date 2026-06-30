import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// Caché en memoria compartido entre instancias del hook: cada modal que
// abre useCuentasBancarias() reusa el mismo fetch reciente en vez de
// volver a pedir la tabla completa a Supabase cada vez que se monta.
const CACHE_TTL = 60 * 1000
let cuentasCache = null
let cuentasCacheTime = 0

// ✅ FUNCIÓN PRINCIPAL (Exportación con Nombre para coincidir con import { })
export function useCuentasBancarias() {
  const cacheIsFresh = Date.now() - cuentasCacheTime < CACHE_TTL
  const [cuentas, setCuentas] = useState(cacheIsFresh ? cuentasCache : [])
  const [loading, setLoading] = useState(!cacheIsFresh)
  const [error, setError] = useState(null)

  // Cargar cuentas
  const fetchCuentas = async (forceRefresh = false) => {
    if (!forceRefresh && Date.now() - cuentasCacheTime < CACHE_TTL && cuentasCache) {
      setCuentas(cuentasCache)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

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

      cuentasCache = data || []
      cuentasCacheTime = Date.now()
      setCuentas(cuentasCache)
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
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
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
      await fetchCuentas(true)
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
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
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
      await fetchCuentas(true)
      
      return data[0]
    } catch (err) {
      console.error('❌ Error actualizando cuenta:', err)
      throw err
    }
  }

  // Eliminar cuenta
  const deleteCuenta = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('cuentas_bancarias')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      console.log('✅ Cuenta eliminada:', id)
      await fetchCuentas(true)
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
