import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, // ✅ AGREGADO ESTO PARA ARREGLAR EL ERROR
  CreditCard, 
  Wallet, 
  ArrowLeftRight, 
  Activity, 
  PlusCircle, 
  MinusCircle
} from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

export default function ModuloCuentasBancarias({ 
  cuentas, 
  onAgregar, 
  onEditar, 
  onEliminar,
  balanceTotal
}) {
  const { cuentas: hookCuentas, updateCuenta } = useCuentasBancarias()
  
  // Usamos las cuentas pasadas por props, si no hay, usamos las del hook
  const cuentasList = cuentas && cuentas.length > 0 ? cuentas : hookCuentas

  // --- 1. ESTADOS DE TRANSFERENCIA ---
  const [montoTrans, setMontoTrans] = useState('')
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [transLoading, setTransLoading] = useState(false)
  const [msgTrans, setMsgTrans] = useState('')

  // --- 2. ESTADOS DE HISTORIAL (SIMULACIÓN) ---
  const [listaMovimientos, setListaMovimientos] = useState([])

  // --- 3. ESTADOS DE FORMULARIO (CREAR/EDITAR) ---
  const [verFormulario, setVerFormulario] = useState(false)
  const [cuentaEditando, setCuentaEditando] = useState(null)
  const [formNombre, setFormNombre] = useState('')
  const [formSaldo, setFormSaldo] = useState('')

  // Cargar Historial Simulado (TODO: Reemplazar con fetch a Supabase)
  useEffect(() => {
    setListaMovimientos([
      { id: 1, tipo: 'transferencia', monto: 500, ref: 'De Ahorros a Principal', fecha: 'Hace 2 min' },
      { id: 2, tipo: 'deposito', monto: 1500, ref: 'Abono', fecha: 'Hace 10 min' },
      { id: 3, tipo: 'retiro', monto: 200, ref: 'Cajero', fecha: 'Ayer' },
      { id: 4, tipo: 'pago', monto: 15.99, ref: 'Netflix', fecha: 'Hace 3 días' },
    ])
  }, [])

  // --- HANDLERS DEL FORMULARIO DE CUENTA ---
  useEffect(() => {
    if (verFormulario) {
      if (cuentaEditando) {
        // Modo Edición
        setFormNombre(cuentaEditando.nombre || '')
        setFormSaldo(cuentaEditando.balance ? String(cuentaEditando.balance) : '')
      } else {
        // Modo Creación
        setFormNombre('')
        setFormSaldo('')
      }
    }
  }, [verFormulario, cuentaEditando])

  const handleGuardarCuenta = async () => {
    if (!formNombre) {
      alert('El nombre es obligatorio')
      return
    }
    const saldoNum = parseFloat(formSaldo || 0)

    try {
      if (cuentaEditando) {
        // Modo Edición
        await updateCuenta(cuentaEditando.id, { nombre: formNombre, balance: saldoNum })
        console.log("✅ Cuenta actualizada")
      } else {
        // Modo Creación
        if (onAgregar) {
          await onAgregar({ nombre: formNombre, balance: saldoNum })
        } else {
          console.log("No se pasó prop onAgregar")
        }
      }
      setVerFormulario(false)
      setCuentaEditando(null)
      setFormNombre('')
      setFormSaldo('')
    } catch (err) {
      console.error("Error al guardar cuenta:", err)
      alert('Error al guardar la cuenta')
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

  // --- LÓGICA DE TRANSFERENCIA ---
  const handleTransferir = async () => {
    if (!origenId || !destinoId) {
      setMsgTrans('Selecciona cuenta de origen y destino')
      return
    }
    if (origenId === destinoId) {
      setMsgTrans('Las cuentas deben ser diferentes')
      return
    }
    if (!montoTrans || Number(montoTrans) <= 0) {
      setMsgTrans('Ingresa un monto válido')
      return
    }

    setTransLoading(true)
    setMsgTrans('')

    try {
      const montoNum = Number(montoTrans)
      const origen = cuentasList.find(c => c.id === origenId)
      const destino = cuentasList.find(c => c.id === destinoId)

      if (!origen || !destino) throw new Error('Cuentas no encontradas')

      if (origen.balance < montoNum) {
        setMsgTrans('Saldo insuficiente en la cuenta de origen')
        setTransLoading(false)
        return
      }

      // 1. Restar Origen
      await updateCuenta(origen.id, { balance: origen.balance - montoNum })
      // 2. Sumar Destino
      await updateCuenta(destino.id, { balance: destino.balance + montoNum })

      console.log("💰 Transferencia ejecutada:", { origen: origen.nombre, destino: destino.nombre, monto: montoNum })

      setMsgTrans('✅ Transferencia exitosa!')
      setMontoTrans('')
      setOrigenId('')
      setDestinoId('')

      setListaMovimientos(prev => [
        { 
          id: Date.now(), 
          tipo: 'transferencia', 
          monto: montoNum, 
          ref: `A ${origen.nombre}`, 
          fecha: 'Ahora' 
        },
        ...prev
      ])

    } catch (err) {
      console.error("Error transfiriendo:", err)
      setMsgTrans('Error al procesar la transferencia')
    } finally {
      setTransLoading(false)
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mis Cuentas</h2>
            <p className="text-xs text-gray-400">Saldo Total: <span className="text-blue-300 font-bold">${Number(balanceTotal || 0).toLocaleString()}</span></p>
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

      {/* --- SECCIÓN 1: TRANSFERENCIA ENTRE CUENTAS --- */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-xl p-4 md:p-5 border border-cyan-500/30 mb-6">
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
                // Limpiar destino si es igual al origen
                if (destinoId === e.target.value) setDestinoId('')
              }}
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-600 text-sm focus:border-cyan-500"
            >
              <option value="">Origen</option>
              {cuentasList.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.balance})</option>)}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-cyan-200 text-xs font-semibold mb-1">Destino</label>
            <select 
              value={destinoId} 
              onChange={(e) => setDestinoId(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-600 text-sm focus:border-cyan-500"
            >
              <option value="">Destino</option>
              {cuentasList.filter(c => c.id !== origenId).map(c => (
                <option key={c.id} value={c.id}>{c.nombre} (${c.balance})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-cyan-200 text-xs font-semibold mb-1">Monto</label>
            <input 
              type="number"
              placeholder="0.00"
              value={montoTrans} 
              onChange={(e) => setMontoTrans(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-600 text-sm focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button 
              onClick={handleTransferir}
              disabled={transLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {transLoading ? 'Enviando...' : <><ArrowLeftRight className="w-4 h-4"/> Transferir</>}
            </button>
          </div>
        </div>

        {msgTrans && (
          <div className={`text-xs font-medium mt-2 ${msgTrans.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
            {msgTrans}
          </div>
        )}
      </div>

      {/* --- SECCIÓN 2: HISTORIAL DE MOVIMIENTOS --- */}
      <div className="bg-gray-800/30 rounded-xl p-4 mb-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-bold text-sm">Historial Reciente</h3>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {listaMovimientos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              <div className="text-3xl mb-2">📂</div>
              Sin movimientos registrados
            </div>
          ) : (
            listaMovimientos.map((mov) => (
              <div key={mov.id} className="flex items-center justify-between text-sm bg-gray-900/50 p-2 rounded border border-gray-700/50">
                <div className="flex items-center gap-2">
                  {mov.tipo === 'deposito' && <PlusCircle className="w-4 h-4 text-green-400" />}
                  {mov.tipo === 'retiro' && <MinusCircle className="w-4 h-4 text-red-400" />}
                  {mov.tipo === 'transferencia' && <ArrowLeftRight className="w-4 h-4 text-cyan-400" />}
                  {mov.tipo === 'pago' && <Wallet className="w-4 h-4 text-yellow-400" />}
                  
                  <span className="text-gray-400">{mov.fecha}</span>
                  <span className="text-gray-300 italic truncate max-w-[100px]">{mov.ref}</span>
                </div>
                <span className={`font-bold ${mov.tipo === 'deposito' || mov.tipo === 'transferencia' ? 'text-green-400' : 'text-red-400'}`}>
                  {mov.tipo === 'retiro' ? '-' : '+'}${mov.monto}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- SECCIÓN 3: LISTA DE CUENTAS --- */}
      <div>
        {/* Formulario de Creación/Edición */}
        {verFormulario && (
          <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-700 shadow-inner space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold">
                {cuentaEditando ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h3>
              {/* Botón Cancelar (X) */}
              <button 
                onClick={handleCancelarEdicion}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Nombre (Ej: Ahorros)" 
              value={formNombre} 
              onChange={(e) => setFormNombre(e.target.value)} 
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
            <input 
              type="number" 
              placeholder="Saldo" 
              value={formSaldo} 
              onChange={(e) => setFormSaldo(e.target.value)} 
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
            <div className="flex gap-2">
              <button 
                onClick={handleGuardarCuenta} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold"
              >
                {cuentaEditando ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Grid de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentasList.map(cuenta => (
            <div 
              key={cuenta.id} 
              className="bg-gray-900/60 hover:bg-gray-900 border border-gray-700 p-4 rounded-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm md:text-base">{cuenta.nombre}</h3>
                    <p className="text-xs text-gray-400">{cuenta.tipo || 'Cuenta Principal'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    ${Number(cuenta.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
                <button 
                  onClick={() => handleEditarClick(cuenta)} 
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 py-2 rounded-lg text-sm font-semibold transition-colors border border-blue-500/30"
                >
                  <Edit2 className="w-4 h-4 mr-2"/> Editar
                </button>
                
                <button
                  onClick={() => {
                    setOrigenId(cuenta.id)
                    // Si el destino es igual a esta cuenta, lo limpiamos
                    if (destinoId === cuenta.id) setDestinoId('')
                  }}
                  className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 py-2 rounded-lg text-sm font-semibold transition-colors border border-cyan-500/30"
                  title="Iniciar transferencia"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2"/> Transferir
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar cuenta ${cuenta.nombre}?`)) {
                      onEliminar(cuenta.id)
                    }
                  }}
                  className="px-3 bg-gray-700 hover:bg-red-600 hover:bg-opacity-20 text-red-300 py-2 rounded-lg transition-colors border border-gray-600"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}