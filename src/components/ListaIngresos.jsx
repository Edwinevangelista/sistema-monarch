import React, { useState } from 'react';
import { DollarSign, Edit2, Trash2, Calendar, FileText, TrendingUp, Search, Filter, X, Building2, ChevronDown } from 'lucide-react';

export default function ListaIngresos({ ingresos, onEditar, onEliminar }) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const [mostrarModalBusqueda, setMostrarModalBusqueda] = useState(false);

  if (!ingresos || ingresos.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Ingresos Recientes
        </h3>
        <div className="text-center py-8">
          <div className="text-5xl mb-3">💰</div>
          <p className="text-gray-400">No tienes ingresos registrados</p>
        </div>
      </div>
    );
  }

  const ingresosOrdenados = [...ingresos].sort((a, b) => 
    new Date(b.fecha) - new Date(a.fecha)
  );

  const ingresosAMostrar = mostrarTodos ? ingresosOrdenados : ingresosOrdenados.slice(0, 5);
  const totalIngresos = ingresos.reduce((sum, ing) => sum + Number(ing.monto || 0), 0);

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ingresos Recientes</h3>
              <p className="text-xs text-gray-400">{ingresos.length} registros</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-xl font-bold text-green-400">${totalIngresos.toLocaleString()}</p>
            </div>
            
            <button
              onClick={() => setMostrarModalBusqueda(true)}
              className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
              title="Buscar y filtrar"
            >
              <Search className="w-5 h-5 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Total Mobile */}
        <div className="md:hidden bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total de ingresos</span>
            <span className="text-xl font-bold text-green-400">${totalIngresos.toLocaleString()}</span>
          </div>
        </div>

        {/* Lista de Ingresos */}
        <div className="space-y-2">
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

        {/* Botón Ver Más */}
        {ingresos.length > 5 && (
          <button
            onClick={() => setMostrarTodos(!mostrarTodos)}
            className="w-full mt-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            {mostrarTodos ? 'Ver menos' : `Ver todos (${ingresos.length})`}
            <ChevronDown className={`w-4 h-4 transition-transform ${mostrarTodos ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Modal de Detalles */}
      {ingresoSeleccionado && (
        <ModalDetallesIngreso
          ingreso={ingresoSeleccionado}
          onClose={() => setIngresoSeleccionado(null)}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      )}

      {/* Modal de Búsqueda */}
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

// ============================================
// COMPONENTE INDIVIDUAL DE INGRESO
// ============================================
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
      className="bg-gray-700/30 hover:bg-gray-700/50 rounded-xl p-3 transition-all group cursor-pointer active:scale-98"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Info Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
            <h4 className="text-white font-semibold truncate text-sm">
              {ingreso.fuente || 'Ingreso'}
            </h4>
            {esMesActual(ingreso.fecha) && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                Este mes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatearFecha(ingreso.fecha)}
            </span>
            {ingreso.descripcion && (
              <span className="flex items-center gap-1 truncate">
                <FileText className="w-3 h-3" />
                {ingreso.descripcion}
              </span>
            )}
          </div>

          {/* Indicador de toque */}
          <div className="text-xs text-gray-500 mt-1 md:hidden">
            👆 Toca para ver detalles
          </div>
        </div>

        {/* Monto y Acciones */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-lg font-bold text-green-400">
              ${Number(ingreso.monto).toLocaleString()}
            </p>
          </div>

          {/* Menú de Acciones */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors"
            >
              <div className="text-gray-400 text-xl leading-none">⋮</div>
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />

                <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-20 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditar(ingreso);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-blue-300 hover:bg-blue-500/20 flex items-center gap-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  
                  <div className="border-t border-gray-700" />
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
                        onEliminar(ingreso.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
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

// ============================================
// MODAL DE DETALLES DEL INGRESO
// ============================================
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/40 to-green-800/20 p-6 rounded-t-2xl relative border-b border-green-500/30">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{ingreso.fuente}</h2>
              <p className="text-green-400 text-3xl font-bold">${Number(ingreso.monto).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          
          {/* Fecha */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400 font-semibold">Fecha de Ingreso</span>
            </div>
            <p className="text-white text-lg capitalize">{formatearFecha(ingreso.fecha)}</p>
          </div>

          {/* Cuenta Bancaria */}
          {ingreso.cuenta_nombre && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400 font-semibold">Cuenta Asignada</span>
              </div>
              <p className="text-white text-lg">{ingreso.cuenta_nombre}</p>
              <p className="text-gray-400 text-sm mt-1">El saldo se actualizó automáticamente</p>
            </div>
          )}

          {/* Descripción */}
          {ingreso.descripcion && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-gray-400 font-semibold">Descripción</span>
              </div>
              <p className="text-white">{ingreso.descripcion}</p>
            </div>
          )}

          {/* Detalles adicionales */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">📊 Información adicional</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ID de registro:</span>
                <span className="text-gray-300 font-mono text-xs">{ingreso.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha de creación:</span>
                <span className="text-gray-300">
                  {new Date(ingreso.created_at || ingreso.fecha).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                onEditar(ingreso);
                onClose();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Editar
            </button>

            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
                  onEliminar(ingreso.id);
                  onClose();
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODAL DE BÚSQUEDA Y FILTROS
// ============================================
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 p-4 border-b border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Buscar Ingresos</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="p-4 border-b border-gray-700 space-y-3">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fuente o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Toggle Filtros */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2 text-white">
              <Filter className="w-4 h-4" />
              Filtros avanzados
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
          </button>

          {/* Filtros */}
          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mes</label>
                <select
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-xs text-gray-400 mb-1">Ordenar por</label>
                <select
                  value={ordenar}
                  onChange={(e) => setOrdenar(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fecha-desc">Más reciente</option>
                  <option value="fecha-asc">Más antiguo</option>
                  <option value="monto-desc">Mayor monto</option>
                  <option value="monto-asc">Menor monto</option>
                </select>
              </div>
            </div>
          )}

          {/* Resumen */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {ingresosFiltrados.length} resultado{ingresosFiltrados.length !== 1 ? 's' : ''}
              </span>
              <span className="text-lg font-bold text-blue-400">
                ${totalFiltrado.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto p-4">
          {ingresosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-400">No se encontraron resultados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ingresosFiltrados.map((ingreso) => (
                <IngresoItem
                  key={ingreso.id}
                  ingreso={ingreso}
                  onEditar={onEditar}
                  onEliminar={onEliminar}
                  onClick={() => onSeleccionar(ingreso)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}