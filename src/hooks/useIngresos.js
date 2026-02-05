import { useSupabaseData } from "./useSupabaseData";

export const useIngresos = (lazyLoad = false) => {
  const {
    data,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refresh,
    initialize,
  } = useSupabaseData("ingresos", {
    lazyLoad,
    orderBy: "fecha",
    ascending: false,
    select: "*",
  });

  return {
    ingresos: data,
    loading,

    addIngreso: async (data) => {
      const res = await addRecord(data);
      return res ?? { success: true };
    },

    updateIngreso: async (id, data) => {
      const res = await updateRecord(id, data);
      return res ?? { success: true };
    },

    deleteIngreso: async (id) => {
      const res = await deleteRecord(id);
      return res ?? { success: true };
    },

    refresh,
    initialize,
  };