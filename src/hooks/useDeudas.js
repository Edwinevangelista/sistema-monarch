import { useSupabaseData } from "./useSupabaseData";

export const useDeudas = (lazyLoad = false) => {
  const {
    data,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refresh,
    initialize,
  } = useSupabaseData("deudas", {
    lazyLoad,
    orderBy: "created_at",
    ascending: false,
    select: "*",
  });

  return {
    deudas: data,
    loading,
    addDeuda: addRecord,
    updateDeuda: updateRecord,
    deleteDeuda: deleteRecord,
    refresh,
    initialize,
  };
};