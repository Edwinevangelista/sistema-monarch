// src/hooks/usePlanesGuardados.js
// Hook para gestionar planes financieros guardados (ahorro, deudas, gastos)

import { useSupabaseData } from "./useSupabaseData";
// ⚠️ IMPORTANTE: Asegúrate de que esta ruta sea donde tengas tu cliente de supabase
import { supabase } from "../lib/supabase"; 

export const usePlanesGuardados = (lazyLoad = false) => {
  const {
    data,
    loading,
    addRecord, // Guardamos la referencia a la función base
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

  // Funciones auxiliares para filtrar planes (Tu código original está bien)
  const getPlanesActivos = () => {
    return data?.filter(p => p.activo && !p.completado) || [];
  };

  const getPlanesPorTipo = (tipo) => {
    return data?.filter(p => p.tipo === tipo && p.activo) || [];
  };

  const marcarComoCompletado = async (planId) => {
    return await updateRecord(planId, {
      completado: true,
      activo: false,
      progreso: 100
    });
  };

  const actualizarProgreso = async (planId, nuevoProgreso, montoActual) => {
    return await updateRecord(planId, {
      progreso: Math.min(100, Math.max(0, nuevoProgreso)),
      monto_actual: montoActual
    });
  };

  // --- 🔧 MODIFICACIÓN PARA CORREGIR EL ERROR 403 ---
  // Sobrescribimos addPlan para inyectar el user_id automáticamente
 // ... dentro de src/hooks/usePlanesGuardados.js

  // --- 🔧 MODIFICACIÓN "ANTIDOTO" ---
  const addPlan = async (planData) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuario no autenticado.");
      }

      // 🔴 DETECTAR EL ID "FANTASMA"
      const MALDICION_ID = '550e8400-e29b-41d4-a716-446655440000';
      if (user.id === MALDICION_ID) {
        console.warn("⚠️ ID de prueba detectado. Limpiando sesión...");
        // Forzamos el cierre de sesión y recarga limpia
        await supabase.auth.signOut();
        alert("Se detectó una sesión de prueba antigua. Recargando la aplicación...");
        window.location.reload(); // Recarga la página completamente
        return; 
      }

      const payloadConUsuario = {
        ...planData,
        user_id: user.id
      };

      return await addRecord(payloadConUsuario);

    } catch (error) {
      console.error("Error al intentar guardar el plan:", error);
      throw error;
    }
  };
  // --------------------------------------------------

  return {
    planes: data,
    planesActivos: getPlanesActivos(),
    loading,
    addPlan: addPlan, // Usamos nuestra función mejorada en lugar de addRecord directo
    updatePlan: updateRecord,
    deletePlan: deleteRecord,
    marcarComoCompletado,
    actualizarProgreso,
    getPlanesPorTipo,
    refresh,
    initialize,
  };
};