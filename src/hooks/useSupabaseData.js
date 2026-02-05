// src/hooks/useSupabaseData.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase' // Asegúrate de usar el archivo correcto

/**
 * Hook genérico optimizado para cargar datos de Supabase con caché
 * CORREGIDO: Se eliminó la dependencia de 'getCurrentUserId' fantasma
 */
export const useSupabaseData = (
  tableName, 
  { 
    lazyLoad = false,
    cacheDuration = 5 * 60 * 1000,
    orderBy = 'created_at',
    ascending = false,
    limit = 100,
    select = '*'
  } = {}
) => {
  const CACHE_KEY = `${tableName}_cache`
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(!lazyLoad)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState(null)

  // Función auxiliar REAL para obtener el usuario
  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Usuario no autenticado");
    return user;
  };

  // Cargar desde caché
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached)
        const isValid = Date.now() - timestamp < cacheDuration
        
        if (isValid && cachedData) {
          setData(cachedData)
          return true
        }
      }
    } catch (e) {
      console.error(`Error loading ${tableName} cache:`, e)
    }
    return false
  }, [CACHE_KEY, cacheDuration, tableName])

  // Guardar en caché
  const saveToCache = useCallback((newData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.error(`Error saving ${tableName} cache:`, e)
    }
  }, [CACHE_KEY, tableName])

  // Fetch data from Supabase
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && loadFromCache()) {
      setLoading(false)
      setInitialized(true)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const user = await getCurrentUser(); // USO CORRECTO
      
      let query = supabase
        .from(tableName)
        .select(select)
        .eq('user_id', user.id) // USO DE USER.ID
      
      if (orderBy) {
        query = query.order(orderBy, { ascending })
      }
      
      if (limit) {
        query = query.limit(limit)
      }
      
      const { data: fetchedData, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      if (fetchedData) {
        setData(fetchedData)
        saveToCache(fetchedData)
      }
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err)
      setError(err)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [tableName, select, orderBy, ascending, limit, loadFromCache, saveToCache])

  // Auto-load on mount (unless lazy)
  useEffect(() => {
    if (!lazyLoad && !initialized) {
      fetchData()
    }
  }, [lazyLoad, initialized, fetchData])

  // Add new record
  const addRecord = useCallback(async (newRecord) => {
    try {
      const user = await getCurrentUser(); // USO CORRECTO
      
      // Nota: Si newRecord ya viene con user_id, se usa ese. Si no, se inyecta.
      const payload = {
        ...newRecord,
        user_id: newRecord.user_id || user.id
      }

      const { data: insertedData, error: insertError } = await supabase
        .from(tableName)
        .insert([payload])
        .select()
      
      if (insertError) throw insertError
      
      if (insertedData) {
        const updatedData = [insertedData[0], ...data]
        setData(updatedData)
        saveToCache(updatedData)
        return { success: true, data: insertedData }
      }
    } catch (err) {
      console.error(`Error adding to ${tableName}:`, err)
      return { success: false, error: err }
    }
  }, [tableName, data, saveToCache])

// Update record
const updateRecord = useCallback(async (id, updates) => {
  try {
    console.log(`🔄 Actualizando ${tableName} ID:`, id)
    console.log('📝 Updates:', updates)

    const { data: updatedData, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Dato actualizado en BD:', updatedData)

    // ✅ FIX: Asegurar que estamos usando el dato correcto
    const newData = data.map(item => {
      if (item.id === id) {
        // Retornar el dato actualizado de la BD, no mezclar con el anterior
        return updatedData
      }
      return item
    });

    console.log('📊 Nuevo array de datos:', newData)

    setData(newData);
    saveToCache(newData);

    return { success: true, data: updatedData };
  } catch (err) {
    console.error(`❌ Error updating ${tableName}:`, err);
    return { success: false, error: err };
  }
}, [tableName, data, saveToCache]);


  // Delete record
  const deleteRecord = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      const newData = data.filter(item => item.id !== id)
      setData(newData)
      saveToCache(newData)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting from ${tableName}:`, err)
      return { success: false, error: err }
    }
  }, [tableName, data, saveToCache])

  // Initialize (for lazy loading)
  const initialize = useCallback(() => {
    if (!initialized) {
      fetchData()
    }
  }, [initialized, fetchData])

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
  }, [CACHE_KEY])

  return {
    data,
    loading,
    error,
    initialized,
    addRecord,
    updateRecord,
    deleteRecord,
    refresh: () => fetchData(true),
    initialize,
    clearCache
  }
}