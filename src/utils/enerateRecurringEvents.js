// generateRecurringEvents.js - Generador de eventos recurrentes para el calendario

/**
 * Genera eventos recurrentes basados en la frecuencia de ingresos
 * @param {Array} ingresos - Array de ingresos con campo 'frecuencia'
 * @param {Date} mesActual - Mes para el cual generar los eventos
 * @returns {Array} Array de eventos para mostrar en el calendario
 */
export function generateRecurringIncomeEvents(ingresos, mesActual = new Date()) {
  const eventos = [];
  const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
  
  ingresos.forEach(ingreso => {
    if (!ingreso.frecuencia || ingreso.frecuencia === 'Único') {
      // Para ingresos únicos, solo mostrar si están en el mes actual
      const fechaIngreso = new Date(ingreso.fecha);
      if (fechaIngreso >= primerDia && fechaIngreso <= ultimoDia) {
        eventos.push({
          id: `ing-${ingreso.id}`,
          titulo: `💰 ${ingreso.fuente}`,
          monto: ingreso.monto,
          fecha: ingreso.fecha,
          tipo: 'ingreso',
          subtipo: 'real',
          descripcion: ingreso.descripcion || ingreso.fuente,
          original: ingreso
        });
      }
      return;
    }

    // GENERAR EVENTOS RECURRENTES
    const fechaBase = new Date(ingreso.fecha);
    const eventos_del_mes = [];

    if (ingreso.frecuencia === 'Semanal') {
      // Generar eventos semanales
      let fechaEvento = new Date(fechaBase);
      
      // Buscar el primer evento del mes
      while (fechaEvento < primerDia) {
        fechaEvento.setDate(fechaEvento.getDate() + 7);
      }
      
      // Generar todos los eventos semanales del mes
      while (fechaEvento <= ultimoDia) {
        eventos_del_mes.push({
          id: `ing-semanal-${ingreso.id}-${fechaEvento.toISOString().split('T')[0]}`,
          titulo: `💰 ${ingreso.fuente} (Semanal)`,
          monto: ingreso.monto,
          fecha: fechaEvento.toISOString().split('T')[0],
          tipo: 'ingreso',
          subtipo: 'proyectado',
          frecuencia: 'Semanal',
          descripcion: `${ingreso.fuente} - Proyección semanal`,
          original: ingreso
        });
        
        fechaEvento = new Date(fechaEvento);
        fechaEvento.setDate(fechaEvento.getDate() + 7);
      }
    }

    else if (ingreso.frecuencia === 'Quincenal') {
      // Generar eventos quincenales (días 1 y 15, o basado en fecha original)
      const diaOriginal = fechaBase.getDate();
      
      // Si el día original es <= 15, generar en día original y día original + 15
      if (diaOriginal <= 15) {
        // Primer pago del mes
        const fecha1 = new Date(mesActual.getFullYear(), mesActual.getMonth(), diaOriginal);
        if (fecha1 >= primerDia && fecha1 <= ultimoDia) {
          eventos_del_mes.push({
            id: `ing-quincenal-${ingreso.id}-1`,
            titulo: `💰 ${ingreso.fuente} (Quincenal)`,
            monto: ingreso.monto,
            fecha: fecha1.toISOString().split('T')[0],
            tipo: 'ingreso',
            subtipo: 'proyectado',
            frecuencia: 'Quincenal',
            descripcion: `${ingreso.fuente} - 1ª quincena`,
            original: ingreso
          });
        }
        
        // Segundo pago del mes
        const fecha2 = new Date(mesActual.getFullYear(), mesActual.getMonth(), Math.min(diaOriginal + 15, ultimoDia.getDate()));
        if (fecha2 >= primerDia && fecha2 <= ultimoDia) {
          eventos_del_mes.push({
            id: `ing-quincenal-${ingreso.id}-2`,
            titulo: `💰 ${ingreso.fuente} (Quincenal)`,
            monto: ingreso.monto,
            fecha: fecha2.toISOString().split('T')[0],
            tipo: 'ingreso',
            subtipo: 'proyectado',
            frecuencia: 'Quincenal',
            descripción: `${ingreso.fuente} - 2ª quincena`,
            original: ingreso
          });
        }
      } else {
        // Si el día original es > 15, generar en día original del mes anterior y actual
        const fechaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), Math.min(diaOriginal, ultimoDia.getDate()));
        if (fechaMes >= primerDia && fechaMes <= ultimoDia) {
          eventos_del_mes.push({
            id: `ing-quincenal-${ingreso.id}`,
            titulo: `💰 ${ingreso.fuente} (Quincenal)`,
            monto: ingreso.monto,
            fecha: fechaMes.toISOString().split('T')[0],
            tipo: 'ingreso',
            subtipo: 'proyectado',
            frecuencia: 'Quincenal',
            descripcion: `${ingreso.fuente} - Quincena`,
            original: ingreso
          });
        }
      }
    }

    else if (ingreso.frecuencia === 'Mensual') {
      // Generar evento mensual en el mismo día
      const diaOriginal = fechaBase.getDate();
      const fechaEvento = new Date(
        mesActual.getFullYear(), 
        mesActual.getMonth(), 
        Math.min(diaOriginal, ultimoDia.getDate()) // Ajustar si el mes no tiene suficientes días
      );
      
      if (fechaEvento >= primerDia && fechaEvento <= ultimoDia) {
        eventos_del_mes.push({
          id: `ing-mensual-${ingreso.id}`,
          titulo: `💰 ${ingreso.fuente} (Mensual)`,
          monto: ingreso.monto,
          fecha: fechaEvento.toISOString().split('T')[0],
          tipo: 'ingreso',
          subtipo: 'proyectado',
          frecuencia: 'Mensual',
          descripcion: `${ingreso.fuente} - Proyección mensual`,
          original: ingreso
        });
      }
    }

    eventos.push(...eventos_del_mes);
  });

  return eventos;
}

/**
 * Combina eventos reales y proyectados para el calendario
 * @param {Array} ingresos - Ingresos originales
 * @param {Array} gastosFijos - Gastos fijos
 * @param {Array} suscripciones - Suscripciones  
 * @param {Array} deudas - Deudas
 * @param {Array} gastos - Gastos variables
 * @param {Date} mesActual - Mes actual
 * @returns {Object} Eventos organizados por tipo
 */
export function generateAllCalendarEvents(ingresos, gastosFijos, suscripciones, deudas, gastos, mesActual = new Date()) {
  const eventosIngresos = generateRecurringIncomeEvents(ingresos, mesActual);
  
  // Convertir otros tipos de datos a eventos (mantener lógica existente)
  const eventosGastosFijos = gastosFijos.map(gf => ({
    id: `gf-${gf.id}`,
    titulo: `📋 ${gf.nombre}`,
    monto: gf.monto,
    fecha: gf.fecha_vencimiento || new Date(mesActual.getFullYear(), mesActual.getMonth(), gf.dia_venc || 1).toISOString().split('T')[0],
    tipo: 'gasto',
    subtipo: 'fijo',
    estado: gf.estado,
    original: gf
  }));

  const eventosSuscripciones = suscripciones.map(sub => ({
    id: `sub-${sub.id}`,
    titulo: `🔄 ${sub.servicio}`,
    monto: sub.costo,
    fecha: sub.proximo_pago,
    tipo: 'suscripcion',
    subtipo: 'recurrente',
    estado: sub.estado,
    original: sub
  }));

  const eventosDeudas = deudas.map(deuda => ({
    id: `deuda-${deuda.id}`,
    titulo: `💳 ${deuda.cuenta}`,
    monto: deuda.pago_minimo,
    fecha: deuda.vence,
    tipo: 'deuda',
    subtipo: 'pago',
    original: deuda
  }));

  return {
    ingresos: eventosIngresos,
    gastosFijos: eventosGastosFijos,
    suscripciones: eventosSuscripciones,
    deudas: eventosDeudas,
    todos: [...eventosIngresos, ...eventosGastosFijos, ...eventosSuscripciones, ...eventosDeudas]
  };
}