import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, X, CreditCard, Wallet, ArrowLeftRight, 
  Activity, PlusCircle, MinusCircle, ChevronLeft
} from 'lucide-react';
import { useCuentasBancarias } from '../hooks/useCuentasBancarias';
import { supabase } from '../lib/supabaseClient';

export default function ModuloCuentasBancarias({ 
  onAgregar, 
  onEditar, 
  onEliminar,
  onTransferenciaExitosa,
  onClose // ← Prop para cerrar el modal desde el padre
}) {
  const { cuentas, updateCuenta, refresh: refreshCuentas } = useCuentasBancarias();
  
  // --- ESTADOS DE TRANSFERENCIA ---
  const [montoTrans, setMontoTrans] = useState('');
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  const [msgTrans, setMsgTrans] = useState('');

  // --- ESTADOS DE HISTORIAL ---
  const [listaMovimientos, setListaMovimientos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  // --- ESTADOS DE FORMULARIO ---
  const [verFormulario, setVerFormulario] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState('Débito');
  const [formBanco, setFormBanco] = useState('');
  const [formUltimosDigitos, setFormUltimosDigitos] = useState('');
  const [formSaldo, setFormSaldo] = useState('');

  // ✅ BLOQUEAR SCROLL DEL BODY CUANDO EL MODAL ESTÁ ABIERTO
  useEffect(() => {
    // Guardar el scroll position actual
    const scrollY = window.scrollY;
    
    // Bloquear scroll del body
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    
    // Cleanup: restaurar scroll cuando se desmonta
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.body.style.width = '';
      // Restaurar posición de scroll
      window.scrollTo(0, scrollY);
    };
  }, []);

  // ✅ CALCULAR BALANCE TOTAL CORRECTAMENTE
  const balanceTotal = cuentas.reduce((sum, cuenta) => {
    const balance = Number(cuenta.balance || 0);
    return sum + balance;
  }, 0);

  // ✅ CARGAR HISTORIAL DESDE SUPABASE
  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No hay usuario autenticado');
        setLoadingHistorial(false);
        return;
      }

      const { data, error } = await supabase
        .from('movimientos_bancarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error cargando historial:', error);
        const historialLocal = localStorage.getItem('historial_bancarios_v2');
        if (historialLocal) setListaMovimientos(JSON.parse(historialLocal));
      } else {
        const movimientosConFecha = (data || []).map(m => ({
          ...m,
          fecha: new Date(m.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        }));
        setListaMovimientos(movimientosConFecha);
      }
    } catch (err) {
      console.error('Error en cargarHistorial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // ✅ GUARDAR MOVIMIENTO EN SUPABASE Y LOCALSTORAGE
  const agregarAlHistorial = async (nuevoMovimiento) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No hay usuario para guardar movimiento');
        return;
      }

      const movimientoData = {
        user_id: user.id,
        tipo: nuevoMovimiento.tipo,
        monto: Number(nuevoMovimiento.monto),
        descripcion: nuevoMovimiento.ref,
        cuenta_id: nuevoMovimiento.cuentaId || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('movimientos_bancarios')
        .insert([movimientoData])
        .select()
        .single();

      if (error) {
        console.error('Error guardando en BD:', error);
        const movimientoLocal = {
          id: Date.now(),
          ...nuevoMovimiento,
          fecha: new Date().toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        };
        setListaMovimientos(prev => [movimientoLocal, ...prev]);
        const historialActual = JSON.parse(localStorage.getItem('historial_bancarios_v2') || '[]');
        localStorage.setItem('historial_bancarios_v2', JSON.stringify([movimientoLocal, ...historialActual]));
      } else {
        const movimientoConFecha = {
          ...data,
          fecha: new Date(data.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          ref: data.descripcion,
          cuenta_nombre: nuevoMovimiento.cuentaNombre
        };
        setListaMovimientos(prev => [movimientoConFecha, ...prev]);
        const historialActual = JSON.parse(localStorage.getItem('historial_bancarios_v2') || '[]');
        localStorage.setItem('historial_bancarios_v2', JSON.stringify([movimientoConFecha, ...historialActual]));
      }
    } catch (err) {
      console.error('Error en agregarAlHistorial:', err);
    }
  };

  useEffect(() => {
    if (verFormulario) {
      if (cuentaEditando) {
        setFormNombre(cuentaEditando.nombre || '');
        setFormTipo(cuentaEditando.tipo_cuenta || cuentaEditando.tipo || 'Débito');
        setFormBanco(cuentaEditando.banco || '');
        setFormUltimosDigitos(cuentaEditando.ultimos_digitos || '');
        setFormSaldo(cuentaEditando.balance ? String(cuentaEditando.balance) : '');
      } else {
        setFormNombre('');
        setFormTipo('Débito');
        setFormBanco('');
        setFormUltimosDigitos('');
        setFormSaldo('');
      }
    }
  }, [verFormulario, cuentaEditando]);

  const handleGuardarCuenta = async () => {
    if (!formNombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    const saldoNum = parseFloat(formSaldo || 0);

    try {
      const dataCuenta = {
        nombre: formNombre.trim(),
        tipo_cuenta: formTipo,
        banco: formBanco.trim(),
        ultimos_digitos: formUltimosDigitos.trim(),
        balance: saldoNum
      };

      if (cuentaEditando) {
        await updateCuenta(cuentaEditando.id, dataCuenta);
        if (saldoNum !== Number(cuentaEditando.balance)) {
          const diferencia = saldoNum - Number(cuentaEditando.balance);
          await agregarAlHistorial({
            tipo: 'ajuste',
            monto: Math.abs(diferencia),
            ref: `Ajuste manual: ${formNombre} (${diferencia > 0 ? '+' : '-'}$${Math.abs(diferencia).toFixed(2)})`,
            cuentaId: cuentaEditando.id,
            cuentaNombre: formNombre
          });
        }
        alert('✅ Cuenta actualizada correctamente');
      } else {
        if (onAgregar) {
          const nuevaCuenta = await onAgregar(dataCuenta);
          if (saldoNum > 0) {
            await agregarAlHistorial({
              tipo: 'deposito',
              monto: saldoNum,
              ref: `Saldo inicial: ${formNombre}`,
              cuentaId: nuevaCuenta?.id,
              cuentaNombre: formNombre
            });
          }
          alert('✅ Cuenta creada correctamente');
        }
      }
      
      setVerFormulario(false);
      setCuentaEditando(null);
      setFormNombre('');
      setFormTipo('Débito');
      setFormBanco('');
      setFormUltimosDigitos('');
      setFormSaldo('');
      await refreshCuentas();
      
    } catch (err) {
      console.error("Error al guardar cuenta:", err);
      alert('Error al guardar la cuenta: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleEditarClick = (cuenta) => {
    setCuentaEditando(cuenta);
    setVerFormulario(true);
  };

  const handleTransferir = async () => {
    try {
      setTransLoading(true);

      const origen = cuentas.find(c => c.id === origenId);
      const destino = cuentas.find(c => c.id === destinoId);

      if (!origen || !destino) throw new Error('Cuentas no encontradas');
      if (origenId === destinoId) throw new Error('Las cuentas deben ser diferentes');
      if (!montoTrans || Number(montoTrans) <= 0) throw new Error('Monto inválido');

      if (Number(origen.balance) < Number(montoTrans)) throw new Error('Fondos insuficientes');

      const nuevoSaldoOrigen = Number(origen.balance) - Number(montoTrans);
      const nuevoSaldoDestino = Number(destino.balance) + Number(montoTrans);

      await updateCuenta(origen.id, { balance: nuevoSaldoOrigen });
      await updateCuenta(destino.id, { balance: nuevoSaldoDestino });

      await agregarAlHistorial({
        tipo: 'transferencia',
        monto: Number(montoTrans),
        ref: `${origen.nombre} ➝ ${destino.nombre}`,
        cuentaId: origen.id,
        cuentaNombre: origen.nombre
      });

      if (onTransferenciaExitosa) await onTransferenciaExitosa();

      setMsgTrans(`✅ Transferencia exitosa: $${Number(montoTrans).toFixed(2)} de ${origen.nombre} a ${destino.nombre}`);
      
      setTimeout(() => {
        setMontoTrans('');
        setOrigenId('');
        setDestinoId('');
        setMsgTrans('');
      }, 2000);

    } catch (err) {
      console.error('❌ ERROR EN TRANSFERENCIA:', err);
      setMsgTrans(`❌ Error: ${err.message || 'No se pudo completar la transferencia'}`);
    } finally {
      setTransLoading(false);
    }
  };

  // Helper iconos historial
  const getIconoYColor = (mov) => {
    if (mov.tipo === 'deposito' || mov.tipo === 'ingreso') return { icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, color: 'text-emerald-400', signo: '+' };
    if (mov.tipo === 'retiro' || mov.tipo === 'gasto') return { icon: <MinusCircle className="w-4 h-4 text-rose-400" />, color: 'text-rose-400', signo: '-' };
    if (mov.tipo === 'transferencia') return { icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400" />, color: 'text-cyan-400', signo: '' };
    if (mov.tipo === 'pago') return { icon: <Wallet className="w-4 h-4 text-yellow-400" />, color: 'text-yellow-400', signo: '-' };
    return { icon: <Activity className="w-4 h-4 text-gray-400" />, color: 'text-gray-400', signo: '' };
  };

  // Prevenir propagación de touch en el contenido
  const handleTouchMove = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <>
      {/* ✅ OVERLAY/BACKDROP - Pantalla completa */}
      <div 
        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />
      
      {/* ✅ MODAL CONTAINER - Fullscreen en mobile */}
      <div 
        className="fixed inset-0 z-[10000] flex items-end md:items-center md:justify-center"
        style={{ touchAction: 'none' }}
      >
        <div 
          className="
            w-full h-full 
            md:w-[95%] md:max-w-4xl md:h-auto md:max-h-[90vh]
            bg-gray-900 
            md:rounded-2xl 
            shadow-2xl 
            border-t md:border border-blue-500/30 
            flex flex-col
            overflow-hidden
          "
          onClick={(e) => e.stopPropagation()}
          onTouchMove={handleTouchMove}
        >
          
          {/* ✅ HEADER FIJO - Mobile friendly */}
          <div className="flex-shrink-0 sticky top-0 z-10 bg-gray-900 border-b border-gray-700 safe-area-top">
            <div className="flex items-center justify-between p-4 md:p-6">
              <div className="flex items-center gap-3">
                {/* Botón atrás en mobile */}
                <button 
                  onClick={onClose}
                  className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white active:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="bg-blue-600 p-2.5 md:p-3 rounded-xl shadow-lg shadow-blue-900/20">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-white">Mis Cuentas</h2>
                  <p className="text-gray-400 text-xs md:text-sm hidden md:block">Gestión de saldo y transferencias</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Balance total en header para mobile */}
                <div className="md:hidden text-right mr-2">
                  <p className="text-[10px] text-gray-500 uppercase">Total</p>
                  <p className={`text-sm font-bold ${balanceTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${balanceTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                {/* Botón cerrar en desktop */}
                <button 
                  onClick={onClose}
                  className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Balance total visible solo en desktop */}
            <div className="hidden md:block px-6 pb-4">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/20">
                <p className="text-gray-400 text-xs uppercase mb-1">Balance Total</p>
                <p className={`text-3xl font-bold ${balanceTotal >= 0 ? 'text-white' : 'text-red-400'}`}>
                  ${balanceTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* ✅ CONTENIDO SCROLLEABLE */}
          <div 
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
              
              {/* Botón Nueva Cuenta */}
              <button
                onClick={() => {
                  setCuentaEditando(null);
                  setVerFormulario(!verFormulario);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 md:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-5 h-5" /> 
                {verFormulario ? 'Cancelar' : 'Nueva Cuenta'}
              </button>

              {/* Formulario de Creación/Edición */}
              {verFormulario && (
                <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-blue-500/20 shadow-inner space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      {cuentaEditando ? 'Editar Cuenta' : 'Nueva Cuenta'}
                    </h3>
                    <button 
                      onClick={() => {
                        setCuentaEditando(null);
                        setVerFormulario(false);
                      }}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Nombre de la cuenta (Ej: Ahorros, Gastos)" 
                    value={formNombre} 
                    onChange={(e) => setFormNombre(e.target.value)} 
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={formTipo} 
                      onChange={(e) => setFormTipo(e.target.value)} 
                      className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      <option value="Débito">Débito</option>
                      <option value="Crédito">Crédito</option>
                      <option value="Ahorro">Ahorro</option>
                      <option value="Inversión">Inversión</option>
                    </select>
                    
                    <input 
                      type="text" 
                      placeholder="Banco" 
                      value={formBanco} 
                      onChange={(e) => setFormBanco(e.target.value)} 
                      className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>

                  <input 
                    type="text" 
                    placeholder="Últimos 4 dígitos (Opcional)" 
                    value={formUltimosDigitos} 
                    onChange={(e) => setFormUltimosDigitos(e.target.value.replace(/\D/g, ''))} 
                    maxLength="4"
                    inputMode="numeric"
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                  
                  <input 
                    type="number" 
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Saldo inicial"
                    value={formSaldo} 
                    onChange={(e) => setFormSaldo(e.target.value)} 
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                  />
                  
                  <button 
                    onClick={handleGuardarCuenta} 
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 md:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {cuentaEditando ? 'Actualizar' : 'Guardar Cuenta'}
                  </button>
                </div>
              )}

              {/* Grid de Tarjetas de Cuentas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {cuentas.map(cuenta => (
                  <div 
                    key={cuenta.id} 
                    className="bg-gray-800 rounded-2xl p-4 md:p-5 border border-gray-600 hover:border-blue-500/50 transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 text-[10px] md:text-xs font-medium uppercase truncate">{cuenta.banco || 'Banco'}</p>
                        <h4 className="text-white text-base md:text-lg font-bold truncate">{cuenta.nombre}</h4>
                      </div>
                      <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 flex-shrink-0 ml-2">
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                    </div>

                    <div className="mb-3 flex justify-between items-center text-xs text-gray-400 border-b border-gray-700 pb-3">
                      <span>{cuenta.tipo_cuenta || formTipo} {cuenta.ultimos_digitos ? `• ••••${cuenta.ultimos_digitos}` : ''}</span>
                      <span className={`text-lg md:text-xl font-bold ${Number(cuenta.balance) >= 0 ? 'text-white' : 'text-red-400'}`}>
                        ${Number(cuenta.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarClick(cuenta)} 
                        className="flex-1 bg-gray-700 hover:bg-blue-600 active:bg-blue-700 text-gray-200 hover:text-white py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar cuenta ${cuenta.nombre}?`)) {
                            onEliminar(cuenta.id);
                          }
                        }}
                        className="p-2.5 bg-gray-700 hover:bg-red-600 active:bg-red-700 text-gray-300 hover:text-white rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {cuentas.length === 0 && !verFormulario && (
                <div className="text-center py-12 md:py-16 bg-gray-800/30 rounded-2xl border border-gray-700 border-dashed">
                  <Wallet className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-base md:text-lg font-semibold mb-2">No tienes cuentas bancarias.</p>
                  <p className="text-gray-500 text-sm">Agrega tu primera cuenta para empezar.</p>
                </div>
              )}

              {/* HISTORIAL DE MOVIMIENTOS */}
              <div className="bg-gray-800/50 rounded-2xl p-4 md:p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-600">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <h3 className="text-white text-base md:text-lg font-bold">Historial Reciente</h3>
                  </div>
                  <button 
                    onClick={cargarHistorial}
                    className="text-blue-400 hover:text-blue-300 active:text-blue-500 text-sm font-bold transition-colors px-2 py-1"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="space-y-2 max-h-[250px] md:max-h-[300px] overflow-y-auto overscroll-contain">
                  {loadingHistorial ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
                      Cargando historial...
                    </div>
                  ) : listaMovimientos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <div className="text-3xl mb-2">📂</div>
                      Sin movimientos registrados
                    </div>
                  ) : (
                    listaMovimientos.map((mov) => {
                      const { icon, color, signo } = getIconoYColor(mov);
                      return (
                        <div 
                          key={mov.id} 
                          className="flex items-center justify-between text-sm bg-gray-900 p-3 rounded-xl border border-gray-700"
                        >
                          <div className="flex items-center gap-2 md:gap-3 overflow-hidden min-w-0 flex-1">
                            {icon}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-gray-300 font-medium truncate text-xs">{mov.ref || mov.descripcion}</span>
                              <div className="flex items-center gap-1 md:gap-2 text-[10px] text-gray-500">
                                <span>{mov.fecha}</span>
                                {mov.cuentaNombre && <span className="text-gray-600 truncate">• {mov.cuentaNombre}</span>}
                              </div>
                            </div>
                          </div>
                          <span className={`font-bold text-sm md:text-base ${color} whitespace-nowrap ml-2`}>
                            {signo}${Number(mov.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* TRANSFERENCIA ENTRE CUENTAS */}
              <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-2xl p-4 md:p-6 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                    <h3 className="text-white text-base md:text-lg font-bold">Transferencia Rápida</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <label className="block text-cyan-200 text-xs md:text-sm font-semibold mb-2">Origen</label>
                    <select 
                      value={origenId} 
                      onChange={(e) => {
                        setOrigenId(e.target.value);
                        if (destinoId === e.target.value) setDestinoId('');
                      }}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    >
                      <option value="">Seleccionar origen</option>
                      {cuentas.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-cyan-200 text-xs md:text-sm font-semibold mb-2">Destino</label>
                    <select 
                      value={destinoId} 
                      onChange={(e) => setDestinoId(e.target.value)}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    >
                      <option value="">Seleccionar destino</option>
                      {cuentas.filter(c => c.id !== origenId).map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-cyan-200 text-xs md:text-sm font-semibold mb-2">Monto</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                      <input 
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={montoTrans}
                        onChange={(e) => setMontoTrans(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-base"
                        disabled={transLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <button 
                      onClick={handleTransferir}
                      disabled={transLoading || !origenId || !destinoId || !montoTrans}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {transLoading ? 'Enviando...' : <span className="flex items-center gap-2">Transferir <ArrowLeftRight className="w-4 h-4" /></span>}
                    </button>
                  </div>
                </div>

                {msgTrans && (
                  <div className={`text-xs md:text-sm font-medium mt-3 p-3 rounded-lg ${
                    msgTrans.includes('✅') ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'
                  }`}>
                    {msgTrans}
                  </div>
                )}
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}