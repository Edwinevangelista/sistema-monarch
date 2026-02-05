import { useSupabaseData } from "./useSupabaseData";

export const useSuscripciones = (lazyLoad = false) => {
  const {
    data,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refresh,
    initialize,
  } = useSupabaseData("suscripciones", {
    lazyLoad,
    orderBy: "created_at",
    ascending: false,
    select: "*",
  });

  return {
    suscripciones: data,
    loading,
    addSuscripcion: addRecord,
    updateSuscripcion: updateRecord,
    deleteSuscripcion: deleteRecord,
    refresh,
    initialize,
  };
};
