import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Calendar, DollarSign, FileText, Tag, CreditCard, CheckCircle, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { useCuentasBancarias } from '../hooks/useCuentasBancarias';

export default function ModalGastos({ onClose, onSaveVariable, onSaveFijo, gastoInicial = null }) {
  const { cuentas } = useCuentasBancarias();
  
  const [tipoGasto, setTipoGasto] = useState('variable');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: '',
    descripcion: '',
    monto: '',
    metodo: 'Efectivo',
    cuenta_id: '', 
    nombre: '',
    dia_venc: '',
    estado: 'Pendiente'
  });

  // Configuración de categorías predefinidas (puedes moverlas a constants si prefieres)
  const categoriasVariable = ['🍔 Comida', '🚗 Transporte', '🎬 Entretenimiento', '🛒 Ropa', '💊 Salud', '🏠 Hogar', '🎓 Educación', '🎁 Regalos', '📱 Teléfono', '⚡ Servicios', '📦 Otros'];
  const categoriasFijo = ['🏠 Renta/Hipoteca', '⚡ Luz', '💧 Agua', '📡 Internet', '📱 Teléfono Móvil', '🚗 Seguro Auto', '🏥 Seguro Médico', '🎓 Colegiatura', '💳 Préstamo', '📦 Otros'];

  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque'];

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (gastoInicial) {
      const esFijo = gastoInicial.dia_venc !== undefined;
      setTipoGasto(esFijo ? 'fijo' : 'variable');
      
      setFormData({
        fecha: gastoInicial.fecha || new Date().toISOString().split('T')[0],
        categoria: gastoInicial.categoria || '',
        descripcion: gastoInicial.descripcion || '',
        monto: gastoInicial.monto?.toString() || '',
        metodo: gastoInicial.metodo || 'Efectivo',
        cuenta_id: gastoInicial.cuenta_id || '',
        nombre: gastoInicial.nombre || '',
        dia_venc: gastoInicial.dia_venc?.toString() || '',
        estado: gastoInicial.estado || 'Pendiente'
      });
    } else {
      setTipoGasto('variable');
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        categoria: '',
        descripcion: '',
        monto: '',
        metodo: 'Efectivo',
        cuenta_id: '', 
        nombre: '',
        dia_venc: '',
        estado: 'Pendiente'
      });
    }
  }, [gastoInicial]);

  const handleSubmit = async () => {
    setError('');
    
    // Validaciones Generales
    if (!formData.categoria || !formData.monto) {
      setError('Por favor completa categoría y monto');
      return;
    }

    if (tipoGasto === 'fijo' && !formData.nombre) {
      setError('Por favor completa el nombre del gasto fijo');
      return;
    }

    if (tipoGasto === 'fijo' && !formData.dia_venc) {
      setError('Por favor ingresa el día de vencimiento (1-31)');
      return;
    }

    setLoading(true);

    try {
      if (tipoGasto === 'variable') {
        const payload = {
          fecha: formData.fecha,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          monto: parseFloat(formData.monto),
          metodo: formData.metodo,
          cuenta_id: formData.cuenta_id || null
        };
        
        if (gastoInicial?.id) {
          payload.id = gastoInicial.id;
        }
        
        await onSaveVariable(payload);
      } else {
        const payload = {
          id: gastoInicial?.id, 
          nombre: formData.nombre,
          categoria: formData.categoria,
          monto: parseFloat(formData.monto),
          dia_venc: parseInt(formData.dia_venc),
          estado: formData.estado,
          cuenta_id: formData.cuenta_id || null
        };
        
        await onSaveFijo(payload);
      }

      onClose();
    } catch (err) {
      console.error("Error al guardar gasto:", err);
      setError(err?.message || 'Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-lg md:max-h-[85vh] overflow-y-auto rounded-3xl md:rounded-2xl border border-white/10 shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800/80 p-4 md:p-6 rounded-t-3xl md:rounded-t-2xl border-b border-red-500/30 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
                <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {gastoInicial ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h2>
                {gastoInicial && (
                  <p className="text-red-100 text-xs md:text-sm mt-0.5">
                    Editando: {gastoInicial.nombre || gastoInicial.descripcion}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={loading}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs de Tipo */}
        <div className="bg-gray-800/50 p-4 border-b border-white/5 sticky top-[88px] md:top-[120px] z-10">
          <label className="block text-gray-300 mb-3 font-medium text-sm md:text-base">Tipo de Gasto</label>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button 
              type="button"
              onClick={() => setTipoGasto('variable')} 
              disabled={loading}
              className={`p-3 md:p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                tipoGasto === 'variable' 
                  ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/30 scale-[1.02]' 
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50'
              }`}
            >
              <div className="text-2xl md:text-3xl mb-1">🛒</div>
              <div className="font-bold text-sm md:text-base">Variable</div>
              <div className="text-[10px] md:text-xs opacity-80">Gasto único</div>
            </button>
            
            <button 
              type="button"
              onClick={() => setTipoGasto('fijo')} 
              disabled={loading}
              className={`p-3 md:p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                tipoGasto === 'fijo' 
                  ? 'bg-yellow-600 border-yellow-600 text-white shadow-lg shadow-yellow-900/30 scale-[1.02]' 
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50'
              }`}
            >
              <div className="text-2xl md:text-3xl mb-1">📅</div>
              <div className="font-bold text-sm md:text-base">Fijo</div>
              <div className="text-[10px] md:text-xs opacity-80">Recurrente</div>
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-4 md:mx-6 mt-4 bg-red-500/10 border border-red-500 text-red-200 px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario Scrollable */}
        <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
          
          {tipoGasto === 'variable' ? (
            <>
              {/* FECHA */}
              <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Calendar className="w-4 h-4 text-blue-400" /> Fecha
                </label>
                <input 
                  type="date" 
                  value={formData.fecha} 
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }} // Fix iOS
                />
              </div>

              {/* CATEGORÍA */}
              <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Tag className="w-4 h-4 text-purple-400" /> Categoría *
                </label>
                <select 
                  value={formData.categoria} 
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasVariable.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* DESCRIPCIÓN */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <FileText className="w-4 h-4 text-gray-400" /> Descripción
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Supermercado" 
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* MONTO */}
              <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Monto *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={formData.monto} 
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* CUENTA */}
              <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
                  <CreditCard className="w-4 h-4 text-blue-400" /> Cuenta de pago
                </label>
                <select 
                  value={formData.cuenta_id || ''} 
                  onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (${Number(c.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* MÉTODO */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <BarChart3 className="w-4 h-4 text-purple-400" /> Método
                </label>
                <select 
                  value={formData.metodo} 
                  onChange={(e) => setFormData({ ...formData, metodo: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                >
                  {metodosPago.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* NOMBRE */}
              <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <FileText className="w-4 h-4 text-yellow-400" /> Nombre del Servicio *
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Renta, Luz" 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* CATEGORÍA */}
              <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Tag className="w-4 h-4 text-purple-400" /> Categoría *
                </label>
                <select 
                  value={formData.categoria} 
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasFijo.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* MONTO Y DÍA */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                  <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Monto *
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.monto} 
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })} 
                    disabled={loading}
                    className="w-full bg-gray-800 text-white px-3 py-2 md:px-3 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                  <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
                    <Calendar className="w-4 h-4 text-blue-400" /> Día
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="31" 
                    placeholder="15" 
                    value={formData.dia_venc} 
                    onChange={(e) => setFormData({ ...formData, dia_venc: e.target.value })} 
                    disabled={loading}
                    className="w-full bg-gray-800 text-white px-3 py-2 md:px-3 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
              
              {/* CUENTA */}
              <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
                  <CreditCard className="w-4 h-4 text-blue-400" /> Cuenta de pago
                </label>
                <select 
                  value={formData.cuenta_id || ''} 
                  onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (${Number(c.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* ESTADO */}
              <div>
                <label className="block text-gray-300 mb-3 text-sm md:text-base">Estado</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, estado: 'Pendiente' })} 
                    disabled={loading} 
                    className={`p-2.5 md:p-3 rounded-xl border-2 transition-all text-sm md:text-base font-semibold ${
                      formData.estado === 'Pendiente' 
                        ? 'bg-yellow-600 border-yellow-600 text-white shadow-lg' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50'
                    }`}
                  >
                    ⏳ Pendiente
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, estado: 'Pagado' })} 
                    disabled={loading} 
                    className={`p-2.5 md:p-3 rounded-xl border-2 transition-all text-sm md:text-base font-semibold ${
                      formData.estado === 'Pagado' 
                        ? 'bg-green-600 border-green-600 text-white shadow-lg' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50'
                    }`}
                  >
                    ✅ Pagado
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Sticky */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-white/5 z-20">
          <div className="flex gap-3 md:gap-4">
            <button 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 px-3 md:px-4 py-3 md:py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`flex-1 px-3 md:px-4 py-3 md:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base ${
                tipoGasto === 'variable' ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/20'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />}
              {loading ? 'Guardando...' : (gastoInicial ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}