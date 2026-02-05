// src/hooks/useGastosVariables.js
export const useGastosVariables = (lazyLoad = false) => {
  const {
    data,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refresh,
    initialize,
  } = useSupabaseData("gastos", {
    lazyLoad,
    orderBy: "fecha",
    ascending: false,
    select: "*",
  });

  return {
    gastos: data,
    loading,

    addGasto: async (data) => {
      const res = await addRecord(data);
      return res ?? { success: true };
    },

    // ✅ AGREGAR ESTA FUNCIÓN SI NO EXISTE
    updateGasto: async (id, data) => {
      const res = await updateRecord(id, data);
      return res ?? { success: true };
    },

    deleteGasto: async (id) => {
      const res = await deleteRecord(id);
      return res ?? { success: true };
    },

    refresh,
    initialize,
  };
};