import React, { useState } from 'react';
import { 
  CreditCard, 
  TrendingDown, 
  Edit2, 
  Trash2, 
  Repeat, 
  ArrowRight,
  CheckCircle,
  DollarSign,
  Wallet,
  Calendar,
  Clock
} from 'lucide-react';

// Configuración de tipos de tarjetas
const CARD_TYPES = {
  deuda: { color: 'border-purple-500/20', bg: 'bg-purple-500/5', icon: CreditCard, iconColor: 'text-purple-400' },
  fijo: { color: 'border-orange-500/20', bg: 'bg-orange-500/5', icon: Calendar, iconColor: 'text-orange-400' },
  suscripciones: { color: 'border-blue-500/20', bg: 'bg-blue-500/5', icon: Repeat, iconColor: 'text-blue-400' },
  variable: { color: 'border-red-500/20', bg: 'bg-red-500/5', icon: TrendingDown, iconColor: 'text-red-400' },
};

const GastosYPagosUnificados = ({
  deudas = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudaPagadaEsteMes,
  onEditar,
  onEliminar,
  onPagar,
  alVerDetalle
}) => {
  const [activeTab, setActiveTab] = useState('deudas'); // Default: ver deudas

  // Helper: Formatear moneda
  const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper: Calcular lógica de estado (Días, Color, Badge)
  const getStatusInfo = (item, type) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    if (type === 'deuda') {
      if (deudaPagadaEsteMes && deudaPagadaEsteMes(item.id)) {
        return { text: 'Pagado', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: CheckCircle };
      }
      if (!item.vence) return { text: 'Sin Fecha', color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Clock };
      
      const vence = new Date(item.vence);
      // Ajustar vencimiento si es este mes pero ya pasó el día
      let diff = Math.ceil((vence - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) return { text: 'Vencido', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30', icon: AlertCircle };
      if (diff <= 3) return { text: `${diff} días`, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: TrendingDown };
      return { text: `${diff} días`, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: Calendar };
    }

    if (type === 'fijo') {
      if (item.estado === 'Pagado') return { text: 'Pagado', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: CheckCircle };
      
      const dueDate = new Date(today.getFullYear(), today.getMonth(), item.dia_venc);
      let diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) return { text: 'Vencido', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30', icon: AlertCircle };
      return { text: `Día ${item.dia_venc}`, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: Calendar };
    }

    if (type === 'suscripciones') {
      if (item.estado !== 'Activo') return { text: item.estado, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Clock };
      
      const proxPago = new Date(item.proximo_pago);
      let diff = Math.ceil((proxPago - today) / (1000 * 60 * 60 * 24));
      if (diff <= 0) return { text: 'Hoy', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30', icon: Zap };
      if (diff <= 2) return { text: `${diff} días`, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: AlertCircle };
      return { text: `${diff} días`, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: Repeat };
    }

    if (type === 'variable') {
      return { text: new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Calendar };
    }

    return { text: 'N/A', color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Clock };
  };

  // --- RENDERIZADO DE TARJETA UNIFICADA ---
  const renderCard = (item, type) => {
    const status = getStatusInfo(item, type);
    const isPaid = status.text.includes('Pagado') || status.text.includes('Pagada');
    const typeConfig = CARD_TYPES[type] || CARD_TYPES.variable;

    let title, subtitle, amount, extraContent;

    switch (type) {
      case 'deuda':
        title = item.cuenta || item.nombre || 'Deuda';
        subtitle = 'Tarjeta de Crédito';
        amount = item.saldo;
        extraContent = (
          <>
            <div className="flex justify-between text-xs text-gray-400 mt-2 mb-3 border-b border-white/5 pb-2">
              <span>Mínimo: {formatMoney(item.pago_minimo)}</span>
              <span>Tasa: {item.interes}%</span>
            </div>
            {/* Barra de progreso pequeña */}
            <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all" style={{ width: `${Math.min(100, (item.pago_minimo / item.saldo) * 100)}%` }} />
            </div>
          </>
        );
        break;
      case 'fijo':
        title = item.nombre;
        subtitle = item.categoria || 'Gasto Fijo';
        amount = item.monto;
        break;
      case 'suscripciones':
        title = item.servicio;
        subtitle = `${item.categoria} • ${item.ciclo}`;
        amount = item.costo;
        break;
      case 'variable':
        title = item.descripcion || item.categoria;
        subtitle = item.categoria || 'Gasto Variable';
        amount = item.monto;
        break;
      default:
        return null;
    }

    return (
      <div
        key={item.id}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all duration-300 group relative overflow-hidden"
      >
        {/* Fondo decorativo sutil según tipo */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${typeConfig.bg}`} />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${typeConfig.bg} ${typeConfig.color} shadow-sm`}>
              <typeConfig.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base truncate max-w-[150px]">{title}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
            </div>
          </div>
          
          <div className="text-right relative z-10">
            {isPaid ? (
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}>
                {status.text}
              </span>
            ) : (
              <span className={`text-sm font-bold ${type === 'deuda' ? 'text-rose-400' : 'text-white'}`}>
                {formatMoney(amount)}
              </span>
            )}
          </div>
        </div>

        {/* EXTRA INFO (Solo para deudas o contenido largo) */}
        {extraContent}

        {/* ACCIONES */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 relative z-10">
          {onEditar && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditar(item, type); }}
              className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg text-gray-400 hover:shadow-lg hover:shadow-blue-900/30 transition-all duration-300"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {/* Botón Pagar (Fijo/Sub/Deuda) */}
          {type !== 'variable' && !isPaid && onPagar && (
            <button
              onClick={(e) => { e.stopPropagation(); onPagar(item, type); }}
              className="flex-1 p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-emerald-900/30 transition-all duration-300 flex items-center justify-center gap-1.5 border border-emerald-500/20"
              title="Pagar"
            >
              <CheckCircle className="w-4 h-4" /> Pagar
            </button>
          )}

          {/* Botón Ver Detalles */}
          {isPaid && alVerDetalle && (
             <button
              onClick={(e) => { e.stopPropagation(); alVerDetalle(item, type); }}
              className="flex-1 p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-900/30 transition-all duration-300 flex items-center justify-center gap-1.5 border border-blue-500/20"
            >
              <ArrowRight className="w-4 h-4" /> Detalle
            </button>
          )}

          {/* Botón Eliminar */}
          {onEliminar && (
            <button
              onClick={(e) => { e.stopPropagation(); onEliminar(item, type); }}
              className="p-2 bg-red-500/10 hover:bg-red-500 text-gray-400 hover:text-white rounded-lg transition-all duration-300"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // --- RENDERIZADO DE CONTENIDO ---
  const renderContent = () => {
    let items = [];
    let emptyMessage = "";
    let emptyIcon = "";
    let emptyAction = null;

    switch (activeTab) {
      case 'deudas':
        items = deudas;
        emptyMessage = "¡Felicidades! No tienes deudas registradas.";
        emptyIcon = "🎉";
        break;
      case 'fijos':
        items = gastosFijos;
        emptyMessage = "Sin gastos fijos pendientes.";
        emptyIcon = "📅";
        break;
      case 'suscripciones':
        items = suscripciones;
        emptyMessage = "Sin suscripciones activas.";
        emptyIcon = "🚫";
        break;
      case 'variables':
        items = gastosVariables;
        emptyMessage = "Sin gastos variables recientes.";
        emptyIcon = "📉";
        break;
      default:
        return null;
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
          <div className="text-4xl mb-3 opacity-50 grayscale">{emptyIcon}</div>
          <p className="text-gray-400 text-sm">{emptyMessage}</p>
          {activeTab === 'deudas' && (
            <button onClick={() => {/* Acción para agregar deuda */}} className="mt-4 text-purple-400 text-sm font-semibold hover:text-purple-300">
              Registrar Deuda
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 pb-20 md:pb-0 custom-scrollbar">
        {items.map(item => renderCard(item, activeTab))}
      </div>
    );
  };

  // --- COMPONENTE PRINCIPAL ---
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl h-full flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30 text-blue-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">Gestión de Pagos</h2>
            <p className="text-gray-400 text-xs">Unificado</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-4 gap-2 bg-gray-800/50 p-1 rounded-xl mb-6">
        {[
          { id: 'deudas', label: 'Deudas', count: deudas.length, icon: CreditCard },
          { id: 'fijos', label: 'Fijos', count: gastosFijos.length, icon: Calendar },
          { id: 'suscripciones', label: 'Subs', count: suscripciones.filter(s => s.estado === 'Activo').length, icon: Repeat },
          { id: 'variables', label: 'Vars', count: gastosVariables.length, icon: TrendingDown },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative py-2 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
            `}
          >
            <div className="flex items-center justify-center gap-1.5 md:gap-2">
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`
                  absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center border
                  ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'}
                `}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {renderContent()}
      </div>
    </div>
  );
}

export default GastosYPagosUnificados;