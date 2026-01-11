import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CreditCard, 
  Wallet, 
  ArrowLeftRight, 
  Activity, 
  PlusCircle, 
  MinusCircle
} from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'
import { supabase } from '../lib/supabaseClient'

export default function ModuloCuentasBancarias({ 
  onAgregar, 
  onEditar, 
  onEliminar,
  onTransferenciaExitosa
}) {
  const { cuentas, updateCuenta, refresh: refreshCuentas } = useCuentasBancarias()
  
  // --- ESTADOS DE TRANSFERENCIA ---
  const [montoTrans, setMontoTrans] = useState('')
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [transLoading, setTransLoading] = useState(false)
  const [msgTrans, setMsgTrans] = useState('')

  // --- ESTADOS DE HISTORIAL ---
  const [listaMovimientos, setListaMovimientos] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(true)

  // --- ESTADOS DE FORMULARIO ---
  const [verFormulario, setVerFormulario] = useState(false)
  const [cuentaEditando, setCuentaEditando] = useState(null)
  const [formNombre, setFormNombre] = useState('')
  const [formTipo, setFormTipo] = useState('Débito')
  const [formBanco, setFormBanco] = useState('')
  const [formUltimosDigitos, setFormUltimosDigitos] = useState('')
  const [formSaldo, setFormSaldo] = useState('')

  // ✅ CALCULAR BALANCE TOTAL CORRECTAMENTE
  const balanceTotal = cuentas.reduce((sum, cuenta) => {
    const balance = Number(cuenta.balance || 0)
    console.log(`Cuenta ${cuenta.nombre}: $${balance}`)
    return sum + balance
  }, 0)

  console.log('💰 Balance Total Calculado:', balanceTotal)

  // ✅ CARGAR HISTORIAL DESDE SUPABASE
  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('No hay usuario autenticado')
        setLoadingHistorial(false)
        return
      }

      const { data, error } = await supabase
        .from('movimientos_bancarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error cargando historial:', error)
        // Si la tabla no existe, usar localStorage como fallback
        const historialLocal = localStorage.getItem('historial_bancarios_v2')
        if (historialLocal) {
          setListaMovimientos(JSON.parse(historialLocal))
        }
      } else {
        console.log('✅ Historial cargado:', data?.length || 0, 'movimientos')
        setListaMovimientos(data || [])
      }
    } catch (err) {
      console.error('Error en cargarHistorial:', err)
      // Fallback a localStorage
      const historialLocal = localStorage.getItem('historial_bancarios_v2')
      if (historialLocal) {
        setListaMovimientos(JSON.parse(historialLocal))
      }
    } finally {
      setLoadingHistorial(false)
    }
  }

  // ✅ GUARDAR MOVIMIENTO EN SUPABASE Y LOCALSTORAGE
  const agregarAlHistorial = async (nuevoMovimiento) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('No hay usuario para guardar movimiento')
        return
      }

      // Preparar datos para Supabase
      const movimientoData = {
        user_id: user.id,
        tipo: nuevoMovimiento.tipo,
        monto: Number(nuevoMovimiento.monto),
        descripcion: nuevoMovimiento.ref,
        cuenta_id: nuevoMovimiento.cuentaId || null,
        cuenta_nombre: nuevoMovimiento.cuentaNombre || null,
        created_at: new Date().toISOString()
      }

      console.log('💾 Guardando movimiento:', movimientoData)

      // Intentar guardar en Supabase
      const { data, error } = await supabase
        .from('movimientos_bancarios')
        .insert([movimientoData])
        .select()
        .single()

      if (error) {
        console.error('Error guardando en BD:', error)
        // Fallback: guardar solo en estado local
        const movimientoLocal = {
          id: Date.now(),
          ...nuevoMovimiento,
          fecha: new Date().toLocaleString('es-MX', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }
        setListaMovimientos(prev => [movimientoLocal, ...prev])
        
        // Guardar en localStorage como backup
        const historialActual = JSON.parse(localStorage.getItem('historial_bancarios_v2') || '[]')
        localStorage.setItem('historial_bancarios_v2', JSON.stringify([movimientoLocal, ...historialActual]))
      } else {
        console.log('✅ Movimiento guardado en BD:', data)
        // Agregar al estado con formato de fecha
        const movimientoConFecha = {
          ...data,
          fecha: new Date(data.created_at).toLocaleString('es-MX', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          ref: data.descripcion
        }
        setListaMovimientos(prev => [movimientoConFecha, ...prev])
        
        // Actualizar localStorage
        const historialActual = JSON.parse(localStorage.getItem('historial_bancarios_v2') || '[]')
        localStorage.setItem('historial_bancarios_v2', JSON.stringify([movimientoConFecha, ...historialActual]))
      }
    } catch (err) {
      console.error('Error en agregarAlHistorial:', err)
    }
  }

  useEffect(() => {
    if (verFormulario) {
      if (cuentaEditando) {
        setFormNombre(cuentaEditando.nombre || '')
        setFormTipo(cuentaEditando.tipo_cuenta || cuentaEditando.tipo || 'Débito')
        setFormBanco(cuentaEditando.banco || '')
        setFormUltimosDigitos(cuentaEditando.ultimos_digitos || '')
        setFormSaldo(cuentaEditando.balance ? String(cuentaEditando.balance) : '')
      } else {
        setFormNombre('')
        setFormTipo('Débito')
        setFormBanco('')
        setFormUltimosDigitos('')
        setFormSaldo('')
      }
    }
  }, [verFormulario, cuentaEditando])

  const handleGuardarCuenta = async () => {
    if (!formNombre.trim()) {
      alert('El nombre es obligatorio')
      return
    }
    const saldoNum = parseFloat(formSaldo || 0)

    try {
      const dataCuenta = {
        nombre: formNombre.trim(),
        tipo_cuenta: formTipo,
        banco: formBanco.trim(),
        ultimos_digitos: formUltimosDigitos.trim(),
        balance: saldoNum
      }

      if (cuentaEditando) {
        // EDITAR
        await updateCuenta(cuentaEditando.id, dataCuenta)
        
        // Si cambió el saldo, registrar ajuste
        if (saldoNum !== Number(cuentaEditando.balance)) {
          const diferencia = saldoNum - Number(cuentaEditando.balance)
          await agregarAlHistorial({
            tipo: 'ajuste',
            monto: Math.abs(diferencia),
            ref: `Ajuste manual: ${formNombre} (${diferencia > 0 ? '+' : '-'}$${Math.abs(diferencia).toFixed(2)})`,
            cuentaId: cuentaEditando.id,
            cuentaNombre: formNombre
          })
        }
        
        alert('✅ Cuenta actualizada correctamente')
      } else {
        // AGREGAR NUEVA
        if (onAgregar) {
          const nuevaCuenta = await onAgregar(dataCuenta)
          
          // Registrar saldo inicial si es mayor a 0
          if (saldoNum > 0) {
            await agregarAlHistorial({
              tipo: 'deposito',
              monto: saldoNum,
              ref: `Saldo inicial: ${formNombre}`,
              cuentaId: nuevaCuenta?.id,
              cuentaNombre: formNombre
            })
          }
          
          alert('✅ Cuenta creada correctamente')
        }
      }
      
      // Limpiar formulario
      setVerFormulario(false)
      setCuentaEditando(null)
      setFormNombre('')
      setFormTipo('Débito')
      setFormBanco('')
      setFormUltimosDigitos('')
      setFormSaldo('')
      
      // Refrescar cuentas
      await refreshCuentas()
      
    } catch (err) {
      console.error("Error al guardar cuenta:", err)
      alert('Error al guardar la cuenta: ' + (err.message || 'Error desconocido'))
    }
  }

  const handleEditarClick = (cuenta) => {
    setCuentaEditando(cuenta)
    setVerFormulario(true)
  }

  const handleCancelarEdicion = () => {
    setCuentaEditando(null)
    setVerFormulario(false)
  }

  const handleTransferir = async () => {
    if (!origenId || !destinoId) {
      setMsgTrans('❌ Selecciona cuenta de origen y destino')
      return
    }
    if (origenId === destinoId) {
      setMsgTrans('❌ Las cuentas deben ser diferentes')
      return
    }
    if (!montoTrans || Number(montoTrans) <= 0) {
      setMsgTrans('❌ Ingresa un monto válido')
      return
    }

    setTransLoading(true)
    setMsgTrans('')

    try {
      const montoNum = Number(montoTrans)
      const origen = cuentas.find(c => c.id === origenId)
      const destino = cuentas.find(c => c.id === destinoId)

      console.log('📊 TRANSFERENCIA INICIADA')
      console.log('💰 Monto:', montoNum)
      console.log('📤 Origen:', { id: origen?.id, nombre: origen?.nombre, saldo_antes: origen?.balance })
      console.log('📥 Destino:', { id: destino?.id, nombre: destino?.nombre, saldo_antes: destino?.balance })

      if (!origen || !destino) {
        throw new Error('Cuentas no encontradas')
      }

      if (Number(origen.balance) < montoNum) {
        setMsgTrans(`❌ Saldo insuficiente. Disponible: $${Number(origen.balance).toFixed(2)}`)
        setTransLoading(false)
        return
      }

      const nuevoSaldoOrigen = Number(origen.balance) - montoNum
      const nuevoSaldoDestino = Number(destino.balance) + montoNum

      console.log('🔄 Nuevos saldos calculados:')
      console.log('  Origen:', origen.balance, '→', nuevoSaldoOrigen)
      console.log('  Destino:', destino.balance, '→', nuevoSaldoDestino)

      // Actualizar ambas cuentas
      await updateCuenta(origen.id, { balance: nuevoSaldoOrigen })
      console.log('✅ Cuenta origen actualizada')

      await updateCuenta(destino.id, { balance: nuevoSaldoDestino })
      console.log('✅ Cuenta destino actualizada')

      // Registrar en historial
      await agregarAlHistorial({
        tipo: 'transferencia',
        monto: montoNum,
        ref: `${origen.nombre} ➝ ${destino.nombre}`,
        cuentaId: origen.id,
        cuentaNombre: origen.nombre
      })

      console.log('✅ TRANSFERENCIA COMPLETADA')

      // Refrescar cuentas
      await refreshCuentas()
      
      if (onTransferenciaExitosa) {
        await onTransferenciaExitosa()
      }

      setMsgTrans(`✅ Transferencia exitosa: $${montoNum.toFixed(2)} de ${origen.nombre} a ${destino.nombre}`)
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        setMontoTrans('')
        setOrigenId('')
        setDestinoId('')
        setMsgTrans('')
      }, 2000)

    } catch (err) {
      console.error('❌ ERROR EN TRANSFERENCIA:', err)
      setMsgTrans(`❌ Error: ${err.message || 'No se pudo completar la transferencia'}`)
    } finally {
      setTransLoading(false)
    }
  }

  const getIconoYColor = (mov) => {
    switch (mov.tipo) {
      case 'deposito': 
      case 'ingreso': 
        return { icon: <PlusCircle className="w-4 h-4 text-green-400" />, color: 'text-green-400', signo: '+' }
      case 'retiro': 
      case 'gasto': 
        return { icon: <MinusCircle className="w-4 h-4 text-red-400" />, color: 'text-red-400', signo: '-' }
      case 'transferencia': 
        return { icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400" />, color: 'text-cyan-400', signo: '' }
      case 'pago': 
        return { icon: <Wallet className="w-4 h-4 text-yellow-400" />, color: 'text-yellow-400', signo: '-' }
      case 'ajuste': 
        return { icon: <Edit2 className="w-4 h-4 text-blue-400" />, color: 'text-blue-400', signo: '' }
      default: 
        return { icon: <Activity className="w-4 h-4 text-gray-400" />, color: 'text-gray-400', signo: '' }
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
      
      {/* --- 1. HEADER --- */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mis Cuentas</h2>
            <p className="text-xs text-gray-400">
              Saldo Total: <span className="text-blue-300 font-bold">
                ${balanceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setCuentaEditando(null)
            setVerFormulario(!verFormulario)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Cuenta
        </button>
      </div>

      {/* --- 2. GESTIÓN DE CUENTAS (Formulario y Lista) MOVIDO ARRIBA --- */}
      <div>
        {/* Formulario de Creación/Edición */}
        {verFormulario && (
          <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-700 shadow-inner space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold">
                {cuentaEditando ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h3>
              <button 
                onClick={handleCancelarEdicion}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Nombre de la cuenta *" 
              value={formNombre} 
              onChange={(e) => setFormNombre(e.target.value)} 
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
            
            <select 
              value={formTipo} 
              onChange={(e) => setFormTipo(e.target.value)} 
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-700"
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
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
            
            <input 
              type="text" 
              placeholder="Últimos 4 dígitos" 
              maxLength="4"
              value={formUltimosDigitos} 
              onChange={(e) => setFormUltimosDigitos(e.target.value.replace(/\D/g, ''))} 
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
            
            <input 
              type="number" 
              step="0.01"
              placeholder="Saldo inicial" 
              value={formSaldo} 
              onChange={(e) => setFormSaldo(e.target.value)} 
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
            
            <div className="flex gap-2">
              <button 
                onClick={handleGuardarCuenta} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {cuentaEditando ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Grid de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentas.map(cuenta => (
            <div 
              key={cuenta.id} 
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-5 rounded-xl transition-all hover:shadow-xl hover:border-blue-500/50"
            >
              {/* Header con banco y tipo */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase">{cuenta.banco || 'Banco'}</p>
                  <p className="text-white font-bold text-lg">{cuenta.nombre}</p>
                </div>
                <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              {/* Tipo y últimos dígitos */}
              <div className="mb-4">
                <p className="text-gray-400 text-xs">{cuenta.tipo_cuenta || cuenta.tipo || 'Débito'}</p>
                <p className="text-gray-500 text-sm font-mono">
                  •••• •••• •••• {cuenta.ultimos_digitos || '****'}
                </p>
              </div>

              {/* Saldo */}
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Saldo disponible</p>
                <p className={`text-2xl font-bold ${
                  Number(cuenta.balance) >= 0 ? 'text-white' : 'text-red-400'
                }`}>
                  ${Number(cuenta.balance || 0).toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditarClick(cuenta)} 
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 py-2 rounded-lg text-xs font-semibold transition-colors border border-blue-500/30 flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3 h-3"/> Editar
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar cuenta ${cuenta.nombre}?`)) {
                      onEliminar(cuenta.id)
                    }
                  }}
                  className="px-3 bg-gray-700 hover:bg-red-600/20 text-red-300 py-2 rounded-lg transition-colors border border-gray-600"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {cuentas.length === 0 && !verFormulario && (
          <div className="text-center py-12 text-gray-500">
            <Wallet className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">No tienes cuentas registradas</p>
            <p className="text-sm mb-4">Agrega tu primera cuenta para empezar a gestionar tu dinero</p>
            <button
              onClick={() => setVerFormulario(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Crear Primera Cuenta
            </button>
          </div>
        )}
      </div>

      {/* --- 3. HISTORIAL DE MOVIMIENTOS MOVIDO AL MEDIO --- */}
      <div className="bg-gray-800/30 rounded-xl p-4 mt-6 border border-gray-700">
        <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="text-white font-bold text-sm">Historial Reciente</h3>
          </div>
          <button 
            onClick={cargarHistorial}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Actualizar
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {loadingHistorial ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
              Cargando historial...
            </div>
          ) : listaMovimientos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              <div className="text-3xl mb-2">📂</div>
              Sin movimientos registrados
            </div>
          ) : (
            listaMovimientos.map((mov) => {
              const { icon, color, signo } = getIconoYColor(mov)
              return (
                <div 
                  key={mov.id} 
                  className="flex items-center justify-between text-sm bg-gray-900/50 p-2 rounded border border-gray-700/50 hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {icon}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-gray-300 font-medium truncate text-xs">
                        {mov.ref || mov.descripcion}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {mov.fecha || new Date(mov.created_at).toLocaleString('es-MX', { 
                          day: '2-digit', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {mov.cuentaNombre || mov.cuenta_nombre ? ` • ${mov.cuentaNombre || mov.cuenta_nombre}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className={`font-bold text-xs whitespace-nowrap ml-2 ${color}`}>
                    {signo}${Number(mov.monto).toFixed(2)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* --- 4. TRANSFERENCIA ENTRE CUENTAS MOVIDO AL FINAL --- */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-xl p-4 md:p-5 border border-cyan-500/30 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-cyan-300 font-bold flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" /> Transferencia Rápida
          </h3>
          <span className="text-xs text-gray-400">Mueve dinero entre tus cuentas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="block text-cyan-200 text-xs font-semibold mb-1">Origen</label>
            <select 
              value={origenId} 
              onChange={(e) => {
                setOrigenId(e.target.value)
                if (destinoId === e.target.value) setDestinoId('')
              }}
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-600 text-sm focus:border-cyan-500"
            >
              <option value="">Seleccionar origen</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (${Number(c.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-cyan-200 text-xs font-semibold mb-1">Destino</label>
            <select 
              value={destinoId} 
              onChange={(e) => setDestinoId(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-600 text-sm focus:border-cyan-500"
            >
              <option value="">Seleccionar destino</option>
              {cuentas.filter(c => c.id !== origenId).map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (${Number(c.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-cyan-200 text-xs font-semibold mb-1">Monto</label>
            <input 
              type="number"
              step="0.01"
              placeholder="0.00"
              value={montoTrans} 
              onChange={(e) => setMontoTrans(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-600 text-sm focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button 
              onClick={handleTransferir}
              disabled={transLoading || !origenId || !destinoId || !montoTrans}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {transLoading ? (
                'Enviando...'
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4"/> Transferir
                </>
              )}
            </button>
          </div>
        </div>

        {msgTrans && (
          <div className={`text-xs font-medium mt-2 p-2 rounded ${
            msgTrans.includes('✅') 
              ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            {msgTrans}
          </div>
        )}
      </div>

    </div>
  )
}