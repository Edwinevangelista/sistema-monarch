// src/hooks/usePlanesGuardados.js
// ✅ VERSIÓN CORREGIDA - Con refresh automático después de cada operación

import { useSupabaseData } from "./useSupabaseData";

export const usePlanesGuardados = (lazyLoad = false) => {
  const {
    data,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    refresh,
    initialize,
  } = useSupabaseData("planes_guardados", {
    lazyLoad,
    orderBy: "created_at",
    ascending: false,
    select: "*",
  });

  // Funciones auxiliares para filtrar planes
  const getPlanesActivos = () => {
    return data?.filter(p => p.activo && !p.completado) || [];
  };

  const getPlanesPorTipo = (tipo) => {
    return data?.filter(p => p.tipo === tipo && p.activo) || [];
  };

  // ✅ CORREGIDO: Agregar plan Y refrescar inmediatamente
  const addPlan = async (planData) => {
    console.log('💾 Guardando plan:', planData.nombre);
    const result = await addRecord(planData);
    console.log('✅ Plan guardado, refrescando...');
    await refresh(); // ✅ Refrescar inmediatamente
    console.log('🔄 Lista actualizada');
    return result;
  };

  // ✅ CORREGIDO: Marcar como completado Y refrescar
  const marcarComoCompletado = async (planId) => {
    console.log('🏁 Marcando plan como completado:', planId);
    await updateRecord(planId, {
      completado: true,
      activo: false,
      progreso: 100
    });
    await refresh(); // ✅ Refrescar inmediatamente
    console.log('✅ Plan completado y lista actualizada');
  };

  // ✅ CORREGIDO: Actualizar progreso Y refrescar
  const actualizarProgreso = async (planId, nuevoProgreso, montoActual) => {
    console.log('📊 Actualizando progreso del plan:', planId);
    await updateRecord(planId, {
      progreso: Math.min(100, Math.max(0, nuevoProgreso)),
      monto_actual: montoActual
    });
    await refresh(); // ✅ Refrescar inmediatamente
    console.log('✅ Progreso actualizado');
  };

  // ✅ CORREGIDO: Eliminar Y refrescar
  const deletePlan = async (planId) => {
    console.log('🗑️ Eliminando plan:', planId);
    await deleteRecord(planId);
    await refresh(); // ✅ Refrescar inmediatamente
    console.log('✅ Plan eliminado y lista actualizada');
  };

  return {
    planes: data,
    planesActivos: getPlanesActivos(),
    loading,
    error,
    addPlan, // ✅ Versión mejorada
    updatePlan: updateRecord,
    deletePlan, // ✅ Versión mejorada
    marcarComoCompletado, // ✅ Versión mejorada
    actualizarProgreso, // ✅ Versión mejorada
    getPlanesPorTipo,
    refresh,
    initialize,
  };
};