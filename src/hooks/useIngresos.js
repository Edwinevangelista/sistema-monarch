import { useSupabaseData } from './useSupabaseData'

export const useIngresos = (lazyLoad = false) => {
  const { data, loading, addRecord, updateRecord, deleteRecord, refresh, initialize } = useSupabaseData(
    'ingresos',
    {
      lazyLoad,
      orderBy: 'fecha',
      ascending: false,
      select: '*'  // ✅ Traer todas las columnas
    }
  )

  return {
    ingresos: data,
    loading,
    addIngreso: addRecord,
    updateIngreso: updateRecord,
    deleteIngreso: deleteRecord,
    refresh,
    initialize
  }
}