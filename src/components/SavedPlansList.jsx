// SavedPlansList.jsx — 2026 Design: planes financieros para jóvenes modernos
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2, X,
  Clock, CheckSquare, RefreshCw,
  ArrowRight, Trophy
} from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';
import { supabase } from '../lib/supabaseClient';

// ─── Config por tipo de plan ───────────────────────────────────────────────
const TIPO_CONFIG = {
  deuda:  { gradient: 'from-rose-500/20 to-red-600/10',   border: 'border-rose-500/25',   accent: '#ef4444', icon: '💳', label: 'Salir de Deudas',  text: 'text-rose-400',   ring: 'ring-rose-500/30'  },
  ahorro: { gradient: 'from-emerald-500/20 to-teal-600/10', border: 'border-emerald-500/25', accent: '#10b981', icon: '🐖', label: 'Plan de Ahorro',   text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  default:{ gradient: 'from-indigo-500/20 to-violet-600/10', border: 'border-indigo-500/25', accent: '#6366f1', icon: '📋', label: 'Plan General',    text: 'text-indigo-400',  ring: 'ring-indigo-500/30'  },
};

const getTipoConfig = (tipo) => {
  if (!tipo) return TIPO_CONFIG.default;
  const t = tipo.toLowerCase();
  if (t.includes('deuda')) return TIPO_CONFIG.deuda;
  if (t.includes('ahorro')) return TIPO_CONFIG.ahorro;
  return TIPO_CONFIG.default;
};

export default function SavedPlansList({ refreshSignal = 0, realFinancialData = {} }) {
  const { planes, loading, deletePlan, updatePlan, refresh } = usePlanesGuardados();
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [deudasDirectas, setDeudasDirectas] = useState([]);

  useEffect(() => { refresh(); }, [refreshSignal]); // eslint-disable-line

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('deudas').select('*').eq('user_id', user.id);
        if (!error && data) setDeudasDirectas(data);
      } catch { /* no fatal */ }
    };
    fetch();
  }, [refreshSignal]);

  const deudasReales = useMemo(() => {
    const fromProps = realFinancialData?.deudas || [];
    return fromProps.length > 0 ? fromProps : deudasDirectas;
  }, [realFinancialData, deudasDirectas]);

  const getPlanStats = useCallback((plan) => {
    let meta = Number(plan.monto_objetivo) || 0;
    let actual = Number(plan.monto_actual) || 0;
    let progreso = meta > 0 ? ((actual / meta) * 100).toFixed(1) : 0;
    let deudaPendiente = 0;
    const esDeuda = plan.tipo?.toLowerCase().includes('deuda');

    if (esDeuda) {
      const config = plan.configuracion || {};
      const debts = config?.plan?.orderedDebts || config?.orderedDebts || config?.analysis?.cleanDebts || [];

      if (debts.length > 0 && deudasReales.length > 0) {
        let origTotal = 0, actTotal = 0;
        debts.forEach(d => {
          const real = deudasReales.find(dr =>
            dr.id === d.id || dr.cuenta === d.nombre || dr.cuenta === d.cuenta
          );
          const orig = Number(d.balance || d.saldo || d.saldoOriginal || 0);
          const act = real ? Number(real.saldo || 0) : orig;
          origTotal += orig;
          actTotal += act;
        });
        const pagado = Math.max(0, origTotal - actTotal);
        meta = origTotal;
        actual = pagado;
        deudaPendiente = actTotal;
        progreso = origTotal > 0 ? ((pagado / origTotal) * 100).toFixed(1) : 0;
      } else if (Number(plan.progreso || 0) > 0) {
        progreso = Number(plan.progreso).toFixed(1);
      }
    }

    return { meta, actual, progreso: Number(progreso), esDeuda, deudaPendiente };
  }, [deudasReales]);

  const plansConStats = useMemo(() => {
    if (!planes?.length) return [];
    // Solo mostrar planes activos y no completados
    return planes
      .filter(p => p.activo && !p.completado)
      .map(p => ({ ...p, stats: getPlanStats(p) }));
  }, [planes, getPlanStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-sm text-gray-400 font-medium">Cargando planes...</span>
      </div>
    );
  }

  if (!planes?.length) {
    return (
      <div
        className="rounded-3xl p-8 text-center border"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      >
        <div className="text-5xl mb-4">🎯</div>
        <h3 className="text-base font-black text-white mb-2">Sin planes activos</h3>
        <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
          Usa el asistente IA para crear tu primer plan de deudas o ahorro.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Scroll horizontal en mobile, grid en desktop */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
        {plansConStats.map((plan, idx) => (
          <div key={plan.id} className="snap-start flex-shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none md:flex-shrink">
            <PlanCard2026
              plan={plan}
              stats={plan.stats}
              delay={idx * 60}
              onClick={() => setPlanSeleccionado(plan)}
              onDelete={async (id) => { await deletePlan(id); await refresh(); }}
            />
          </div>
        ))}
      </div>

      {planSeleccionado && createPortal(
        <ModalPlan2026
          plan={planSeleccionado}
          stats={planSeleccionado.stats}
          onClose={() => setPlanSeleccionado(null)}
          onDelete={async (id) => { await deletePlan(id); await refresh(); setPlanSeleccionado(null); }}
          onComplete={async (id) => {
            await updatePlan(id, { completado: true, activo: false, progreso: 100, fecha_completado: new Date().toISOString() });
            await refresh();
            setPlanSeleccionado(null);
          }}
        />,
        document.body
      )}
    </>
  );
}

// ─── CARD 2026 ─────────────────────────────────────────────────────────────
function PlanCard2026({ plan, stats, onClick, onDelete, delay }) {
  const cfg = getTipoConfig(plan.tipo);
  const { meta, actual, progreso, esDeuda, deudaPendiente } = stats;
  const completado = progreso >= 100;

  const fechaInicio = plan.fecha_inicio ? new Date(plan.fecha_inicio) : null;
  const plazoMeses = plan.plazo_meses || plan.meses_duracion || 12;
  const hoy = new Date();
  const diasTranscurridos = fechaInicio ? Math.floor((hoy - fechaInicio) / (1000 * 60 * 60 * 24)) : 0;
  const diasRestantes = Math.max(0, plazoMeses * 30 - diasTranscurridos);
  const mesesRestantes = Math.round(diasRestantes / 30);

  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl border cursor-pointer
        transition-all duration-200 active:scale-[0.97] touch-manipulation
        animate-in fade-in slide-in-from-bottom-2
      `}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${cfg.accent}30`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
        animationDelay: `${delay}ms`,
      }}
      onClick={onClick}
    >
      {/* Glow corner */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.accent}25 0%, transparent 70%)`, filter: 'blur(12px)' }}
      />

      {/* Barra progreso top */}
      <div className="h-0.5 bg-white/5 overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${Math.min(100, progreso)}%`,
            background: completado
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}aa)`,
            boxShadow: `0 0 6px ${cfg.accent}60`,
          }}
        />
      </div>

      <div className="p-4 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}30` }}
            >
              {completado ? '🏆' : cfg.icon}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-white truncate leading-tight">{plan.nombre || 'Sin Nombre'}</h4>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('¿Eliminar este plan?')) onDelete(plan.id);
            }}
            className="p-1.5 rounded-xl hover:bg-red-500/15 text-gray-600 hover:text-red-400 transition-all shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progreso visual */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-500 font-medium">Progreso</span>
            <span className={`text-sm font-black ${completado ? 'text-emerald-400' : 'text-white'}`}>
              {progreso.toFixed(0)}%
              {completado && ' 🎉'}
            </span>
          </div>
          <div className="h-2 bg-white/6 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, progreso)}%`,
                background: completado
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}cc)`,
                boxShadow: `0 0 4px ${cfg.accent}50`,
              }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-0.5">
              {esDeuda ? 'Pagado' : 'Logrado'}
            </p>
            <p className="text-sm font-black text-emerald-400">${actual.toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-0.5">
              {esDeuda ? 'Pendiente' : 'Meta'}
            </p>
            <p className={`text-sm font-black ${esDeuda ? 'text-rose-400' : 'text-white'}`}>
              ${(esDeuda ? deudaPendiente : meta).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer: tiempo restante + flecha */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-gray-600" />
            <span className="text-[10px] text-gray-500">
              {mesesRestantes > 0 ? `${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''} restantes` : 'Plazo completado'}
            </span>
          </div>
          <ArrowRight className={`w-4 h-4 ${cfg.text}`} />
        </div>
      </div>
    </div>
  );
}

// ─── MODAL DETALLES 2026 ──────────────────────────────────────────────────
function ModalPlan2026({ plan, stats, onClose, onDelete, onComplete }) {
  const cfg = getTipoConfig(plan.tipo);
  const { meta, actual, progreso, esDeuda, deudaPendiente } = stats;
  const completado = progreso >= 100;
  const [celebrando, setCelebrando] = useState(false);

  const fechaInicio = plan.fecha_inicio ? new Date(plan.fecha_inicio) : new Date();
  const plazoMeses = plan.plazo_meses || plan.meses_duracion || 12;
  const hoy = new Date();
  const diasTranscurridos = Math.floor((hoy - fechaInicio) / (1000 * 60 * 60 * 24));
  const diasRestantes = Math.max(0, plazoMeses * 30 - diasTranscurridos);
  const progresoTiempo = Math.min(100, (diasTranscurridos / (plazoMeses * 30)) * 100);

  const pagoMensual = plan.pago_mensual || plan.configuracion?.monthlyPayment || 0;
  const ahorroMensual = meta > 0 ? (meta / plazoMeses).toFixed(0) : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
        <div
          className="relative w-full md:max-w-md max-h-[92dvh] md:max-h-[85vh] pointer-events-auto flex flex-col overflow-hidden rounded-t-3xl md:rounded-3xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300"
          style={{
            background: 'linear-gradient(160deg, rgba(10,15,30,0.99) 0%, rgba(17,24,39,0.98) 100%)',
            border: `1px solid ${cfg.accent}25`,
            boxShadow: `0 -20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.accent}10 inset`,
            backdropFilter: 'blur(40px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pill mobile */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden shrink-0" />

          {/* Header */}
          <div className="relative p-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${cfg.accent}15` }}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}30` }}
              >
                {completado ? '🏆' : cfg.icon}
              </div>
              <div>
                <h2 className="text-lg font-black text-white leading-tight">{plan.nombre}</h2>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
              </div>
            </div>

            {/* Progreso prominente */}
            <div
              className="rounded-2xl p-4"
              style={{ background: `${cfg.accent}10`, border: `1px solid ${cfg.accent}20` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Progreso total</span>
                <span className={`text-2xl font-black ${completado ? 'text-emerald-400' : 'text-white'}`}>
                  {progreso.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, progreso)}%`,
                    background: completado
                      ? 'linear-gradient(90deg, #10b981, #059669)'
                      : `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}bb)`,
                    boxShadow: `0 0 8px ${cfg.accent}60`,
                  }}
                />
              </div>
              {completado && (
                <p className="text-center text-xs text-emerald-400 font-bold mt-2">🎉 ¡Meta completada!</p>
              )}
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* Grid métricas */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: '✅', label: esDeuda ? 'Pagado' : 'Logrado', value: `$${actual.toLocaleString()}`, color: 'text-emerald-400' },
                { icon: '🎯', label: esDeuda ? 'Pendiente' : 'Meta', value: `$${(esDeuda ? deudaPendiente : meta).toLocaleString()}`, color: esDeuda ? 'text-rose-400' : 'text-white' },
                { icon: '⚡', label: esDeuda ? 'Pago mensual' : 'Ahorro mensual', value: `$${(esDeuda ? pagoMensual : ahorroMensual).toLocaleString()}`, color: 'text-blue-400' },
                { icon: '📅', label: 'Plazo', value: `${plazoMeses} meses`, color: 'text-white' },
              ].map(({ icon, label, value, color }) => (
                <div
                  key={label}
                  className="rounded-2xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-1">{icon} {label}</p>
                  <p className={`text-base font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Línea de tiempo */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Tiempo del plan
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Inicio</span>
                  <span className="text-white font-bold">{fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Días transcurridos</span>
                  <span className="text-white font-bold">{diasTranscurridos}d</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Días restantes</span>
                  <span className="text-blue-400 font-bold">{diasRestantes}d</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${progresoTiempo}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1 text-right">{progresoTiempo.toFixed(0)}% del tiempo</p>
            </div>

            {/* Estrategia si es deuda */}
            {esDeuda && (
              <div
                className="rounded-2xl p-3.5"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-2">💳 Estrategia</p>
                <p className="text-sm text-white font-bold">{plan.estrategia || plan.configuracion?.strategy || 'Avalancha'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Primero las deudas con mayor interés</p>
              </div>
            )}

            {plan.notas && (
              <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-gray-600 font-bold mb-1.5">📝 Notas</p>
                <p className="text-sm text-gray-300">{plan.notas}</p>
              </div>
            )}
          </div>

          {/* Pantalla de celebración al completar */}
          {celebrando && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-t-3xl md:rounded-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.98))' }}>
              <div className="text-7xl mb-4 animate-bounce">🏆</div>
              <p className="text-white text-2xl font-black mb-2">¡Lo lograste!</p>
              <p className="text-emerald-100 text-sm text-center px-8 mb-6">
                {esDeuda ? 'Pagaste tus deudas. Eso toma disciplina real. 💪' : 'Alcanzaste tu meta de ahorro. ¡Increíble! 🎉'}
              </p>
              <Trophy className="w-10 h-10 text-yellow-300 animate-pulse" />
            </div>
          )}

          {/* Botones sticky */}
          <div className="p-4 border-t border-white/8 flex gap-2.5 shrink-0 safe-area-bottom">
            {!completado && (
              <button
                onClick={async () => {
                  setCelebrando(true);
                  await onComplete(plan.id);
                  setTimeout(() => { setCelebrando(false); onClose(); }, 2200);
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
              >
                <CheckSquare className="w-4 h-4" /> Marcar completado
              </button>
            )}
            {completado && (
              <div className="flex-1 py-3 rounded-2xl text-sm font-black text-emerald-400 flex items-center justify-center gap-2 border border-emerald-500/30 bg-emerald-500/10">
                <Trophy className="w-4 h-4" /> ¡Meta lograda!
              </div>
            )}
            <button
              onClick={() => { if (window.confirm('¿Eliminar este plan?')) onDelete(plan.id); }}
              className="py-3 px-4 rounded-2xl text-sm font-bold text-red-400 border border-red-500/25 hover:bg-red-500/10 active:scale-[0.97] transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
