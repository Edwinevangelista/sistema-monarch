import React, { useState } from 'react';
import { DollarSign, Edit2, Trash2, Calendar, FileText, TrendingUp, Search, Filter, X, Building2, ChevronDown, CreditCard } from 'lucide-react';

// --- COMPONENTE PRINCIPAL ---
export default function ListaIngresos({ ingresos, onEditar, onEliminar }) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const [mostrarModalBusqueda, setMostrarModalBusqueda] = useState(false);

  if (!ingresos || ingresos.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Ingresos Recientes</h3>
            <p className="text-xs text-gray-400">Historial financiero</p>
          </div>
        </div>
        <div className="text-center py-12 h-48 flex flex-col items-center justify-center bg-black/20 rounded-xl border border-dashed border-gray-700">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <CreditCard className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">No tienes ingresos registrados</p>
        </div>
      </div>
    );
  }

  const ingresosOrdenados = [...ingresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Optimización: Mostrar todos en escritorio, paginar en móvil si es necesario
  const ingresosAMostrar = mostrarTodos ? ingresosOrdenados : ingresosOrdenados.slice(0, 10);
  const totalIngresos = ingresos.reduce((sum, ing) => sum + Number(ing.monto || 0), 0);

  return (
    <>
      {/* Contenedor Principal */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 h-full flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-sm">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Ingresos</h3>
              <p className="text-xs text-gray-400">{ingresos.length} registros</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Total */}
            <div className="hidden md:block text-right">
              <p className="text-[10px] text-gray-400 uppercase">Total</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400">${totalIngresos.toLocaleString()}</p>
            </div>
            
            {/* Botón Buscar */}
            <button
              onClick={() => setMostrarModalBusqueda(true)}
              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
              title="Buscar y filtrar"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Total Mobile */}
        <div className="md:hidden bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-6 flex items-center justify-between">
          <span className="text-sm text-emerald-200 font-semibold">Total del periodo</span>
          <span className="text-lg font-bold text-emerald-400">${totalIngresos.toLocaleString()}</span>
        </div>

        {/* Lista (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-20 md:pb-0">
          <div className="space-y-3">
            {ingresosAMostrar.map((ingreso) => (
              <IngresoItem 
                key={ingreso.id} 
                ingreso={ingreso}
                onEditar={onEditar}
                onEliminar={onEliminar}
                onClick={() => setIngresoSeleccionado(ingreso)}
              />
            ))}
          </div>

          {/* Botón "Ver Más" */}
          {ingresos.length > 10 && (
            <button
              onClick={() => setMostrarTodos(!mostrarTodos)}
              className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm border border-white/10 hover:border-white/20"
            >
              {mostrarTodos ? 'Ver menos' : `Ver todos (${ingresos.length})`}
              <ChevronDown className={`w-4 h-4 transition-transform ${mostrarTodos ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE DETALLES (Sub-Componente) */}
      {ingresoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
             <ModalDetallesIngreso
              ingreso={ingresoSeleccionado}
              onClose={() => setIngresoSeleccionado(null)}
              onEditar={onEditar}
              onEliminar={onEliminar}
            />
          </div>
        </div>
      )}

      {/* MODAL DE BÚSQUEDA (Sub-Componente) */}
      {mostrarModalBusqueda && (
        <ModalBusquedaIngresos
          ingresos={ingresos}
          onClose={() => setMostrarModalBusqueda(false)}
          onSeleccionar={(ingreso) => {
            setIngresoSeleccionado(ingreso);
            setMostrarModalBusqueda(false);
          }}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      )}
    </>
  );
}

// --- ITEM DE INGRESO (Card Mobile / Row Desktop) ---
function IngresoItem({ ingreso, onEditar, onEliminar, onClick }) {
  const [showMenu, setShowMenu] = useState(false);

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const esMesActual = (fecha) => {
    const fechaIngreso = new Date(fecha);
    const hoy = new Date();
    return fechaIngreso.getMonth() === hoy.getMonth() && 
           fechaIngreso.getFullYear() === hoy.getFullYear();
  };

  return (
    <div 
      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all duration-200 group cursor-pointer active:scale-[0.99] relative overflow-hidden"
      onClick={onClick}
    >
      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-20 transition-opacity" />

      {/* Estructura Grid: Icono + Info + Monto + Menu */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_2fr_auto_auto_auto] items-center gap-3 md:gap-6 relative z-10">
        
        {/* Icono */}
        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
          <TrendingUp className="w-5 h-5" />
        </div>

        {/* Info Principal */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-semibold text-sm md:text-base truncate">
              {ingreso.fuente || 'Ingreso'}
            </h4>
            {esMesActual(ingreso.fecha) && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Este mes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span className="truncate">{formatearFecha(ingreso.fecha)}</span>
            {ingreso.descripcion && (
              <>
                <span className="text-gray-600">•</span>
                <span className="truncate hidden md:inline-block">{ingreso.descripcion}</span>
              </>
            )}
          </div>
        </div>

        {/* Monto */}
        <div className="text-right">
          <p className="text-lg md:text-xl font-bold text-emerald-400">
            ${Number(ingreso.monto).toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500 hidden md:block">Total</p>
        </div>

        {/* Acciones */}
        <div className="relative flex items-center gap-1">
          {/* Botón Editar Directo */}
          <button
            onClick={(e) => { e.stopPropagation(); onEditar(ingreso); }}
            className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg text-gray-400 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Menú Hamburguesa */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <div className="text-gray-500 text-xl leading-none">⋮</div>
            </button>

            {/* Dropdown Menú */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditar(ingreso);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-blue-300 hover:bg-blue-900/20 hover:text-blue-200 transition-colors flex items-center gap-3"
                  >
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <div className="h-px bg-gray-700 mx-4" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
                        onEliminar(ingreso.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-900/20 hover:text-red-200 transition-colors flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MODAL DE DETALLES ---
function ModalDetallesIngreso({ ingreso, onClose, onEditar, onEliminar }) {
  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/20 backdrop-blur-md p-6 rounded-t-2xl border-b border-white/5">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400 shadow-lg">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{ingreso.fuente}</h2>
            <p className="text-emerald-300 text-xl md:text-2xl font-bold">
              ${Number(ingreso.monto).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido Scrollable */}
      <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Fecha */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-xs uppercase font-bold">Fecha de Ingreso</span>
          </div>
          <p className="text-white text-lg capitalize">{formatearFecha(ingreso.fecha)}</p>
        </div>

        {/* Cuenta Bancaria */}
        {ingreso.cuenta_nombre && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-xs uppercase font-bold">Cuenta Asignada</span>
            </div>
            <p className="text-white text-lg">{ingreso.cuenta_nombre}</p>
            <p className="text-gray-500 text-xs mt-1">El saldo se actualizó automáticamente</p>
          </div>
        )}

        {/* Descripción */}
        {ingreso.descripcion && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 text-xs uppercase font-bold">Descripción</span>
            </div>
            <p className="text-white text-base">{ingreso.descripcion}</p>
          </div>
        )}

        {/* Detalles Técnicos */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Información técnica</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">ID de registro:</span>
              <span className="text-gray-300 font-mono text-xs">{ingreso.id.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">Fecha de creación:</span>
              <span className="text-gray-300">{new Date(ingreso.created_at || ingreso.fecha).toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Botones */}
      <div className="p-6 border-t border-white/10 bg-gray-900/50 rounded-b-2xl flex gap-3">
        <button
          onClick={() => {
            onEditar(ingreso);
            onClose();
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          <Edit2 className="w-5 h-5" /> Editar
        </button>

        <button
          onClick={() => {
            if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
              onEliminar(ingreso.id);
              onClose();
            }
          }}
          className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
        >
          <Trash2 className="w-5 h-5" /> Eliminar
        </button>
      </div>
    </div>
  );
}

// --- MODAL DE BÚSQUEDA ---
function ModalBusquedaIngresos({ ingresos, onClose, onSeleccionar, onEditar, onEliminar }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMes, setFiltroMes] = useState('todos');
  const [ordenar, setOrdenar] = useState('fecha-desc');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Obtener meses únicos
  const mesesUnicos = [...new Set(ingresos.map(ing => {
    const fecha = new Date(ing.fecha);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  // Filtrar y ordenar
  let ingresosFiltrados = ingresos.filter(ing => {
    const cumpleBusqueda = busqueda === '' || 
      ing.fuente?.toLowerCase().includes(busqueda.toLowerCase()) ||
      ing.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    
    if (filtroMes === 'todos') return cumpleBusqueda;
    
    const fechaIng = new Date(ing.fecha);
    const mesIng = `${fechaIng.getFullYear()}-${String(fechaIng.getMonth() + 1).padStart(2, '0')}`;
    return cumpleBusqueda && mesIng === filtroMes;
  });

  // Ordenar
  ingresosFiltrados.sort((a, b) => {
    if (ordenar === 'fecha-desc') return new Date(b.fecha) - new Date(a.fecha);
    if (ordenar === 'fecha-asc') return new Date(a.fecha) - new Date(b.fecha);
    if (ordenar === 'monto-desc') return Number(b.monto) - Number(a.monto);
    if (ordenar === 'monto-asc') return Number(a.monto) - Number(b.monto);
    return 0;
  });

  const totalFiltrado = ingresosFiltrados.reduce((sum, ing) => sum + Number(ing.monto || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/20 backdrop-blur-md p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Buscador Financiero</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* Buscador y Filtros */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por fuente o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all"
            >
              <span className="flex items-center gap-2 text-white font-medium">
                <Filter className="w-4 h-4 text-blue-400" />
                Filtros avanzados
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
            </button>

            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-bold">Mes</label>
                  <select
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none"
                  >
                    <option value="todos">Todos los meses</option>
                    {mesesUnicos.map(mes => {
                      const [year, month] = mes.split('-');
                      const fecha = new Date(year, month - 1);
                      return (
                        <option key={mes} value={mes}>
                          {fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-bold">Ordenar por</label>
                  <select
                    value={ordenar}
                    onChange={(e) => setOrdenar(e.target.value)}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none"
                  >
                    <option value="fecha-desc">Más reciente</option>
                    <option value="fecha-asc">Más antiguo</option>
                    <option value="monto-desc">Mayor monto</option>
                    <option value="monto-asc">Menor monto</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Resumen Filtros */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-blue-200 text-xs md:text-sm font-medium">
              {ingresosFiltrados.length} resultado{ingresosFiltrados.length !== 1 ? 's' : ''}
            </span>
            <span className="text-white font-bold text-lg md:text-xl">
              ${totalFiltrado.toLocaleString()}
            </span>
          </div>

          {/* Lista Resultados */}
          <div className="space-y-3">
            {ingresosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-50">🔍</div>
                <p className="text-gray-400">No se encontraron resultados</p>
              </div>
            ) : (
              ingresosFiltrados.map((ingreso) => (
                <IngresoItem
                  key={ingreso.id}
                  ingreso={ingreso}
                  onEditar={onEditar}
                  onEliminar={onEliminar}
                  onClick={() => onSeleccionar(ingreso)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}