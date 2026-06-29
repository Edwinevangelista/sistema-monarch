// src/components/SpendingControlModal.jsx
// 🧠 Coach Inteligente de Control de Gastos v4 (Real-World Logic Edition)
// Integración de Safe-to-Spend, Suelos Vitales y Detección de Crisis Estructural
// Correcciones de compilación aplicadas.

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X, AlertTriangle, Save,
  ChevronDown, ChevronUp, CheckCircle2,
  Target, Brain, Flame, Shield, Zap,
  ArrowRight, Eye, Sparkles,
  BarChart3, Wallet, Star, Trophy,
  Play, PiggyBank, TrendingDown // Iconos restaurados para evitar errores de compilación
} from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

// ═══════════════════════════════════════════════════
// 🎨 CONSTANTES Y UTILIDADES
// ═══════════════════════════════════════════════════

const fmt = (v) => `$${Math.round(Number(v || 0)).toLocaleString('en-US')}`;
const pct = (v) => `${(Number(v || 0)).toFixed(1)}%`;

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Configuración mejorada con límites de recorte realistas (Floor)
const CATEGORIA_ICONOS = {
  '🏠 Vivienda': { color: 'blue', esencial: true, recortableMax: 0.05, etiqueta: 'Fijo' }, // Max 5% (renegociar)
  '🍔 Comida': { color: 'orange', esencial: true, recortableMax: 0.15, etiqueta: 'Variable' }, // Max 15% (cocinar)
  '🚗 Transporte': { color: 'cyan', esencial: true, recortableMax: 0.20, etiqueta: 'Variable' },
  '💊 Salud': { color: 'red', esencial: true, recortableMax: 0.00, etiqueta: 'Fijo' }, // No recortable
  '📱 Servicios': { color: 'indigo', esencial: true, recortableMax: 0.10, etiqueta: 'Fijo' },
  '🎭 Entretenimiento': { color: 'purple', esencial: false, recortableMax: 0.80, etiqueta: 'Deseo' },
  '👕 Ropa': { color: 'pink', esencial: false, recortableMax: 0.90, etiqueta: 'Deseo' },
  '📅 Suscripciones': { color: 'violet', esencial: false, recortableMax: 0.50, etiqueta: 'Fijo' },
  '🎓 Educación': { color: 'emerald', esencial: true, recortableMax: 0.00, etiqueta: 'Inversión' },
  '🛍️ Compras': { color: 'amber', esencial: false, recortableMax: 0.70, etiqueta: 'Deseo' },
  '📦 Otros': { color: 'gray', esencial: false, recortableMax: 0.60, etiqueta: 'Deseo' },
  '☕ Cafés/Snacks': { color: 'yellow', esencial: false, recortableMax: 0.90, etiqueta: 'Hormiga' },
  '🍕 Delivery': { color: 'rose', esencial: false, recortableMax: 0.85, etiqueta: 'Hormiga' },
};

const getColorClasses = (color) => {
  const map = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', bar: 'bg-orange-500' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', bar: 'bg-cyan-500' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500' },
    indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30', bar: 'bg-indigo-500' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', bar: 'bg-purple-500' },
    pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', bar: 'bg-pink-500' },
    violet: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', bar: 'bg-violet-500' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500' },
    gray: { bg: 'bg-gray-500/20', text: 'text-ink-faint', border: 'border-gray-500/30', bar: 'bg-gray-500' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-500' },
    rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', bar: 'bg-rose-500' },
  };
  return map[color] || map.gray;
};

// PASOS DEL COACH
const PASOS_COACH = [
  { key: 'diagnostico', label: 'Diagnóstico', emoji: '🔍', desc: 'Tu realidad financiera' },
  { key: 'presupuesto', label: 'Plan', emoji: '📋', desc: 'Ajustes viables' },
  { key: 'retos', label: 'Retos', emoji: '🎯', desc: 'Acciones prácticas' },
  { key: 'guardar', label: 'Guardar', emoji: '💾', desc: 'Activa tu plan' },
];

// ═══════════════════════════════════════════════════
// 🧠 MOTOR DE INTELIGENCIA V4 (Logic Upgrade)
// ═══════════════════════════════════════════════════

function useMotorInteligencia({ gastosFijos, gastosVariables, suscripciones, kpis, calculosReales, calculosProyectados }) {
  return useMemo(() => {
    const hoy = new Date();
    const diaDelMes = hoy.getDate();
    const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diasTranscurridos = Math.max(1, diaDelMes);
    const diasRestantes = diasEnMes - diaDelMes;

    // ── 0. INGRESO INTELIGENTE ──
    const ingresosReal = Number(calculosReales?.totalIngresos) || Number(kpis?.totalIngresos) || 0;
    const ingresosProyectado = Number(calculosProyectados?.totalIngresos) || 0;
    const ingresosSospechosamenteBajos = ingresosProyectado > 0 && ingresosReal < (ingresosProyectado * 0.20);
    const totalIngresos = ingresosSospechosamenteBajos ? ingresosProyectado : (ingresosReal || ingresosProyectado);
    const usandoProyeccion = ingresosSospechosamenteBajos;

    // ── 1. TOTALES ──
    const totalGastosFijos = gastosFijos.reduce((s, g) => s + (Number(g.monto) || 0), 0);
    const totalGastosVariables = gastosVariables.reduce((s, g) => s + (Number(g.monto) || 0), 0);
    const totalSuscripciones = suscripciones
      .filter(s => s.estado === 'Activo')
      .reduce((s, sub) => {
        const c = Number(sub.costo) || 0;
        if (sub.ciclo === 'Anual') return s + (c / 12);
        if (sub.ciclo === 'Semanal') return s + (c * 4.33);
        return s + c;
      }, 0);
    const totalGastos = totalGastosFijos + totalGastosVariables + totalSuscripciones;

    // ── 2. LÓGICA REAL: LÍMITE SEGURO (Safe-to-Spend) ──
    // ¿Cuánto me queda REALMENTE para gastar hoy?
    const comprometidoFijo = totalGastosFijos + totalSuscripciones;
    const saldoLibreReal = Math.max(0, totalIngresos - comprometidoFijo);
    const limiteSeguroDiario = diasRestantes > 0 ? saldoLibreReal / diasRestantes : 0;

    // Velocidad actual vs Realidad
    const velocidadDiaria = totalGastosVariables / diasTranscurridos;
    const margenDiario = velocidadDiaria - limiteSeguroDiario;

    // Semaforización basada en Realidad
    let semaforoVelocidad = 'verde';
    // CORRECCIÓN AQUÍ: usar velocidadDiaria en plural, no 'velocidadDiario'
    if (velocidadDiaria > (totalIngresos * 0.05)) semaforoVelocidad = 'rojo'; 
    else if (margenDiario > 0) semaforoVelocidad = 'amarillo';

    // ── 3. DÉFICIT ESTRUCTURAL ──
    // Si los fijos consumen todo el ingreso, recortar cafes no sirve.
    const ratioGastosFijos = totalIngresos > 0 ? comprometidoFijo / totalIngresos : 1;
    const esDeficitEstructural = ratioGastosFijos > 0.75; // 75% o más en fijos

    // ── 4. PATRONES POR DÍA ──
    const gastosPorDiaArr = [0, 0, 0, 0, 0, 0, 0];
    gastosVariables.forEach(g => {
      if (!g.fecha) return;
      const fecha = new Date(g.fecha + 'T00:00:00');
      gastosPorDiaArr[fecha.getDay()] += Number(g.monto) || 0;
    });
    const maxPromDia = Math.max(...gastosPorDiaArr);
    const diaPico = gastosPorDiaArr.indexOf(maxPromDia);

    // ── 5. CATEGORÍAS CON PISO VITAL (Floor) ──
    const categoriasMap = {};
    [...gastosFijos, ...gastosVariables].forEach(g => {
      const cat = g.categoria || '📦 Otros';
      if (!categoriasMap[cat]) categoriasMap[cat] = { total: 0, items: [], esencial: false, tipo: 'fijo' };
      categoriasMap[cat].total += Number(g.monto) || 0;
      categoriasMap[cat].items.push(g);
    });

    const categorias = Object.entries(categoriasMap)
      .map(([nombre, data]) => {
        const config = CATEGORIA_ICONOS[nombre] || { color: 'gray', esencial: false, recortableMax: 0.50 };
        
        // Lógica de Sugerencia con Suelo Vital
        let factorReduccion = config.esencial ? 0 : 0.1; 
        if (!config.esencial) {
           factorReduccion = data.total > 5000 ? 0.20 : 0.15; 
        }
        
        const presupuestoMinimo = data.total * (1 - config.recortableMax); 
        let presupuestoSugerido = data.total * (1 - factorReduccion);
        
        // Forzar el suelo sugerido
        presupuestoSugerido = Math.max(presupuestoMinimo, presupuestoSugerido);

        return {
          nombre,
          ...data,
          ...config,
          presupuestoMinimo, 
          presupuestoSugerido,
          ahorroPotencial: Math.max(0, data.total - presupuestoSugerido),
          colorClasses: getColorClasses(config.color),
        };
      })
      .sort((a, b) => b.total - a.total);

    const totalAhorroPotencial = categorias.reduce((s, c) => s + c.ahorroPotencial, 0);

    // ── 6. GASTOS HORMIGA ──
    const gastosHormiga = gastosVariables.filter(g => (Number(g.monto) || 0) < 100);
    const totalHormiga = gastosHormiga.reduce((s, g) => s + (Number(g.monto) || 0), 0);

    // ── 7. DIAGNÓSTICO DE URGENCIA ──
    let nivelUrgencia = 'bajo';
    let mensajeCoach = '';
    let emojiCoach = '😊';
    
    if (esDeficitEstructural) {
      nivelUrgencia = 'critico_estructural';
      mensajeCoach = `Tus gastos fijos consumen el ${pct(ratioGastosFijos * 100)} de tu ingreso. Recortar gastos pequeños no es suficiente.`;
      emojiCoach = '🏗️'; 
    } else if (velocidadDiaria > limiteSeguroDiario && limiteSeguroDiario > 0) {
      nivelUrgencia = 'alto';
      mensajeCoach = `Gastas ${fmt(velocidadDiaria)}/día, pero solo puedes permitirte ${fmt(limiteSeguroDiario)}/día.`;
      emojiCoach = '⚠️';
    } else if (totalGastos > totalIngresos) {
      nivelUrgencia = 'critico';
      mensajeCoach = `Déficit de ${fmt(totalGastos - totalIngresos)}. Acción inmediata requerida.`;
      emojiCoach = '🚨';
    } else {
      mensajeCoach = `Tienes un superávit proyectado de ${fmt(totalIngresos - totalGastos)}. Buen control.`;
      emojiCoach = '✅';
    }

    // ── 8. GENERAR RETOS REALISTAS ──
    const retos = generarRetosRealistas({
      nivelUrgencia,
      esDeficitEstructural,
      categorias,
      limiteSeguroDiario,
      velocidadDiaria,
      diasRestantes,
      totalSuscripciones,
      suscripciones,
      totalIngresos,
      DIAS_SEMANA,
      diaPico,
      totalHormiga,
      gastosHormiga
    });

    // ── 9. PROYECCIÓN FIN DE MES ──
    const gastoProyectadoVariable = velocidadDiaria * diasEnMes;
    const gastoProyectadoTotal = totalGastosFijos + gastoProyectadoVariable + totalSuscripciones;

    // ── 10. DATOS 50/30/20 (Para compatibilidad UI) ──
    const presupuestoIdeal = { necesidades: totalIngresos * 0.50, deseos: totalIngresos * 0.30, ahorro: totalIngresos * 0.20 };
    const gastosNecesidades = categorias.filter(c => c.esencial).reduce((s, c) => s + c.total, 0);
    const gastosDeseos = categorias.filter(c => !c.esencial).reduce((s, c) => s + c.total, 0) + totalSuscripciones;
    const presupuestoReal = { necesidades: gastosNecesidades, deseos: gastosDeseos, ahorro: Math.max(0, totalIngresos - totalGastos) };

    return {
      totalIngresos, totalGastos, totalGastosFijos, totalGastosVariables, totalSuscripciones,
      usandoProyeccion,
      velocidadDiaria, 
      limiteSeguroDiario, 
      margenDiario, 
      semaforoVelocidad,
      gastoProyectadoTotal,
      diaDelMes, diasEnMes, diasTranscurridos, diasRestantes,
      gastosPorDia: gastosPorDiaArr, diaPico, maxPromDia,
      categorias, totalAhorroPotencial,
      gastosHormiga, totalHormiga, frecuenciaHormiga: gastosHormiga.length,
      nivelUrgencia, mensajeCoach, emojiCoach,
      retos,
      presupuestoIdeal, presupuestoReal,
      proyeccionFinMes: {
        gastosEstimados: gastoProyectadoTotal,
        saldoEstimado: totalIngresos - gastoProyectadoTotal,
        enRiesgo: gastoProyectadoTotal > totalIngresos,
        exceso: Math.max(0, gastoProyectadoTotal - totalIngresos),
        diasParaCorregir: diasRestantes,
        reduccionDiariaRequerida: diasRestantes > 0 ? Math.max(0, (gastoProyectadoTotal - totalIngresos) / diasRestantes) : 0,
      },
      ratioGasto: totalIngresos > 0 ? totalGastos / totalIngresos : 1,
      esDeficitEstructural, 
    };
  }, [gastosFijos, gastosVariables, suscripciones, kpis, calculosReales, calculosProyectados]);
}

// ── GENERADOR DE RETOS REALISTAS ──
function generarRetosRealistas({ nivelUrgencia, esDeficitEstructural, categorias, limiteSeguroDiario, velocidadDiaria, diasRestantes, totalSuscripciones, suscripciones, totalIngresos, DIAS_SEMANA, diaPico, totalHormiga, gastosHormiga }) {
  const retos = [];

  // 1. Prioridad: Ingresos (Estructural)
  if (esDeficitEstructural) {
    retos.push({
      id: 'ingresos_extra',
      emoji: '💼',
      titulo: 'Plan Ingresos Urgente',
      descripcion: 'Tus fijos son muy altos para tu ingreso.',
      meta: 'Vende algo innecesario o busca 1 extra este fin de semana',
      impacto: 'Variable',
      dificultad: 'alta',
      tipo: 'única',
      pasos: ['Revisa ropa o electrónica para vender', 'Ofrece servicios freelance por una hora', 'Considera renta temporal de espacio']
    });
  }

  // 2. Prioridad: Velocidad (Control Diario)
  if (velocidadDiaria > limiteSeguroDiario && limiteSeguroDiario > 0 && !esDeficitEstructural) {
    const reduccion = velocidadDiaria - limiteSeguroDiario;
    retos.push({
      id: 'tope_diario',
      emoji: '🛑',
      titulo: 'Tope Diario Efectivo',
      descripcion: `Tu límite real es ${fmt(limiteSeguroDiario)}/día.`,
      meta: `Retira solo ${fmt(limiteSeguroDiario)} en efectivo cada mañana`,
      impacto: fmt(reduccion * diasRestantes),
      dificultad: 'media',
      tipo: 'diario',
      pasos: ['Deja la tarjeta en casa', 'Usa el efectivo solo para comida y transporte', 'Si se acaba, problemas resueltos']
    });
  }

  // 3. Delivery (Alto impacto común)
  const catDelivery = categorias.find(c => c.nombre.includes('Delivery'));
  if (catDelivery && catDelivery.total > 0) {
    retos.push({
      id: 'detox_delivery',
      emoji: '👨‍🍳',
      titulo: 'Detox de Delivery',
      descripcion: `Gastas ${fmt(catDelivery.total)} en apps de comida.`,
      meta: 'Cocina una olla grande este domingo (Meal Prep)',
      impacto: fmt(catDelivery.total * 0.6),
      dificultad: 'media',
      tipo: 'semanal',
      pasos: ['Compra ingredientes el domingo', 'Cocina estofado/pasta para 3 días', 'Borra temporalmente las apps de comida']
    });
  }

  // 4. Suscripciones
  const subsActivas = suscripciones.filter(s => s.estado === 'Activo');
  if (subsActivas.length >= 2 && totalSuscripciones > totalIngresos * 0.03) {
    retos.push({
      id: 'cancela_1',
      emoji: '✂️',
      titulo: 'La Regla del 1',
      descripcion: `${subsActivas.length} suscripciones activas.`,
      meta: 'Cancela la que menos usaste el mes pasado',
      impacto: fmt(totalSuscripciones / subsActivas),
      dificultad: 'baja',
      tipo: 'única',
      pasos: ['Revisa historial de uso', 'Cancela al menos 1 hoy', 'Busca alternativas gratuitas']
    });
  }

  // 5. Gastos Hormiga
  if (totalHormiga > 200 && gastosHormiga.length > 5) {
    retos.push({
      id: 'hormiga_realista',
      emoji: '🐜',
      titulo: 'Frena los Pequeños',
      descripcion: `${gastosHormiga.length} compras < $100 suman ${fmt(totalHormiga)}.`,
      meta: 'Aplica la regla de las 24h para compras < $200',
      impacto: fmt(totalHormiga * 0.4),
      dificultad: 'baja',
      tipo: 'semanal',
      pasos: ['Si lo quieres, espera 24h antes de comprar', 'Lleva lista de compras al super', 'Evita pasillos de tentación']
    });
  }
  
  // 6. Día Pico
  if (diaPico >= 0) {
     retos.push({
      id: 'dia_pico',
      emoji: '📅',
      titulo: `Domina los ${DIAS_SEMANA[diaPico]}`,
      descripcion: `Tus gastos más altos son los ${DIAS_SEMANA[diaPico]}.`,
      meta: `Este ${DIAS_SEMANA[diaPico]} no gastes nada fuera de lo planeado`,
      impacto: 'Variable',
      dificultad: 'media',
      tipo: 'semanal',
      pasos: [`Planifica el ${DIAS_SEMANA[diaPico]} el día anterior`, `Lleva solo el efectivo necesario`, `Evita apps de delivery ese día`]
    });
  }

  // 7. Plan de Choque (Urgencia)
  if (nivelUrgencia === 'critico' && !esDeficitEstructural) {
    const exceso = categorias.reduce((s,c) => s+c.total, 0) - totalIngresos;
    retos.unshift({
      id: 'choque_real',
      emoji: '🚨',
      titulo: 'Modo Supervivencia 7 Días',
      descripcion: 'Déficit inminente. Congela gastos.',
      meta: `Reduce ${fmt(exceso / 4)} esta semana`,
      impacto: fmt(exceso),
      dificultad: 'alta',
      tipo: 'urgente',
      pasos: ['🔴 Congela gastos no esenciales', '🔴 Solo alimentos básicos', '🔴 Cancela suscripciones temporales']
    });
  }

  return retos;
}

// ═══════════════════════════════════════════════════
// 🎯 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════

export default function SpendingControlModal({
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  kpis = {},
  calculosReales = null,
  calculosProyectados = null,
  onClose,
  onPlanGuardado,
  showLocalNotification,
}) {
  const [pasoActual, setPasoActual] = useState(0);
  const [showAnimacion, setShowAnimacion] = useState(true);
  const [presupuestosEditados, setPresupuestosEditados] = useState({});
  const [retosAceptados, setRetosAceptados] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);

  const { addPlan } = usePlanesGuardados();

  const motor = useMotorInteligencia({ gastosFijos, gastosVariables, suscripciones, kpis, calculosReales, calculosProyectados });

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimacion(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const irAPaso = useCallback((paso) => {
    setPasoActual(Math.max(0, Math.min(PASOS_COACH.length - 1, paso)));
  }, []);

  const editarPresupuesto = useCallback((catNombre, valor) => {
    const cat = motor.categorias.find(c => c.nombre === catNombre);
    if (cat) {
      const valorFinal = Math.max(cat.presupuestoMinimo, Number(valor) || 0);
      setPresupuestosEditados(prev => ({ ...prev, [catNombre]: valorFinal }));
    }
  }, [motor.categorias]);

  const toggleReto = useCallback((retoId) => {
    setRetosAceptados(prev => 
      prev.includes(retoId) ? prev.filter(r => r !== retoId) : [...prev, retoId]
    );
  }, []);

  const guardarPlan = useCallback(async (nombre) => {
    try {
      const presupuestos = motor.categorias.map(cat => ({
        categoria: cat.nombre,
        actual: cat.total,
        presupuesto: presupuestosEditados[cat.nombre] ?? cat.presupuestoSugerido,
        esencial: cat.esencial,
      }));

      const retosActivos = motor.retos.filter(r => retosAceptados.includes(r.id));

      await addPlan({
        tipo: 'gastos',
        nombre,
        descripcion: `Plan realista: ${motor.esDeficitEstructural ? 'Reestructuración' : 'Control de flujo'}`,
        configuracion: {
          presupuestos,
          retosActivos,
          limiteDiario: motor.limiteSeguroDiario,
          nivelUrgencia: motor.nivelUrgencia,
          proyeccion: motor.proyeccionFinMes,
          fechaCalculo: new Date().toISOString(),
        },
        meta_principal: 'Control de Gastos',
        monto_objetivo: presupuestos.reduce((s, p) => s + p.presupuesto, 0),
        monto_actual: motor.totalGastos,
        progreso: 0,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_objetivo: null,
        meses_duracion: 1,
        activo: true,
        completado: false,
      });

      if (showLocalNotification) showLocalNotification('✅ Plan guardado con éxito', 'success');
      if (onPlanGuardado) onPlanGuardado();
      onClose();
    } catch (error) {
      console.error('Error guardando plan:', error);
      if (showLocalNotification) showLocalNotification('Error al guardar', 'error');
    }
  }, [motor, presupuestosEditados, retosAceptados, addPlan, onClose, onPlanGuardado, showLocalNotification]);

  if (showAnimacion) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
        <div className="flex flex-col items-center gap-6 animate-pulse" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Brain className="w-12 h-12 text-white animate-bounce" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center animate-ping">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Analizando realidad...</h2>
            <p className="text-blue-300/70 text-sm">Calculando tu límite seguro diario</p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 w-full sm:max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-white/10">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Coach Financiero</h2>
                <p className="text-blue-300/60 text-[11px]">
                  {PASOS_COACH[pasoActual].emoji} {PASOS_COACH[pasoActual].desc}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-canvas-surface/10 rounded-full transition">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          <div className="flex px-4 pb-3 gap-1.5">
            {PASOS_COACH.map((paso, idx) => (
              <button
                key={paso.key}
                onClick={() => irAPaso(idx)}
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  idx <= pasoActual 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                    : 'bg-canvas-surface/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {pasoActual === 0 && <PasoDiagnostico motor={motor} />}
          {pasoActual === 1 && (
            <PasoPresupuesto 
              motor={motor} 
              presupuestosEditados={presupuestosEditados}
              onEditarPresupuesto={editarPresupuesto}
              expandedCat={expandedCat}
              onToggleCat={setExpandedCat}
            />
          )}
          {pasoActual === 2 && (
            <PasoRetos motor={motor} retosAceptados={retosAceptados} onToggleReto={toggleReto} />
          )}
          {pasoActual === 3 && (
            <PasoGuardar motor={motor} presupuestosEditados={presupuestosEditados} retosAceptados={retosAceptados} onGuardar={() => setShowConfirmacion(true)} />
          )}
        </div>

        <div className="flex-shrink-0 border-t border-white/10 p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex gap-3">
            {pasoActual > 0 && (
              <button onClick={() => irAPaso(pasoActual - 1)} className="px-5 py-3 bg-canvas-surface/10 hover:bg-canvas-surface/15 text-white rounded-xl font-semibold text-sm transition-all active:scale-95">
                Atrás
              </button>
            )}
            {pasoActual < PASOS_COACH.length - 1 ? (
              <button onClick={() => irAPaso(pasoActual + 1)} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                {pasoActual === 0 ? 'Ver Análisis' : 'Siguiente'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setShowConfirmacion(true)} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                <Save className="w-4 h-4" /> Activar Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfirmacion && (
        <ConfirmacionGuardado motor={motor} retosAceptados={retosAceptados} onConfirmar={guardarPlan} onCancelar={() => setShowConfirmacion(false)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 📊 PASO 1: DIAGNÓSTICO (Real-World Data)
// ═══════════════════════════════════════════════════

function PasoDiagnostico({ motor }) {
  const {
    totalGastos, velocidadDiaria, limiteSeguroDiario, margenDiario,
    semaforoVelocidad, diasRestantes, diaDelMes, diasEnMes,
    gastosPorDia, diaPico, maxPromDia,
    mensajeCoach, emojiCoach,
    proyeccionFinMes, categorias, totalHormiga, frecuenciaHormiga,
    totalGastosFijos, totalGastosVariables, totalSuscripciones,
    usandoProyeccion, esDeficitEstructural
  } = motor;

  const semaforoColors = {
    verde: { bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Controlado' },
    amarillo: { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Cuidado' },
    rojo: { bg: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', text: 'text-red-400', label: 'Peligro' },
  };
  const sem = semaforoColors[semaforoVelocidad];

  return (
    <div className="p-4 space-y-4">
      
      {/* Coach Message */}
      <div className={`bg-gradient-to-br ${sem.bg} border ${sem.border} rounded-2xl p-4`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{emojiCoach}</span>
          <div className="flex-1">
            <p className="text-white text-sm font-medium leading-relaxed">{mensajeCoach}</p>
            {esDeficitEstructural && (
              <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <p className="text-red-300 text-xs">
                  ⚠️ Déficit Estructural: Tus gastos fijos son muy altos para tu ingreso actual.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sem.bg} ${sem.text} border ${sem.border}`}>
                <Flame className="w-3 h-3" />
                Estado: {sem.label}
              </div>
              {usandoProyeccion && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  📊 Ingresos: proyección
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Velocímetro Realista */}
      <div className="bg-canvas-surface/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sem.bg} flex items-center justify-center`}>
            <Zap className={`w-4 h-4 ${sem.text}`} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Límite Diario Seguro</h4>
            <p className="text-ink-faint text-[11px]">Día {diaDelMes} de {diasEnMes} · {diasRestantes} días restantes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-canvas-surface/5 rounded-xl p-3">
            <div className="text-[10px] text-ink-faint uppercase mb-1">Gastas ahora</div>
            <div className={`text-xl font-bold ${semaforoVelocidad === 'verde' ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(velocidadDiaria)}<span className="text-xs text-ink-faint">/día</span></div>
          </div>
          <div className="bg-canvas-surface/5 rounded-xl p-3">
            <div className="text-[10px] text-ink-faint uppercase mb-1">Máximo permitido</div>
            <div className="text-xl font-bold text-blue-400">{fmt(limiteSeguroDiario)}<span className="text-xs text-ink-faint">/día</span></div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
          {margenDiario > 0 ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          )}
          <p className="text-xs text-gray-300">
            {margenDiario > 0 
              ? `Excedes tu límite por ${fmt(margenDiario)} diarios. Reduce gastos variables.` 
              : `Vas dentro del límite. Tienes un colchón de seguridad.`}
          </p>
        </div>
      </div>

      {/* Proyección Fin de Mes */}
      <div className={`rounded-2xl p-4 border ${
        proyeccionFinMes.enRiesgo 
          ? 'bg-red-500/10 border-red-500/20' 
          : 'bg-emerald-500/10 border-emerald-500/20'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-white/70" />
          <h4 className="text-white font-bold text-sm">Cierre de Mes Estimado</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-ink-faint uppercase">Gasto Total</div>
            <div className={`text-lg font-bold ${proyeccionFinMes.enRiesgo ? 'text-red-400' : 'text-white'}`}>
              {fmt(proyeccionFinMes.gastosEstimados)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-ink-faint uppercase">Resultado</div>
            <div className={`text-lg font-bold ${proyeccionFinMes.saldoEstimado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmt(proyeccionFinMes.saldoEstimado)}
            </div>
          </div>
        </div>
        {proyeccionFinMes.enRiesgo && proyeccionFinMes.reduccionDiariaRequerida > 0 && (
          <div className="mt-3 bg-black/20 rounded-lg p-2">
            <p className="text-red-300 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Reduce {fmt(proyeccionFinMes.reduccionDiariaRequerida)}/día para no exceder tus ingresos
            </p>
          </div>
        )}
      </div>

      {/* Patrón Semanal */}
      <div className="bg-canvas-surface/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          Tu Patrón Semanal
        </h4>
        <div className="flex items-end gap-1.5 h-20 mb-2">
          {gastosPorDia.map((prom, idx) => {
            const altura = maxPromDia > 0 ? (prom / maxPromDia) * 100 : 0;
            const esPico = idx === diaPico;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: '100%' }}>
                  <div 
                    className={`absolute bottom-0 w-full rounded-t-md transition-all ${
                      esPico ? 'bg-red-500' : 'bg-purple-500/50'
                    }`}
                    style={{ height: `${Math.max(4, altura)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          {DIAS_SEMANA.map((dia, idx) => (
            <div key={idx} className={`flex-1 text-center text-[9px] font-medium ${
              idx === diaPico ? 'text-red-400' : 'text-ink-muted'
            }`}>
              {dia}
            </div>
          ))}
        </div>
        <p className="text-ink-faint text-xs mt-3">
          📍 Los <span className="text-red-400 font-semibold">{DIAS_SEMANA[diaPico]}</span> gastas más. 
          Planifica esos días.
        </p>
      </div>

      {/* Distribución Rápida */}
      <div className="bg-canvas-surface/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Distribución de Flujo
        </h4>
        <div className="space-y-2">
          <DistBar label="Comprometido (Fijos/Subs)" monto={totalGastosFijos + totalSuscripciones} total={totalGastos} color="bg-blue-500" esCritico={esDeficitEstructural} />
          <DistBar label="Variables (Decisión Tuya)" monto={totalGastosVariables} total={totalGastos} color="bg-orange-500" esCritico={false} />
        </div>
        
        {frecuenciaHormiga > 5 && totalHormiga > 200 && (
          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
            <p className="text-amber-300 text-xs flex items-center gap-1.5">
              🐜 {frecuenciaHormiga} gastos hormiga (&lt;$100) suman {fmt(totalHormiga)}
            </p>
          </div>
        )}
      </div>

      {/* Top Categorías */}
      <div className="bg-canvas-surface/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3">Top Categorías</h4>
        <div className="space-y-2">
          {categorias.slice(0, 5).map((cat, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${cat.esencial ? 'bg-blue-500/5' : 'bg-canvas-surface/5'}`}>
              <span className="text-lg">{cat.nombre.split(' ')[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-white text-xs font-semibold truncate">{cat.nombre.split(' ').slice(1).join(' ')}</span>
                  <span className="text-white text-xs font-bold">{fmt(cat.total)}</span>
                </div>
                <div className="h-1.5 bg-canvas-surface/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cat.colorClasses.bar}`} style={{ width: `${cat.porcentaje}%` }} />
                </div>
              </div>
              <span className="text-ink-faint text-[10px] w-8 text-right">{pct(cat.porcentaje)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 📋 PASO 2: PRESUPUESTO INTELIGENTE (Con Floors)
// ═══════════════════════════════════════════════════

function PasoPresupuesto({ motor, presupuestosEditados, onEditarPresupuesto, expandedCat, onToggleCat }) {
  const { categorias, totalIngresos, totalGastos, presupuestoIdeal, presupuestoReal, totalAhorroPotencial } = motor;

  const totalPresupuestado = categorias.reduce((s, c) => 
    s + (presupuestosEditados[c.nombre] ?? c.presupuestoSugerido), 0
  );
  const reduccionGasto = Math.max(0, totalGastos - totalPresupuestado);

  return (
    <div className="p-4 space-y-4">
      
      <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-white text-sm font-medium flex items-start gap-2">
          <Brain className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            He establecido <strong>suelos vitales</strong> (mínimos) en categorías esenciales. 
            {totalAhorroPotencial > 0 
              ? ` Puedes reducir ${fmt(totalAhorroPotencial)}/mes ajustando deseos.` 
              : ' Tus gastos están bien distribuidos.'
            }
          </span>
        </p>
      </div>

      <div className="bg-canvas-surface/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Regla 50/30/20 (Tu Realidad)
        </h4>
        <div className="space-y-3">
          <ReglaBar label="Necesidades" emoji="🏠" ideal={presupuestoIdeal.necesidades} real={presupuestoReal.necesidades} total={totalIngresos} color="bg-blue-500" idealPct="50%" />
          <ReglaBar label="Deseos" emoji="🎭" ideal={presupuestoIdeal.deseos} real={presupuestoReal.deseos} total={totalIngresos} color="bg-purple-500" idealPct="30%" />
          <ReglaBar label="Ahorro" emoji="💰" ideal={presupuestoIdeal.ahorro} real={presupuestoReal.ahorro} total={totalIngresos} color="bg-emerald-500" idealPct="20%" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-canvas-surface/5 rounded-xl p-3 text-center">
          <div className="text-[10px] text-ink-faint uppercase">Gasto Actual</div>
          <div className="text-base font-bold text-red-400">{fmt(totalGastos)}</div>
        </div>
        <div className="bg-canvas-surface/5 rounded-xl p-3 text-center">
          <div className="text-[10px] text-ink-faint uppercase">Con Plan</div>
          <div className="text-base font-bold text-blue-400">{fmt(totalPresupuestado)}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <div className="text-[10px] text-emerald-300 uppercase">Reduces</div>
          <div className="text-base font-bold text-emerald-400">{fmt(reduccionGasto)}</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-white font-bold text-sm flex items-center gap-2">
          <Wallet className="w-4 h-4 text-orange-400" />
          Presupuesto por Categoría
          <span className="text-[10px] text-ink-faint font-normal">(toca para ajustar)</span>
        </h4>

        {categorias.map((cat) => {
          const presupuesto = presupuestosEditados[cat.nombre] ?? cat.presupuestoSugerido;
          const isExpanded = expandedCat === cat.nombre;
          const excede = cat.total > presupuesto;
          
          return (
            <div key={cat.nombre} className={`rounded-xl border overflow-hidden transition-all ${
              isExpanded ? 'bg-canvas-surface/10 border-white/20' : 'bg-canvas-surface/5 border-white/10'
            }`}>
              <button
                onClick={() => onToggleCat(isExpanded ? null : cat.nombre)}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                <span className="text-lg">{cat.nombre.split(' ')[0]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xs font-semibold truncate">{cat.nombre.split(' ').slice(1).join(' ')}</span>
                    {cat.esencial && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/20">Esencial</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${excede ? 'text-red-400' : 'text-white'}`}>{fmt(cat.total)}</span>
                    <ArrowRight className="w-3 h-3 text-ink-muted" />
                    <span className="text-xs font-bold text-emerald-400">{fmt(presupuesto)}</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-ink-faint" /> : <ChevronDown className="w-4 h-4 text-ink-faint" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-ink-faint mb-1">
                      <span>Nuevo Presupuesto</span>
                      <span>{fmt(presupuesto)}</span>
                    </div>
                    {/* Input Range con Suelo (Floor) */}
                    <input
                      type="range"
                      min={cat.presupuestoMinimo}
                      max={Math.round(cat.total * 1.5)}
                      step={10}
                      value={presupuesto}
                      onChange={(e) => onEditarPresupuesto(cat.nombre, e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
                      style={{ background: `linear-gradient(to right, #3b82f6 ${((presupuesto - cat.presupuestoMinimo) / (cat.total * 1.5 - cat.presupuestoMinimo)) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                    />
                    <div className="flex justify-between text-[9px] text-ink-muted mt-1">
                      <span className={presupuesto <= cat.presupuestoMinimo ? 'text-red-400' : ''}>{fmt(cat.presupuestoMinimo)} (Mín)</span>
                      <span className="text-blue-400">Ideal: {fmt(cat.presupuestoSugerido)}</span>
                      <span>{fmt(cat.total * 1.5)}</span>
                    </div>
                  </div>

                  {cat.esencial && presupuesto <= cat.presupuestoMinimo && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded">
                       <AlertTriangle className="w-3 h-3" />
                       <span>Has llegado al límite vital de seguridad.</span>
                    </div>
                  )}

                  <div>
                    <div className="h-2 bg-canvas-surface/10 rounded-full overflow-hidden relative">
                      <div className={`h-full rounded-full transition-all ${excede ? 'bg-red-500' : cat.colorClasses.bar}`} style={{ width: `${Math.min(100, (cat.total / (presupuesto || 1)) * 100)}%` }} />
                      <div className="absolute top-0 h-full w-0.5 bg-canvas-surface/50" style={{ left: '100%' }} />
                    </div>
                    <p className="text-ink-faint text-[10px] mt-1">
                      {excede 
                        ? `⚠️ Excedes el presupuesto por ${fmt(cat.total - presupuesto)}`
                        : `✅ Dentro del presupuesto (${pct((cat.total / presupuesto) * 100)} usado)`
                      }
                    </p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {cat.items.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] py-1 border-b border-white/5">
                        <span className="text-gray-300 truncate flex-1">{item.descripcion || item.nombre || 'Gasto'}</span>
                        <span className="text-white font-semibold ml-2">{fmt(item.monto)}</span>
                      </div>
                    ))}
                    {cat.items.length > 5 && <p className="text-ink-muted text-[10px]">+{cat.items.length - 5} más</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🎯 PASO 3: RETOS Y ACCIONES
// ═══════════════════════════════════════════════════

function PasoRetos({ motor, retosAceptados, onToggleReto }) {
  const { retos } = motor;

  if (retos.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-16">
        <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">¡Excelente Control!</h3>
        <p className="text-ink-faint text-sm text-center max-w-xs">
          No detecté áreas urgentes que mejorar. Tu flujo es saludable.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
        <p className="text-white text-sm font-medium flex items-start gap-2">
          <Target className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Diseñé {retos.length} acciones prácticas. 
            Acepta los que puedas cumplir — es mejor 1 reto cumplido que 5 ignorados.
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between bg-canvas-surface/5 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-semibold">Retos aceptados</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{retosAceptados.length}</span>
          <span className="text-ink-faint text-sm">/ {retos.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {retos.map((reto) => (
          <RetoCard key={reto.id} reto={reto} aceptado={retosAceptados.includes(reto.id)} onToggle={() => onToggleReto(reto.id)} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 💾 PASO 4: RESUMEN Y GUARDAR
// ═══════════════════════════════════════════════════

function PasoGuardar({ motor, presupuestosEditados, retosAceptados }) {
  const { categorias, totalGastos, totalIngresos, retos, usandoProyeccion, esDeficitEstructural } = motor;
  
  const totalPresupuestado = categorias.reduce((s, c) => 
    s + (presupuestosEditados[c.nombre] ?? c.presupuestoSugerido), 0
  );
  const reduccionGasto = Math.max(0, totalGastos - totalPresupuestado);
  const saldoConPlan = totalIngresos - totalPresupuestado;
  const retosActivos = retos.filter(r => retosAceptados.includes(r.id));

  return (
    <div className="p-4 space-y-4">
      {/* Coach */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-4">
        <p className="text-white text-sm font-medium flex items-start gap-2">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            {esDeficitEstructural
              ? 'Este plan establece disciplina mientras reestructuras tus ingresos.'
              : retosActivos.length > 0
                ? `¡Excelente! Aceptaste ${retosActivos.length} reto${retosActivos.length > 1 ? 's' : ''}. Con tu plan, reduces ${fmt(reduccionGasto)}/mes.`
                : reduccionGasto > 0
                  ? `Tu plan reduce tus gastos en ${fmt(reduccionGasto)}/mes. Guárdalo para hacer seguimiento.`
                  : `Los presupuestos sugeridos están alineados a tus gastos actuales.`
            }
            {usandoProyeccion && (
              <span className="block text-[10px] text-emerald-300/60 mt-1">
                ℹ️ Ingresos basados en proyección mensual
              </span>
            )}
          </span>
        </p>
      </div>

      {/* Resumen Visual */}
      <div className="bg-canvas-surface/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h4 className="text-white font-bold text-sm mb-3">Tu Plan en un Vistazo</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-[10px] text-ink-faint uppercase mb-1">Gastas Hoy</div>
              <div className="text-xl font-bold text-red-400">{fmt(totalGastos)}</div>
              {totalIngresos > 0 && (
                <div className="text-[10px] text-ink-muted">{pct((totalGastos / totalIngresos) * 100)} de ingresos</div>
              )}
            </div>
            <div className="text-center">
              <div className="text-[10px] text-emerald-300 uppercase mb-1">Con Plan</div>
              <div className="text-xl font-bold text-emerald-400">{fmt(totalPresupuestado)}</div>
              {totalIngresos > 0 && (
                <div className="text-[10px] text-emerald-300/50">{pct((totalPresupuestado / totalIngresos) * 100)} de ingresos</div>
              )}
            </div>
          </div>

          {/* Reducción de gasto */}
          {reduccionGasto > 0 ? (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="text-[10px] text-emerald-300 uppercase">Reduces en gastos</div>
              <div className="text-2xl font-bold text-emerald-400">{fmt(reduccionGasto)}<span className="text-sm">/mes</span></div>
              <div className="text-emerald-300/60 text-xs">{fmt(reduccionGasto * 12)} menos al año</div>
            </div>
          ) : (
            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <div className="text-[10px] text-amber-300 uppercase">Sin reducción aún</div>
              <div className="text-sm text-amber-200">Ajusta categorías en el paso anterior</div>
            </div>
          )}

          {/* Saldo resultante */}
          {totalIngresos > 0 && (
            <div className={`mt-2 rounded-xl p-3 text-center ${
              saldoConPlan >= 0 ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className="text-[10px] text-ink-faint uppercase">Saldo disponible con plan</div>
              <div className={`text-lg font-bold ${saldoConPlan >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {fmt(saldoConPlan)}
              </div>
              {saldoConPlan < 0 && (
                <div className="text-[10px] text-red-300/70">Aún necesitas reducir más o aumentar ingresos</div>
              )}
            </div>
          )}
        </div>

        {/* Retos Aceptados */}
        {retosActivos.length > 0 && (
          <div className="p-4 border-b border-white/10">
            <h5 className="text-white font-semibold text-xs mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              Retos Activos ({retosActivos.length})
            </h5>
            <div className="space-y-1.5">
              {retosActivos.map(reto => (
                <div key={reto.id} className="flex items-center gap-2 text-xs">
                  <span>{reto.emoji}</span>
                  <span className="text-white">{reto.titulo}</span>
                  <span className="text-emerald-400 ml-auto text-[10px]">{reto.impacto}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorías Ajustadas */}
        {categorias.filter(c => presupuestosEditados[c.nombre] && presupuestosEditados[c.nombre] !== c.presupuestoSugerido).length > 0 && (
          <div className="p-4">
            <h5 className="text-white font-semibold text-xs mb-2 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-orange-400" />
              Presupuestos Personalizados
            </h5>
            <div className="space-y-1.5">
              {categorias.map(cat => {
                const pres = presupuestosEditados[cat.nombre];
                if (pres && pres !== cat.presupuestoSugerido) {
                  return (
                    <div key={cat.nombre} className="flex items-center gap-2 text-xs">
                      <span>{cat.nombre.split(' ')[0]}</span>
                      <span className="text-ink-faint line-through">{fmt(cat.total)}</span>
                      <ArrowRight className="w-3 h-3 text-ink-muted" />
                      <span className="text-emerald-400 font-semibold">{fmt(pres)}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Proyección */}
      {reduccionGasto > 0 && (
        <div className="bg-canvas-surface/5 border border-white/10 rounded-2xl p-4">
          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-purple-400" />
            Impacto a Futuro
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-canvas-surface/5 rounded-lg p-2 text-center">
              <div className="text-[9px] text-ink-faint uppercase">1 Mes</div>
              <div className="text-sm font-bold text-emerald-400">{fmt(reduccionGasto)}</div>
            </div>
            <div className="bg-canvas-surface/5 rounded-lg p-2 text-center">
              <div className="text-[9px] text-ink-faint uppercase">6 Meses</div>
              <div className="text-sm font-bold text-blue-400">{fmt(reduccionGasto * 6)}</div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
              <div className="text-[9px] text-emerald-300 uppercase">1 Año</div>
              <div className="text-sm font-bold text-emerald-400">{fmt(reduccionGasto * 12)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🎯 RETO CARD
// ═══════════════════════════════════════════════════

function RetoCard({ reto, aceptado, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  const dificultadColors = {
    alta: 'bg-red-500/20 text-red-300 border-red-500/30',
    media: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    baja: 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
      aceptado ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-canvas-surface/5 border-white/10'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{reto.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h5 className="text-white font-bold text-sm">{reto.titulo}</h5>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border ${dificultadColors[reto.dificultad]}`}>{reto.dificultad}</span>
            </div>
            <p className="text-gray-300 text-xs mb-2">{reto.descripcion}</p>
            <div className="bg-canvas-surface/10 rounded-lg p-2 mb-2">
              <p className="text-white text-xs font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-orange-400" />
                {reto.meta}
              </p>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <PiggyBank className="w-3 h-3" /> Ahorras: {reto.impacto}/mes
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-orange-300 text-xs flex items-center gap-1 hover:text-orange-200 transition">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Ocultar' : 'Ver'} pasos
            </button>
            {expanded && (
              <div className="mt-2 space-y-1.5 pl-1">
                {reto.pasos.map((paso, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-orange-400 mt-0.5">→</span>
                    <span>{paso}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={onToggle} className={`w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
        aceptado ? 'bg-emerald-600/50 text-white hover:bg-emerald-600/40' : 'bg-canvas-surface/5 text-gray-300 hover:bg-canvas-surface/10'
      }`}>
        {aceptado ? (<><CheckCircle2 className="w-4 h-4" /> Reto Aceptado ✓</>) : (<><Play className="w-4 h-4" /> Aceptar Reto</>)}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🔧 COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════

function DistBar({ label, monto, total, color, esCritico }) {
  const pctVal = total > 0 ? (monto / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-faint">{label}</span>
        <span className={`${esCritico ? 'text-red-400' : 'text-white'} font-semibold`}>{fmt(monto)} ({pct(pctVal)})</span>
      </div>
      <div className="h-2 bg-canvas-surface/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${esCritico ? 'bg-red-500' : color}`} style={{ width: `${Math.min(100, pctVal)}%` }} />
      </div>
    </div>
  );
}

function ReglaBar({ label, emoji, ideal, real, total, color, idealPct }) {
  const realPct = total > 0 ? (real / total) * 100 : 0;
  const idealPctNum = total > 0 ? (ideal / total) * 100 : 0;
  const excede = real > ideal;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{emoji}</span>
          <span className="text-white text-xs font-semibold">{label}</span>
          <span className="text-[10px] text-ink-muted">({idealPct})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${excede ? 'text-red-400' : 'text-white'}`}>{fmt(real)}</span>
          <span className="text-ink-muted text-[10px]">/ {fmt(ideal)}</span>
        </div>
      </div>
      <div className="h-2.5 bg-canvas-surface/10 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full transition-all ${excede ? 'bg-red-500' : color}`} style={{ width: `${Math.min(100, realPct)}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-canvas-surface/50" style={{ left: `${idealPctNum}%` }} />
      </div>
    </div>
  );
}

function ConfirmacionGuardado({ motor, retosAceptados, onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const mesActual = new Date().toLocaleString('en-US', { month: 'long' });

  const handleGuardar = async () => {
    const finalNombre = nombre.trim() || `Plan ${mesActual} ${new Date().getFullYear()}`;
    setGuardando(true);
    await onConfirmar(finalNombre);
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={onCancelar}>
      <div className="bg-gradient-to-br from-emerald-900 to-green-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-emerald-500/30" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Save className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Activar Plan</h3>
          <p className="text-emerald-200/60 text-sm mt-1">Se guardará en tus planes activos</p>
        </div>
        <div className="mb-4">
          <label className="block text-emerald-200 text-sm mb-2 font-medium">Nombre del plan</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={`Plan ${mesActual} ${new Date().getFullYear()}`}
            className="w-full bg-canvas-surface/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 text-sm"
            autoFocus
          />
        </div>
        <div className="bg-canvas-surface/10 rounded-xl p-3 mb-5">
          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{motor.categorias.length} categorías presupuestadas</span>
          </div>
          {retosAceptados.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-200 mt-1">
              <Star className="w-4 h-4" />
              <span>{retosAceptados.length} retos activos</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 bg-canvas-surface/10 text-white py-3 rounded-xl font-semibold text-sm hover:bg-canvas-surface/20 transition">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando} className="flex-1 bg-canvas-surface text-emerald-900 py-3 rounded-xl font-bold text-sm hover:bg-canvas-surface disabled:opacity-50 transition flex items-center justify-center gap-2">
            {guardando ? (
              <><div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> Guardando</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Activar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}