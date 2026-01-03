import { useSupabaseData } from "./useSupabaseData";

export const usePagosTarjeta = (lazyLoad = false) => {
  const {
    data,
    loading,
    addRecord,
    refresh,
    initialize,
  } = useSupabaseData("pagos_tarjetas", {
    lazyLoad,
    orderBy: "fecha",
    ascending: false,
    select: "*",
  });

  return {
    pagos: data,
    loading,
    addPago: addRecord,
    refresh,
    initialize,
  };
};
