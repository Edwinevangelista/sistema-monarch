// src/components/SpendingControlModal.jsx
// 🧠 Coach Inteligente de Control de Gastos v3
// Motor de análisis + Presupuestos adaptativos + Retos semanales + Plan guiado

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X, TrendingDown, AlertTriangle, Zap, Save,
  ChevronDown, ChevronUp, CheckCircle2,
  Target, Brain, Flame, Shield, Calendar,
  ArrowRight, PiggyBank, Eye, Sparkles,
  BarChart3, Wallet, Star, Trophy,
  Play
} from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

// ═══════════════════════════════════════════════════
// 🎨 CONSTANTES Y UTILIDADES
// ═══════════════════════════════════════════════════

const fmt = (v) => `$${Math.round(Number(v || 0)).toLocaleString('es-MX')}`;
const pct = (v) => `${(Number(v || 0)).toFixed(1)}%`;

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CATEGORIA_ICONOS = {
  '🏠 Vivienda': { color: 'blue', esencial: true },
  '🍔 Comida': { color: 'orange', esencial: true },
  '🚗 Transporte': { color: 'cyan', esencial: true },
  '💊 Salud': { color: 'red', esencial: true },
  '📱 Servicios': { color: 'indigo', esencial: true },
  '🎭 Entretenimiento': { color: 'purple', esencial: false },
  '👕 Ropa': { color: 'pink', esencial: false },
  '📅 Suscripciones': { color: 'violet', esencial: false },
  '🎓 Educación': { color: 'emerald', esencial: true },
  '🛍️ Compras': { color: 'amber', esencial: false },
  '📦 Otros': { color: 'gray', esencial: false },
  '☕ Cafés/Snacks': { color: 'yellow', esencial: false },
  '🍕 Delivery': { color: 'rose', esencial: false },
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
    gray: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', bar: 'bg-gray-500' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-500' },
    rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', bar: 'bg-rose-500' },
  };
  return map[color] || map.gray;
};

// PASOS DEL COACH
const PASOS_COACH = [
  { key: 'diagnostico', label: 'Diagnóstico', emoji: '🔍', desc: 'Escaneando tus gastos' },
  { key: 'presupuesto', label: 'Plan', emoji: '📋', desc: 'Tu presupuesto inteligente' },
  { key: 'retos', label: 'Retos', emoji: '🎯', desc: 'Acciones concretas' },
  { key: 'guardar', label: 'Guardar', emoji: '💾', desc: 'Activa tu plan' },
];

// ═══════════════════════════════════════════════════
// 🧠 MOTOR DE INTELIGENCIA
// ═══════════════════════════════════════════════════

function useMotorInteligencia({ gastosFijos, gastosVariables, suscripciones, kpis }) {
  return useMemo(() => {
    const hoy = new Date();
    const diaDelMes = hoy.getDate();
    const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diasTranscurridos = Math.max(1, diaDelMes);
    const diasRestantes = diasEnMes - diaDelMes;
    const progresoMes = diaDelMes / diasEnMes;

    const totalIngresos = Number(kpis?.totalIngresos) || 0;

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

    // ── 2. VELOCIDAD DE GASTO ──
    const velocidadDiaria = totalGastosVariables / diasTranscurridos;
    const gastoProyectadoVariable = velocidadDiaria * diasEnMes;
    const gastoProyectadoTotal = totalGastosFijos + gastoProyectadoVariable + totalSuscripciones;
    
    // Velocidad ideal (para no exceder 60% de ingresos en variables)
    const presupuestoVariableIdeal = totalIngresos > 0 
      ? (totalIngresos * 0.30) // 30% para variables
      : totalGastosVariables * 0.7;
    const velocidadIdeal = presupuestoVariableIdeal / diasEnMes;
    const ratioVelocidad = velocidadIdeal > 0 ? velocidadDiaria / velocidadIdeal : 1;

    // Semáforo de velocidad
    let semaforoVelocidad = 'verde';
    if (ratioVelocidad > 1.5) semaforoVelocidad = 'rojo';
    else if (ratioVelocidad > 1.15) semaforoVelocidad = 'amarillo';

    // ── 3. PATRONES POR DÍA DE SEMANA ──
    const gastosPorDia = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
    const contadorPorDia = [0, 0, 0, 0, 0, 0, 0];
    
    gastosVariables.forEach(g => {
      if (!g.fecha) return;
      const fecha = new Date(g.fecha + 'T00:00:00');
      const dia = fecha.getDay();
      gastosPorDia[dia] += Number(g.monto) || 0;
      contadorPorDia[dia]++;
    });

    const promedioPorDia = gastosPorDia.map((total, i) => 
      contadorPorDia[i] > 0 ? total / contadorPorDia[i] : 0
    );
    
    const diaPico = promedioPorDia.indexOf(Math.max(...promedioPorDia));
    const diaBajo = promedioPorDia.indexOf(Math.min(...promedioPorDia.filter(v => v > 0)));
    const maxPromDia = Math.max(...promedioPorDia);

    // ── 4. PATRONES POR SEMANA DEL MES ──
    const gastosPorSemana = [0, 0, 0, 0, 0]; // semanas 1-5
    gastosVariables.forEach(g => {
      if (!g.fecha) return;
      const dia = new Date(g.fecha + 'T00:00:00').getDate();
      const semana = Math.min(4, Math.floor((dia - 1) / 7));
      gastosPorSemana[semana] += Number(g.monto) || 0;
    });
    const semanaActual = Math.min(4, Math.floor((diaDelMes - 1) / 7));

    // ── 5. CATEGORÍAS INTELIGENTES ──
    const categoriasMap = {};
    
    gastosFijos.forEach(g => {
      const cat = g.categoria || '📦 Otros';
      if (!categoriasMap[cat]) categoriasMap[cat] = { total: 0, items: [], tipo: 'fijo', transacciones: 0 };
      categoriasMap[cat].total += Number(g.monto) || 0;
      categoriasMap[cat].items.push(g);
      categoriasMap[cat].transacciones++;
    });

    gastosVariables.forEach(g => {
      const cat = g.categoria || '📦 Otros';
      if (!categoriasMap[cat]) categoriasMap[cat] = { total: 0, items: [], tipo: 'variable', transacciones: 0 };
      categoriasMap[cat].total += Number(g.monto) || 0;
      categoriasMap[cat].items.push(g);
      categoriasMap[cat].transacciones++;
    });

    const categorias = Object.entries(categoriasMap)
      .map(([nombre, data]) => {
        const info = CATEGORIA_ICONOS[nombre] || { color: 'gray', esencial: false };
        const porcentaje = totalGastos > 0 ? (data.total / totalGastos) * 100 : 0;
        const porcentajeIngreso = totalIngresos > 0 ? (data.total / totalIngresos) * 100 : 0;
        
        // Presupuesto sugerido por categoría
        let presupuestoSugerido;
        if (info.esencial) {
          // Esenciales: mantener pero optimizar 10%
          presupuestoSugerido = data.total * 0.90;
        } else {
          // No esenciales: reducir 25-40% según peso
          const factorReduccion = porcentaje > 20 ? 0.60 : porcentaje > 10 ? 0.75 : 0.85;
          presupuestoSugerido = data.total * factorReduccion;
        }

        // Velocidad dentro de la categoría (solo variables)
        const itemsVariable = data.items.filter(i => !gastosFijos.includes(i));
        const velocidadCat = itemsVariable.length > 0 
          ? itemsVariable.reduce((s, i) => s + (Number(i.monto) || 0), 0) / diasTranscurridos
          : 0;

        return {
          nombre,
          ...data,
          ...info,
          porcentaje,
          porcentajeIngreso,
          presupuestoSugerido,
          ahorroPotencial: Math.max(0, data.total - presupuestoSugerido),
          velocidadDiaria: velocidadCat,
          esCritica: porcentaje > 15,
          colorClasses: getColorClasses(info.color),
        };
      })
      .sort((a, b) => b.total - a.total);

    const totalAhorroPotencial = categorias.reduce((s, c) => s + c.ahorroPotencial, 0);

    // ── 6. DETECTOR DE GASTOS HORMIGA ──
    const gastosHormiga = gastosVariables
      .filter(g => (Number(g.monto) || 0) < 100)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const totalHormiga = gastosHormiga.reduce((s, g) => s + (Number(g.monto) || 0), 0);
    const frecuenciaHormiga = gastosHormiga.length;
    const promedioHormiga = frecuenciaHormiga > 0 ? totalHormiga / frecuenciaHormiga : 0;

    // ── 7. NIVEL DE URGENCIA ──
    let nivelUrgencia = 'bajo';
    let mensajeCoach = '';
    let emojiCoach = '😊';
    
    const ratioGasto = totalIngresos > 0 ? totalGastos / totalIngresos : 1;
    
    if (ratioGasto > 1) {
      nivelUrgencia = 'critico';
      mensajeCoach = `Estás gastando ${fmt(totalGastos - totalIngresos)} más de lo que ganas. Necesitamos un plan de choque inmediato.`;
      emojiCoach = '🚨';
    } else if (ratioGasto > 0.85) {
      nivelUrgencia = 'alto';
      mensajeCoach = `Solo te queda ${pct((1 - ratioGasto) * 100)} de margen. Un imprevisto te pondría en rojo.`;
      emojiCoach = '⚠️';
    } else if (ratioGasto > 0.70) {
      nivelUrgencia = 'medio';
      mensajeCoach = `Gastas ${pct(ratioGasto * 100)} de tus ingresos. Hay espacio para mejorar y crear un colchón.`;
      emojiCoach = '💡';
    } else {
      nivelUrgencia = 'bajo';
      mensajeCoach = `Buen control. Gastas ${pct(ratioGasto * 100)} de tus ingresos. Veamos cómo optimizar aún más.`;
      emojiCoach = '✅';
    }

    // ── 8. GENERAR RETOS SEMANALES ──
    const retos = generarRetos({
      nivelUrgencia,
      categorias,
      velocidadDiaria,
      velocidadIdeal,
      gastosHormiga,
      totalHormiga,
      diaPico,
      totalIngresos,
      totalGastos,
      totalSuscripciones,
      suscripciones,
      diasRestantes,
    });

    // ── 9. PRESUPUESTO INTELIGENTE 50/30/20 ADAPTADO ──
    const presupuestoIdeal = {
      necesidades: totalIngresos * 0.50,   // 50%
      deseos: totalIngresos * 0.30,         // 30%
      ahorro: totalIngresos * 0.20,         // 20%
    };

    const gastosNecesidades = categorias
      .filter(c => c.esencial)
      .reduce((s, c) => s + c.total, 0);
    const gastosDeseos = categorias
      .filter(c => !c.esencial)
      .reduce((s, c) => s + c.total, 0) + totalSuscripciones;

    const presupuestoReal = {
      necesidades: gastosNecesidades,
      deseos: gastosDeseos,
      ahorro: Math.max(0, totalIngresos - totalGastos),
    };

    // ── 10. PROYECCIÓN FIN DE MES ──
    const proyeccionFinMes = {
      gastosEstimados: gastoProyectadoTotal,
      saldoEstimado: totalIngresos - gastoProyectadoTotal,
      enRiesgo: gastoProyectadoTotal > totalIngresos,
      exceso: Math.max(0, gastoProyectadoTotal - totalIngresos),
      diasParaCorregir: diasRestantes,
      // Cuánto reducir por día para no exceder ingresos
      reduccionDiariaRequerida: diasRestantes > 0
        ? Math.max(0, (gastoProyectadoTotal - totalIngresos) / diasRestantes)
        : 0,
    };

    return {
      // Básicos
      totalIngresos, totalGastos, totalGastosFijos, totalGastosVariables, totalSuscripciones,
      // Velocidad
      velocidadDiaria, velocidadIdeal, ratioVelocidad, semaforoVelocidad,
      gastoProyectadoTotal, gastoProyectadoVariable,
      // Tiempo
      diaDelMes, diasEnMes, diasTranscurridos, diasRestantes, progresoMes, semanaActual,
      // Patrones
      gastosPorDia: promedioPorDia, diaPico, diaBajo, maxPromDia,
      gastosPorSemana,
      // Categorías
      categorias, totalAhorroPotencial,
      // Hormiga
      gastosHormiga, totalHormiga, frecuenciaHormiga, promedioHormiga,
      // Coach
      nivelUrgencia, mensajeCoach, emojiCoach,
      // Retos
      retos,
      // Presupuesto
      presupuestoIdeal, presupuestoReal,
      // Proyección
      proyeccionFinMes,
      // Ratios
      ratioGasto,
    };
  }, [gastosFijos, gastosVariables, suscripciones, kpis]);
}

// ── GENERADOR DE RETOS ──
function generarRetos({ nivelUrgencia, categorias, velocidadDiaria, velocidadIdeal, gastosHormiga, totalHormiga, diaPico, totalIngresos, totalGastos, totalSuscripciones, suscripciones, diasRestantes }) {
  const retos = [];

  // RETO 1: Velocidad — siempre
  if (velocidadDiaria > velocidadIdeal) {
    const reduccionNecesaria = velocidadDiaria - velocidadIdeal;
    retos.push({
      id: 'velocidad',
      emoji: '🏎️',
      titulo: 'Frena el Gasto Diario',
      descripcion: `Gastas ${fmt(velocidadDiaria)}/día. Tu meta: ${fmt(velocidadIdeal)}/día`,
      meta: `Reduce ${fmt(reduccionNecesaria)} por día los próximos ${diasRestantes} días`,
      impacto: fmt(reduccionNecesaria * diasRestantes),
      dificultad: reduccionNecesaria > 100 ? 'alta' : reduccionNecesaria > 50 ? 'media' : 'baja',
      tipo: 'diario',
      pasos: [
        `Antes de cada compra pregúntate: ¿Lo necesito HOY?`,
        `Establece un máximo de ${fmt(velocidadIdeal)} para mañana`,
        `Registra todo — lo que no se mide no se controla`
      ]
    });
  }

  // RETO 2: Categoría más alta no esencial
  const catNoEsencial = categorias.find(c => !c.esencial && c.total > 0);
  if (catNoEsencial && catNoEsencial.ahorroPotencial > 0) {
    retos.push({
      id: 'categoria',
      emoji: '✂️',
      titulo: `Recorta ${catNoEsencial.nombre}`,
      descripcion: `Gastas ${fmt(catNoEsencial.total)} (${pct(catNoEsencial.porcentaje)}) en esta categoría`,
      meta: `Reduce a ${fmt(catNoEsencial.presupuestoSugerido)} este mes`,
      impacto: fmt(catNoEsencial.ahorroPotencial),
      dificultad: catNoEsencial.porcentaje > 20 ? 'alta' : 'media',
      tipo: 'mensual',
      pasos: [
        `Identifica los 3 gastos más grandes en ${catNoEsencial.nombre}`,
        `Elimina o sustituye al menos 1 esta semana`,
        `Meta semanal: máximo ${fmt(catNoEsencial.presupuestoSugerido / 4)}`
      ]
    });
  }

  // RETO 3: Día pico
  if (diaPico >= 0) {
    retos.push({
      id: 'dia_pico',
      emoji: '📅',
      titulo: `Domina los ${DIAS_SEMANA[diaPico]}`,
      descripcion: `Los ${DIAS_SEMANA[diaPico]} son tu día de mayor gasto`,
      meta: `Este ${DIAS_SEMANA[diaPico]} gasta 30% menos que el anterior`,
      impacto: 'Variable',
      dificultad: 'media',
      tipo: 'semanal',
      pasos: [
        `Planifica las compras del ${DIAS_SEMANA[diaPico]} con anticipación`,
        `Lleva efectivo limitado ese día`,
        `Evita apps de delivery los ${DIAS_SEMANA[diaPico]}`
      ]
    });
  }

  // RETO 4: Gastos hormiga
  if (totalHormiga > 200 && gastosHormiga.length > 5) {
    retos.push({
      id: 'hormiga',
      emoji: '🐜',
      titulo: 'Elimina Gastos Hormiga',
      descripcion: `${gastosHormiga.length} compras pequeñas suman ${fmt(totalHormiga)}`,
      meta: `Reduce las compras de <$100 un 50% esta semana`,
      impacto: fmt(totalHormiga * 0.5),
      dificultad: 'baja',
      tipo: 'semanal',
      pasos: [
        'Espera 24 horas antes de compras impulsivas',
        'Lleva una lista de compras fija',
        'Usa la regla del 10%: si cuesta <10% de tu ingreso diario, piénsalo dos veces'
      ]
    });
  }

  // RETO 5: Suscripciones (si hay muchas)
  const subsActivas = suscripciones.filter(s => s.estado === 'Activo');
  if (subsActivas.length > 3 && totalSuscripciones > totalIngresos * 0.05) {
    retos.push({
      id: 'suscripciones',
      emoji: '🔄',
      titulo: 'Auditoría de Suscripciones',
      descripcion: `${subsActivas.length} suscripciones activas = ${fmt(totalSuscripciones)}/mes`,
      meta: `Cancela al menos 1 suscripción esta semana`,
      impacto: fmt(totalSuscripciones * 0.3),
      dificultad: 'baja',
      tipo: 'única',
      pasos: [
        'Revisa cuáles usaste en los últimos 30 días',
        'Cancela la que menos uses',
        'Busca alternativas gratuitas'
      ]
    });
  }

  // RETO 6: Plan de choque (si es crítico)
  if (nivelUrgencia === 'critico') {
    const exceso = totalGastos - totalIngresos;
    retos.unshift({
      id: 'choque',
      emoji: '🚨',
      titulo: 'Plan de Choque: 7 Días',
      descripcion: `Gastas ${fmt(exceso)} más de lo que ganas. Acción inmediata.`,
      meta: `Reduce ${fmt(exceso / 4)} esta semana con estas acciones`,
      impacto: fmt(exceso),
      dificultad: 'alta',
      tipo: 'urgente',
      pasos: [
        '🔴 Congela gastos no esenciales 7 días',
        '🔴 Solo compra alimentos y necesidades básicas',
        '🔴 Cancela todas las suscripciones no vitales',
        '🔴 Busca un ingreso extra esta semana'
      ]
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

  // Motor de inteligencia
  const motor = useMotorInteligencia({ gastosFijos, gastosVariables, suscripciones, kpis });

  // Animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => setShowAnimacion(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Navegar pasos
  const irAPaso = useCallback((paso) => {
    setPasoActual(Math.max(0, Math.min(PASOS_COACH.length - 1, paso)));
  }, []);

  // Editar presupuesto de categoría
  const editarPresupuesto = useCallback((catNombre, valor) => {
    setPresupuestosEditados(prev => ({ ...prev, [catNombre]: Number(valor) || 0 }));
  }, []);

  // Toggle reto
  const toggleReto = useCallback((retoId) => {
    setRetosAceptados(prev => 
      prev.includes(retoId) ? prev.filter(r => r !== retoId) : [...prev, retoId]
    );
  }, []);

  // Guardar plan
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
        descripcion: `Plan inteligente: reduce de ${fmt(motor.totalGastos)} a ${fmt(presupuestos.reduce((s, p) => s + p.presupuesto, 0))}`,
        configuracion: {
          presupuestos,
          retosActivos,
          velocidadIdeal: motor.velocidadIdeal,
          velocidadActual: motor.velocidadDiaria,
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

      if (showLocalNotification) showLocalNotification('✅ Plan de control guardado', 'success');
      if (onPlanGuardado) onPlanGuardado();
      onClose();
    } catch (error) {
      console.error('Error guardando plan:', error);
      if (showLocalNotification) showLocalNotification('Error al guardar', 'error');
    }
  }, [motor, presupuestosEditados, retosAceptados, addPlan, onClose, onPlanGuardado, showLocalNotification]);

  // ── ANIMACIÓN INICIAL ──
  if (showAnimacion) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
        <div className="flex flex-col items-center gap-6 animate-pulse" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <Brain className="w-12 h-12 text-white animate-bounce" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center animate-ping">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Analizando tus gastos...</h2>
            <p className="text-orange-300/70 text-sm">Detectando patrones y oportunidades</p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER PRINCIPAL ──
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 w-full sm:max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="flex-shrink-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-white/10">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Coach de Gastos</h2>
                <p className="text-orange-300/60 text-[11px]">
                  {PASOS_COACH[pasoActual].emoji} {PASOS_COACH[pasoActual].desc}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex px-4 pb-3 gap-1.5">
            {PASOS_COACH.map((paso, idx) => (
              <button
                key={paso.key}
                onClick={() => irAPaso(idx)}
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  idx <= pasoActual 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── CONTENIDO ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {pasoActual === 0 && (
            <PasoDiagnostico motor={motor} />
          )}
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
            <PasoRetos 
              motor={motor}
              retosAceptados={retosAceptados}
              onToggleReto={toggleReto}
            />
          )}
          {pasoActual === 3 && (
            <PasoGuardar 
              motor={motor}
              presupuestosEditados={presupuestosEditados}
              retosAceptados={retosAceptados}
              onGuardar={() => setShowConfirmacion(true)}
            />
          )}
        </div>

        {/* ── FOOTER NAVEGACIÓN ── */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex gap-3">
            {pasoActual > 0 && (
              <button
                onClick={() => irAPaso(pasoActual - 1)}
                className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm transition-all active:scale-95"
              >
                Atrás
              </button>
            )}
            {pasoActual < PASOS_COACH.length - 1 ? (
              <button
                onClick={() => irAPaso(pasoActual + 1)}
                className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                {pasoActual === 0 ? 'Ver Mi Plan' : 'Siguiente'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmacion(true)}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/20"
              >
                <Save className="w-4 h-4" />
                Activar Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Confirmación */}
      {showConfirmacion && (
        <ConfirmacionGuardado
          motor={motor}
          retosAceptados={retosAceptados}
          onConfirmar={guardarPlan}
          onCancelar={() => setShowConfirmacion(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 📊 PASO 1: DIAGNÓSTICO EXPRESS
// ═══════════════════════════════════════════════════

function PasoDiagnostico({ motor }) {
const {
  totalGastos, velocidadDiaria, velocidadIdeal, 
  semaforoVelocidad, ratioVelocidad, diasRestantes, diaDelMes, diasEnMes,
  gastosPorDia, diaPico, maxPromDia,
  mensajeCoach, emojiCoach,
  proyeccionFinMes, categorias, totalHormiga, frecuenciaHormiga,
  totalGastosFijos, totalGastosVariables, totalSuscripciones,
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
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${sem.bg} ${sem.text} border ${sem.border}`}>
              <Flame className="w-3 h-3" />
              Urgencia: {sem.label}
            </div>
          </div>
        </div>
      </div>

      {/* Velocímetro */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sem.bg} flex items-center justify-center`}>
            <Zap className={`w-4 h-4 ${sem.text}`} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Velocidad de Gasto</h4>
            <p className="text-gray-400 text-[11px]">Día {diaDelMes} de {diasEnMes} · {diasRestantes} días restantes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Tu velocidad</div>
            <div className={`text-xl font-bold ${sem.text}`}>{fmt(velocidadDiaria)}<span className="text-xs text-gray-400">/día</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Ideal</div>
            <div className="text-xl font-bold text-emerald-400">{fmt(velocidadIdeal)}<span className="text-xs text-gray-400">/día</span></div>
          </div>
        </div>

        {/* Barra de velocidad */}
        <div className="relative">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                semaforoVelocidad === 'verde' ? 'bg-emerald-500' :
                semaforoVelocidad === 'amarillo' ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, ratioVelocidad * 50)}%` }}
            />
          </div>
          {/* Marcador ideal */}
          <div className="absolute top-0 h-3 w-0.5 bg-white/70" style={{ left: '50%' }} />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-500">$0</span>
            <span className="text-[9px] text-white/50">↑ Ideal</span>
            <span className="text-[9px] text-gray-500">{fmt(velocidadIdeal * 2)}</span>
          </div>
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
          <h4 className="text-white font-bold text-sm">A este ritmo, fin de mes...</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Gastarás</div>
            <div className={`text-lg font-bold ${proyeccionFinMes.enRiesgo ? 'text-red-400' : 'text-white'}`}>
              {fmt(proyeccionFinMes.gastosEstimados)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Te quedará</div>
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
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
              idx === diaPico ? 'text-red-400' : 'text-gray-500'
            }`}>
              {dia}
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3">
          📍 Los <span className="text-red-400 font-semibold">{DIAS_SEMANA[diaPico]}</span> gastas más. 
          Planifica esos días con anticipación.
        </p>
      </div>

      {/* Distribución Rápida */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Distribución
        </h4>
        <div className="space-y-2">
          <DistBar label="Fijos" monto={totalGastosFijos} total={totalGastos} color="bg-blue-500" />
          <DistBar label="Variables" monto={totalGastosVariables} total={totalGastos} color="bg-orange-500" />
          <DistBar label="Suscripciones" monto={totalSuscripciones} total={totalGastos} color="bg-purple-500" />
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3">Top Categorías</h4>
        <div className="space-y-2">
          {categorias.slice(0, 5).map((cat, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${cat.esCritica ? 'bg-red-500/10' : 'bg-white/5'}`}>
              <span className="text-lg">{cat.nombre.split(' ')[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-white text-xs font-semibold truncate">{cat.nombre.split(' ').slice(1).join(' ')}</span>
                  <span className="text-white text-xs font-bold">{fmt(cat.total)}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cat.colorClasses.bar}`} style={{ width: `${cat.porcentaje}%` }} />
                </div>
              </div>
              <span className="text-gray-400 text-[10px] w-8 text-right">{pct(cat.porcentaje)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 📋 PASO 2: PRESUPUESTO INTELIGENTE
// ═══════════════════════════════════════════════════

function PasoPresupuesto({ motor, presupuestosEditados, onEditarPresupuesto, expandedCat, onToggleCat }) {
  const { categorias, totalIngresos, totalGastos, presupuestoIdeal, presupuestoReal, totalAhorroPotencial } = motor;

  const totalPresupuestado = categorias.reduce((s, c) => 
    s + (presupuestosEditados[c.nombre] ?? c.presupuestoSugerido), 0
  );
  const ahorroConPlan = totalIngresos - totalPresupuestado;

  return (
    <div className="p-4 space-y-4">
      
      {/* Coach Message */}
      <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-white text-sm font-medium flex items-start gap-2">
          <Brain className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            Creé un presupuesto basado en tus patrones reales. 
            {totalAhorroPotencial > 0 
              ? ` Puedes ahorrar ${fmt(totalAhorroPotencial)}/mes ajustando estas categorías.` 
              : ' Tus gastos están bien distribuidos.'
            }
          </span>
        </p>
      </div>

      {/* Regla 50/30/20 Visual */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Regla 50/30/20 (Tu Realidad)
        </h4>
        
        <div className="space-y-3">
          <ReglaBar 
            label="Necesidades" 
            emoji="🏠" 
            ideal={presupuestoIdeal.necesidades} 
            real={presupuestoReal.necesidades} 
            total={totalIngresos}
            color="bg-blue-500"
            idealPct="50%"
          />
          <ReglaBar 
            label="Deseos" 
            emoji="🎭" 
            ideal={presupuestoIdeal.deseos} 
            real={presupuestoReal.deseos} 
            total={totalIngresos}
            color="bg-purple-500"
            idealPct="30%"
          />
          <ReglaBar 
            label="Ahorro" 
            emoji="💰" 
            ideal={presupuestoIdeal.ahorro} 
            real={presupuestoReal.ahorro} 
            total={totalIngresos}
            color="bg-emerald-500"
            idealPct="20%"
          />
        </div>
      </div>

      {/* Resumen Plan */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-400 uppercase">Gasto Actual</div>
          <div className="text-base font-bold text-red-400">{fmt(totalGastos)}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-400 uppercase">Con Plan</div>
          <div className="text-base font-bold text-blue-400">{fmt(totalPresupuestado)}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <div className="text-[10px] text-emerald-300 uppercase">Ahorras</div>
          <div className="text-base font-bold text-emerald-400">{fmt(ahorroConPlan)}</div>
        </div>
      </div>

      {/* Presupuestos por Categoría */}
      <div className="space-y-2">
        <h4 className="text-white font-bold text-sm flex items-center gap-2">
          <Wallet className="w-4 h-4 text-orange-400" />
          Presupuesto por Categoría
          <span className="text-[10px] text-gray-400 font-normal">(toca para ajustar)</span>
        </h4>

        {categorias.map((cat) => {
          const presupuesto = presupuestosEditados[cat.nombre] ?? cat.presupuestoSugerido;
          const isExpanded = expandedCat === cat.nombre;
          const excede = cat.total > presupuesto;
          const ahorro = Math.max(0, cat.total - presupuesto);

          return (
            <div key={cat.nombre} className={`rounded-xl border overflow-hidden transition-all ${
              isExpanded ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
            }`}>
              <button
                onClick={() => onToggleCat(isExpanded ? null : cat.nombre)}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                <span className="text-lg">{cat.nombre.split(' ')[0]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xs font-semibold truncate">
                      {cat.nombre.split(' ').slice(1).join(' ')}
                    </span>
                    {cat.esencial && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">esencial</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${excede ? 'text-red-400' : 'text-white'}`}>{fmt(cat.total)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-bold text-emerald-400">{fmt(presupuesto)}</span>
                    {ahorro > 0 && (
                      <span className="text-[10px] text-emerald-400">(-{fmt(ahorro)})</span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Slider de presupuesto */}
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Presupuesto</span>
                      <span>{fmt(presupuesto)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.round(cat.total * 1.5)}
                      step={10}
                      value={presupuesto}
                      onChange={(e) => onEditarPresupuesto(cat.nombre, e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500"
                      style={{ background: `linear-gradient(to right, #f97316 ${(presupuesto / (cat.total * 1.5)) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                      <span>$0</span>
                      <span className="text-orange-400">Sugerido: {fmt(cat.presupuestoSugerido)}</span>
                      <span>{fmt(cat.total * 1.5)}</span>
                    </div>
                  </div>

                  {/* Barra progreso */}
                  <div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all ${excede ? 'bg-red-500' : cat.colorClasses.bar}`}
                        style={{ width: `${Math.min(100, (cat.total / (presupuesto || 1)) * 100)}%` }}
                      />
                      {/* Marca del presupuesto */}
                      <div className="absolute top-0 h-full w-0.5 bg-white/50" style={{ left: '100%' }} />
                    </div>
                    <p className="text-gray-400 text-[10px] mt-1">
                      {excede 
                        ? `⚠️ Excedes el presupuesto por ${fmt(cat.total - presupuesto)}`
                        : `✅ Dentro del presupuesto (${pct((cat.total / presupuesto) * 100)} usado)`
                      }
                    </p>
                  </div>

                  {/* Detalle de gastos */}
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {cat.items.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] py-1 border-b border-white/5">
                        <span className="text-gray-300 truncate flex-1">{item.descripcion || item.nombre || 'Gasto'}</span>
                        <span className="text-white font-semibold ml-2">{fmt(item.monto)}</span>
                      </div>
                    ))}
                    {cat.items.length > 5 && (
                      <p className="text-gray-500 text-[10px]">+{cat.items.length - 5} más</p>
                    )}
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
        <p className="text-gray-400 text-sm text-center max-w-xs">
          No detecté áreas urgentes que mejorar. Tus gastos están bien controlados.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Coach */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
        <p className="text-white text-sm font-medium flex items-start gap-2">
          <Target className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Diseñé {retos.length} retos personalizados según tus patrones.
            Acepta los que puedas cumplir — es mejor 1 reto cumplido que 5 ignorados.
          </span>
        </p>
      </div>

      {/* Retos Aceptados Counter */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-semibold">Retos aceptados</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{retosAceptados.length}</span>
          <span className="text-gray-400 text-sm">/ {retos.length}</span>
        </div>
      </div>

      {/* Lista de Retos */}
      <div className="space-y-3">
        {retos.map((reto) => (
          <RetoCard 
            key={reto.id} 
            reto={reto} 
            aceptado={retosAceptados.includes(reto.id)} 
            onToggle={() => onToggleReto(reto.id)} 
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 💾 PASO 4: RESUMEN Y GUARDAR
// ═══════════════════════════════════════════════════

function PasoGuardar({ motor, presupuestosEditados, retosAceptados, onGuardar }) {
const { categorias, totalGastos, totalIngresos, retos } = motor;

  
  const totalPresupuestado = categorias.reduce((s, c) => 
    s + (presupuestosEditados[c.nombre] ?? c.presupuestoSugerido), 0
  );
  const ahorroConPlan = totalIngresos - totalPresupuestado;
  const retosActivos = retos.filter(r => retosAceptados.includes(r.id));
  const categoriasEditadas = categorias.filter(c => {
    const pres = presupuestosEditados[c.nombre];
    return pres !== undefined && pres !== c.presupuestoSugerido;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Coach */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-4">
        <p className="text-white text-sm font-medium flex items-start gap-2">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            {retosActivos.length > 0
              ? `¡Excelente! Aceptaste ${retosActivos.length} reto${retosActivos.length > 1 ? 's' : ''}. Con tu plan ajustado, puedes ahorrar hasta ${fmt(ahorroConPlan)}/mes.`
              : `Tu plan de presupuesto puede ahorrarte ${fmt(ahorroConPlan)}/mes. Guárdalo para hacer seguimiento.`
            }
          </span>
        </p>
      </div>

      {/* Resumen Visual */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h4 className="text-white font-bold text-sm mb-3">Tu Plan en un Vistazo</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase mb-1">Antes</div>
              <div className="text-xl font-bold text-red-400">{fmt(totalGastos)}</div>
              <div className="text-[10px] text-gray-500">{pct((totalGastos / totalIngresos) * 100)} de ingresos</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-emerald-300 uppercase mb-1">Con Plan</div>
              <div className="text-xl font-bold text-emerald-400">{fmt(totalPresupuestado)}</div>
              <div className="text-[10px] text-emerald-300/50">{pct((totalPresupuestado / totalIngresos) * 100)} de ingresos</div>
            </div>
          </div>

          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-[10px] text-emerald-300 uppercase">Ahorro mensual estimado</div>
            <div className="text-2xl font-bold text-white">{fmt(ahorroConPlan)}</div>
            <div className="text-emerald-300 text-xs">{fmt(ahorroConPlan * 12)} al año</div>
          </div>
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
        {categoriasEditadas.length > 0 && (
          <div className="p-4">
            <h5 className="text-white font-semibold text-xs mb-2 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-orange-400" />
              Presupuestos Personalizados ({categoriasEditadas.length})
            </h5>
            <div className="space-y-1.5">
              {categoriasEditadas.map(cat => (
                <div key={cat.nombre} className="flex items-center gap-2 text-xs">
                  <span>{cat.nombre.split(' ')[0]}</span>
                  <span className="text-gray-400 line-through">{fmt(cat.total)}</span>
                  <ArrowRight className="w-3 h-3 text-gray-500" />
                  <span className="text-emerald-400 font-semibold">{fmt(presupuestosEditados[cat.nombre])}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proyección */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-purple-400" />
          Impacto a Futuro
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase">1 Mes</div>
            <div className="text-sm font-bold text-white">{fmt(ahorroConPlan)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase">6 Meses</div>
            <div className="text-sm font-bold text-blue-400">{fmt(ahorroConPlan * 6)}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
            <div className="text-[9px] text-emerald-300 uppercase">1 Año</div>
            <div className="text-sm font-bold text-emerald-400">{fmt(ahorroConPlan * 12)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🎯 RETO CARD (extracted for hooks compliance)
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
      aceptado 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : 'bg-white/5 border-white/10'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{reto.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h5 className="text-white font-bold text-sm">{reto.titulo}</h5>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border ${dificultadColors[reto.dificultad]}`}>
                {reto.dificultad}
              </span>
            </div>
            <p className="text-gray-300 text-xs mb-2">{reto.descripcion}</p>
            
            {/* Meta */}
            <div className="bg-white/10 rounded-lg p-2 mb-2">
              <p className="text-white text-xs font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-orange-400" />
                {reto.meta}
              </p>
            </div>

            {/* Impacto */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <PiggyBank className="w-3 h-3" />
                Ahorras: {reto.impacto}/mes
              </span>
              <span className="text-gray-500 text-[10px]">
                {reto.tipo === 'urgente' ? '⚡ Inmediato' : 
                 reto.tipo === 'diario' ? '📅 Diario' :
                 reto.tipo === 'semanal' ? '📆 Semanal' :
                 reto.tipo === 'mensual' ? '🗓️ Mensual' : '🔄 Una vez'}
              </span>
            </div>

            {/* Pasos expandibles */}
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-orange-300 text-xs flex items-center gap-1 hover:text-orange-200 transition"
            >
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

      {/* Botón Aceptar */}
      <button
        onClick={onToggle}
        className={`w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          aceptado
            ? 'bg-emerald-600/50 text-white hover:bg-emerald-600/40'
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        {aceptado ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Reto Aceptado ✓
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Aceptar Reto
          </>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🔧 COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════

function DistBar({ label, monto, total, color }) {
  const pctVal = total > 0 ? (monto / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{fmt(monto)} ({pct(pctVal)})</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
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
          <span className="text-[10px] text-gray-500">({idealPct})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${excede ? 'text-red-400' : 'text-white'}`}>{fmt(real)}</span>
          <span className="text-gray-500 text-[10px]">/ {fmt(ideal)}</span>
        </div>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden relative">
        <div 
          className={`h-full rounded-full transition-all ${excede ? 'bg-red-500' : color}`}
          style={{ width: `${Math.min(100, realPct)}%` }}
        />
        {/* Marca ideal */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-white/50" 
          style={{ left: `${idealPctNum}%` }} 
        />
      </div>
    </div>
  );
}

function ConfirmacionGuardado({ motor, retosAceptados, onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const mesActual = new Date().toLocaleString('es-MX', { month: 'long' });

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
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 text-sm"
            autoFocus
          />
        </div>

        <div className="bg-white/10 rounded-xl p-3 mb-5">
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
          <button
            onClick={onCancelar}
            className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 bg-white text-emerald-900 py-3 rounded-xl font-bold text-sm hover:bg-white/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                Guardando
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Activar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
