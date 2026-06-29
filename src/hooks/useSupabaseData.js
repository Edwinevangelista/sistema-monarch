// src/hooks/useSupabaseData.js
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

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
    select = '*',
    filters = []
  } = {}
) => {
  const filtersKey = JSON.stringify(filters)
  const CACHE_KEY = `${tableName}_${filtersKey}_cache`
  const activeFilters = useMemo(() => JSON.parse(filtersKey), [filtersKey])
  
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

        // Solo usar cache si tiene datos reales (array vacío = cache corrupto, ir a Supabase)
        if (isValid && Array.isArray(cachedData) && cachedData.length > 0) {
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

      activeFilters.forEach(({ column, operator = 'eq', value }) => {
        if (value !== undefined && value !== null && typeof query[operator] === 'function') {
          query = query[operator](column, value)
        }
      })
      
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
  }, [tableName, select, orderBy, ascending, limit, activeFilters, loadFromCache, saveToCache])

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
      
      const payload = {
        ...newRecord,
        user_id: user.id
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
      if (err?.code === '23505' && newRecord?.idempotency_key) {
        return { success: true, duplicate: true, data: [] }
      }
      console.error(`Error adding to ${tableName}:`, err)
      return { success: false, error: err }
    }
  }, [tableName, data, saveToCache])

  // Update record
  const updateRecord = useCallback(async (id, updates) => {
    try {
      const user = await getCurrentUser();
      const { data: updatedData, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const newData = data.map(item =>
        item.id === id ? updatedData : item
      );

      setData(newData);
      saveToCache(newData);

      return { success: true, data: updatedData };
    } catch (err) {
      console.error(`Error updating ${tableName}:`, err);
      return { success: false, error: err };
    }
  }, [tableName, data, saveToCache]);


  // Delete record
  const deleteRecord = useCallback(async (id) => {
    try {
      const user = await getCurrentUser();
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
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
