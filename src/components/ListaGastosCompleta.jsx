import React from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingDown,
  Repeat,
  CheckCircle,
  ArrowRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { ITEM_TYPES } from '../constants/itemTypes';

export default function ListaGastosCompleta({
  deudas = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudaPagadaEsteMes,
  onVerDetalle,
  onEliminar,
  onPagar,
  onEditar,
}) {
  const formatMoney = (n) => `$${Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper: Configuración visual por tipo
  const typeConfig = {
    [ITEM_TYPES.DEUDA]: { icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Deudas' },
    [ITEM_TYPES.FIJO]: { icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Gastos Fijos' },
    [ITEM_TYPES.SUSCRIPCION]: { icon: Repeat, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Suscripciones' },
    [ITEM_TYPES.VARIABLE]: { icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Gastos Variables' },
  };

  // Componente de Tarjeta Unificada
  const renderCard = (item, type) => {
    const config = typeConfig[type];
    const Icon = config.icon;
    
    // Verificar estado
    let isPaid = false;
    if (type === ITEM_TYPES.DEUDA && deudaPagadaEsteMes?.(item.id)) isPaid = true;
    if (type === ITEM_TYPES.FIJO && item.estado === 'Pagado') isPaid = true;
    if (type === ITEM_TYPES.SUSCRIPCION && item.estado !== 'Activo') isPaid = true;

    // Determinar título y subtítulo
    let title, subtitle, amount;
    switch (type) {
      case ITEM_TYPES.DEUDA:
        title = item.cuenta || item.nombre;
        subtitle = 'Crédito';
        amount = item.saldo;
        break;
      case ITEM_TYPES.FIJO:
        title = item.nombre;
        subtitle = item.categoria || 'Fijo';
        amount = item.monto;
        break;
      case ITEM_TYPES.SUSCRIPCION:
        title = item.servicio;
        subtitle = `${item.categoria || 'Servicio'} • ${item.ciclo}`;
        amount = item.costo;
        break;
      case ITEM_TYPES.VARIABLE:
        title = item.descripcion || item.categoria;
        subtitle = item.categoria || 'Variable';
        amount = item.monto;
        break;
      default:
        return null;
    }

    return (
      <div
        key={`${type}-${item.id}`}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-5 hover:border-white/20 transition-all duration-300 group relative overflow-hidden"
      >
        {/* Fondo decorativo */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${config.bg}`} />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2.5 rounded-xl border ${config.bg} ${config.color} border-opacity-30 shadow-sm`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold text-sm md:text-base truncate">{title}</h3>
                {isPaid && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> PAGADO
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs md:text-sm">{subtitle}</p>
            </div>
          </div>
          
          <div className="text-right relative z-10">
            <p className={`font-bold text-lg md:text-xl ${isPaid ? 'text-gray-400 line-through' : 'text-white'}`}>
              {formatMoney(amount)}
            </p>
          </div>
        </div>

        {/* Info Extra (Solo para deudas y suscripciones) */}
        {(type === ITEM_TYPES.DEUDA || type === ITEM_TYPES.SUSCRIPCION) && (
          <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 mb-4 pb-4 border-b border-white/5">
            <span>
              {type === ITEM_TYPES.DEUDA && `Mínimo: ${formatMoney(item.pago_minimo)} • Tasa: ${item.interes || 0}%`}
              {type === ITEM_TYPES.SUSCRIPCION && `Ciclo: ${item.ciclo} • Próximo: ${new Date(item.proximo_pago).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
            </span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2 relative z-10">
          {/* Botón Ver Detalles (SIEMPRE VISIBLE) */}
          {onVerDetalle && (
            <button
              onClick={() => onVerDetalle(item, type)}
              className="flex-1 bg-white/5 hover:bg-blue-600/50 text-gray-400 hover:text-white py-2 rounded-lg font-semibold text-xs md:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-white/5"
              title="Ver detalles"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Ver
            </button>
          )}

          {/* Botón Editar */}
          <button
            onClick={() => onEditar(item, type)}
            className="p-2 bg-white/5 hover:bg-amber-600/50 hover:text-white rounded-lg text-gray-400 hover:shadow-lg hover:shadow-amber-900/20 transition-all active:scale-95 border border-white/5"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Botón Pagar (Si aplica y NO está pagado) */}
          {type !== ITEM_TYPES.VARIABLE && !isPaid && onPagar && (
            <button
              onClick={() => onPagar(item, type)}
              className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-emerald-500/20"
              title="Marcar como pagado"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {/* Botón Eliminar */}
          <button
            onClick={() => onEliminar(item, type)}
            className="p-2 bg-white/5 hover:bg-rose-600/50 text-gray-400 hover:text-white rounded-lg transition-all active:scale-95 border border-white/5 hover:border-rose-600"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // --- RENDERIZADO DE SECCIONES ---
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      
      {/* Sección: Deudas */}
      {deudas.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
            <div className={`p-2 rounded-lg ${typeConfig[ITEM_TYPES.DEUDA].bg} ${typeConfig[ITEM_TYPES.DEUDA].color} border border-opacity-30`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-white font-semibold text-lg md:text-xl flex items-center gap-2">
              {typeConfig[ITEM_TYPES.DEUDA].label} 
              <span className="text-xs md:text-sm bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                {deudas.length}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {deudas.map(d => renderCard(d, ITEM_TYPES.DEUDA))}
          </div>
        </section>
      )}

      {/* Sección: Gastos Fijos */}
      {gastosFijos.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-300 delay-75">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
            <div className={`p-2 rounded-lg ${typeConfig[ITEM_TYPES.FIJO].bg} ${typeConfig[ITEM_TYPES.FIJO].color} border border-opacity-30`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-white font-semibold text-lg md:text-xl flex items-center gap-2">
              {typeConfig[ITEM_TYPES.FIJO].label} 
              <span className="text-xs md:text-sm bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">
                {gastosFijos.length}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {gastosFijos.map(g => renderCard(g, ITEM_TYPES.FIJO))}
          </div>
        </section>
      )}

      {/* Sección: Suscripciones */}
      {suscripciones.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-300 delay-100">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
            <div className={`p-2 rounded-lg ${typeConfig[ITEM_TYPES.SUSCRIPCION].bg} ${typeConfig[ITEM_TYPES.SUSCRIPCION].color} border border-opacity-30`}>
              <Repeat className="w-5 h-5" />
            </div>
            <h3 className="text-white font-semibold text-lg md:text-xl flex items-center gap-2">
              {typeConfig[ITEM_TYPES.SUSCRIPCION].label} 
              <span className="text-xs md:text-sm bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                {suscripciones.filter(s => s.estado === 'Activo').length}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {suscripciones.map(s => renderCard(s, ITEM_TYPES.SUSCRIPCION))}
          </div>
        </section>
      )}

      {/* Sección: Gastos Variables */}
      {gastosVariables.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-300 delay-150">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
            <div className={`p-2 rounded-lg ${typeConfig[ITEM_TYPES.VARIABLE].bg} ${typeConfig[ITEM_TYPES.VARIABLE].color} border border-opacity-30`}>
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-white font-semibold text-lg md:text-xl flex items-center gap-2">
              {typeConfig[ITEM_TYPES.VARIABLE].label} 
              <span className="text-xs md:text-sm bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                {gastosVariables.length}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {gastosVariables.map(v => renderCard(v, ITEM_TYPES.VARIABLE))}
          </div>
        </section>
      )}

    </div>
  );
}