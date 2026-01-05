// src/components/ModuloCuentasBancarias.jsx
// ✅ MÓDULO COMPLETO - Gestión de cuentas bancarias y débito

import React, { useState } from 'react'
import { Wallet, Plus, Edit, Trash2, MoreVertical, X, Edit2, ChevronRight } from 'lucide-react'

export default function ModuloCuentasBancarias({ cuentas, onAgregar, onEditar, onEliminar }) {
  const [showModal, setShowModal] = useState(false)
  const [cuentaSeleccionada, setShowDetalle] = useState(null)

  const totalBalance = cuentas?.reduce((sum, c) => sum + (Number(c.balance) || 0), 0) || 0

  return (
    <>
      <div className="bg-gray-800 rounded-2xl p-4 md:p-6 shadow-xl border-2 border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 md:w-6 md:h-6" />
            💳 MIS CUENTAS
          </h2>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Balance Total</p>
            <p className="text-base md:text-lg font-bold text-green-400 leading-none">
              ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Lista de cuentas */}
        {(!cuentas || cuentas.length === 0) ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 text-sm mb-4">No tienes cuentas registradas</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Agregar Cuenta
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
              {cuentas.map((cuenta) => (
                <TarjetaCuenta
                  key={cuenta.id}
                  cuenta={cuenta}
                  onVer={() => setShowDetalle(cuenta)}
                  onEditar={() => onEditar(cuenta)}
                  onEliminar={() => {
                    if (window.confirm(`¿Eliminar cuenta ${cuenta.nombre}?`)) {
                      onEliminar(cuenta.id)
                    }
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Nueva Cuenta
            </button>
          </>
        )}
      </div>

      {/* Modal Agregar/Editar */}
      {showModal && (
        <ModalCuenta
          onClose={() => setShowModal(false)}
          onSave={(datos) => {
            onAgregar(datos)
            setShowModal(false)
          }}
        />
      )}

      {/* Modal Detalles */}
      {cuentaSeleccionada && (
        <ModalDetallesCuenta
          cuenta={cuentaSeleccionada}
          onClose={() => setShowDetalle(null)}
          onEditar={() => {
            onEditar(cuentaSeleccionada)
            setShowDetalle(null)
          }}
        />
      )}
    </>
  )
}

// ========== TARJETA DE CUENTA ==========
function TarjetaCuenta({ cuenta, onVer, onEditar, onEliminar }) {
  const [showMenu, setShowMenu] = useState(false)
  const balance = Number(cuenta.balance) || 0
  const esNegativo = balance < 0

  return (
    <div
      onClick={onVer}
      className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30 hover:border-blue-500 transition cursor-pointer relative overflow-hidden group"
    >
      {/* Icono de tipo */}
      <div className="absolute top-2 right-2">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-white/10 rounded transition"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-gray-800 rounded-lg shadow-xl border border-gray-600 overflow-hidden z-20">
                <button
                  onClick={() => {
                    onEditar()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-700 flex items-center gap-2 text-blue-300 border-b border-gray-700 text-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onEliminar()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-700 flex items-center gap-2 text-red-300 text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nombre y tipo */}
      <div className="mb-3">
        <h3 className="text-white font-bold text-base mb-1">{cuenta.nombre}</h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-[10px] uppercase font-bold rounded">
            {cuenta.tipo || 'Débito'}
          </span>
          {cuenta.banco && (
            <span className="text-gray-400 text-xs">{cuenta.banco}</span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="flex items-baseline gap-2">
        <DollarSign className="w-5 h-5 text-gray-400" />
        <span className={`text-2xl font-bold ${esNegativo ? 'text-red-400' : 'text-white'}`}>
          ${Math.abs(balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Últimos 4 dígitos */}
      {cuenta.ultimos_digitos && (
        <div className="mt-2 text-gray-400 text-xs">
          •••• {cuenta.ultimos_digitos}
        </div>
      )}
    </div>
  )
}

// ========== MODAL AGREGAR/EDITAR ==========
function ModalCuenta({ cuenta, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: cuenta?.nombre || '',
    tipo: cuenta?.tipo || 'Débito',
    banco: cuenta?.banco || '',
    balance: cuenta?.balance?.toString() || '',
    ultimos_digitos: cuenta?.ultimos_digitos || '',
    notas: cuenta?.notas || ''
  })

  const handleSubmit = () => {
    if (!formData.nombre || !formData.balance) {
      alert('Por favor completa los campos requeridos')
      return
    }

    onSave({
      ...formData,
      balance: parseFloat(formData.balance)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full border-2 border-blue-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-blue-500/30 p-4 md:p-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-400" />
              {cuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-4 md:p-6 space-y-4">
          
          {/* Nombre */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-semibold">
              Nombre de la Cuenta *
            </label>
            <input
              type="text"
              placeholder="Ej: Cuenta Principal, Ahorros..."
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo y Banco */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Débito">Débito</option>
                <option value="Ahorro">Ahorro</option>
                <option value="Inversión">Inversión</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">Banco</label>
              <input
                type="text"
                placeholder="Ej: Chase, BofA..."
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-semibold">
              Balance Actual *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Últimos 4 dígitos */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-semibold">
              Últimos 4 dígitos (opcional)
            </label>
            <input
              type="text"
              maxLength="4"
              placeholder="1234"
              value={formData.ultimos_digitos}
              onChange={(e) => setFormData({ ...formData, ultimos_digitos: e.target.value.replace(/\D/g, '') })}
              className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-semibold">Notas</label>
            <textarea
              placeholder="Información adicional..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows="2"
              className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-blue-500/30 p-4 md:p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
            >
              {cuenta ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========== MODAL DETALLES ==========
function ModalDetallesCuenta({ cuenta, onClose, onEditar }) {
  const balance = Number(cuenta.balance) || 0
  const esNegativo = balance < 0

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full border-2 border-blue-500 shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{cuenta.nombre}</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                  {cuenta.tipo}
                </span>
                {cuenta.banco && (
                  <span className="text-white/80 text-sm">{cuenta.banco}</span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          
          {/* Balance */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Balance Actual</div>
            <div className={`text-4xl font-bold ${esNegativo ? 'text-red-400' : 'text-green-400'}`}>
              ${Math.abs(balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            {esNegativo && (
              <div className="text-red-400 text-xs mt-2">⚠️ Sobregiro</div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-2">
            {cuenta.ultimos_digitos && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400 text-sm">Número de cuenta</span>
                <span className="text-white font-mono">•••• {cuenta.ultimos_digitos}</span>
              </div>
            )}

            {cuenta.notas && (
              <div className="py-2">
                <div className="text-gray-400 text-sm mb-1">Notas</div>
                <p className="text-white text-sm">{cuenta.notas}</p>
              </div>
            )}
          </div>

          {/* Botón Editar */}
          <button
            onClick={onEditar}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            <Edit2 className="w-4 h-4" />
            Editar Cuenta
          </button>
        </div>
      </div>
    </div>
  )
}