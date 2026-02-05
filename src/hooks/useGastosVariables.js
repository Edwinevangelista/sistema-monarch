import { useSupabaseData } from './useSupabaseData'

export const useGastosVariables = (lazyLoad = false) => {
  const { data, loading, addRecord, updateRecord, deleteRecord, refresh, initialize } = useSupabaseData(
    'gastos_variables',
    {
      lazyLoad,
      orderBy: 'fecha',
      ascending: false,
      select: '*'  // ✅ 
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