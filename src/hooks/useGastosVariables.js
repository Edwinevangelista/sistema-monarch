import { useSupabaseData } from './useSupabaseData'
import { useMemo } from 'react'
import { usePlan } from './usePlan'

export const useGastosVariables = (lazyLoad = false) => {
  const { limites } = usePlan()
  const filters = useMemo(() => {
    if (!Number.isFinite(limites.mesesHistorial)) return []
    const hoy = new Date()
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - limites.mesesHistorial + 1, 1)
    const fechaDesde = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, '0')}-${String(desde.getDate()).padStart(2, '0')}`
    return [{ column: 'fecha', operator: 'gte', value: fechaDesde }]
  }, [limites.mesesHistorial])

  const { data, loading, addRecord, updateRecord, deleteRecord, refresh, initialize } = useSupabaseData(
    'gastos_variables',         // ✅ Tabla real BASE TABLE en Supabase (gastos_all es VIEW)
    {
      lazyLoad,
      orderBy: 'fecha',
      ascending: false,
      select: '*',
      limit: 500,               // ✅ Aumentado para no perder registros recientes
      cacheDuration: 60 * 1000, // ✅ Cache de 1 min para datos frescos
      filters,
    }
  )

  return {
    gastos: data,
    loading,
    addGasto: addRecord,
    updateGasto: updateRecord,
    deleteGasto: deleteRecord,
    refresh,
    initialize
  }
}
