import { useSupabaseData } from './useSupabaseData'

export const useGastosVariables = (lazyLoad = false) => {
  const { data, loading, addRecord, updateRecord, deleteRecord, refresh, initialize } = useSupabaseData(
    'gastos_all',               // ✅ Nombre real de la tabla en Supabase
    {
      lazyLoad,
      orderBy: 'fecha',
      ascending: false,
      select: '*',
      limit: 500,               // ✅ Aumentado para no perder registros recientes
      cacheDuration: 60 * 1000  // ✅ Cache de 1 min para datos frescos
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