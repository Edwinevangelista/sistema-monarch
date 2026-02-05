import { useSupabaseData } from './useSupabaseData'

export const useGastosFijos = (lazyLoad = false) => {
  const { data, loading, addRecord, updateRecord, deleteRecord, refresh, initialize } = useSupabaseData(
    'gastos_fijos',
    {
      lazyLoad,
      orderBy: 'created_at',
      ascending: false,
      select: '*'  // ✅
    }
  )

  return {
    gastosFijos: data,
    loading,
    addGastoFijo: addRecord,
    updateGastoFijo: updateRecord,
    deleteGastoFijo: deleteRecord,
    refresh,
    initialize
  }
}