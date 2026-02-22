import { useSupabaseData } from './useSupabaseData'

export const useGastosVariables = (lazyLoad = false) => {
  const { data, loading, addRecord, updateRecord, deleteRecord, refresh, initialize } = useSupabaseData(
    'gastos_variables',         // ✅ Tabla real BASE TABLE en Supabase (gastos_all es VIEW)
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