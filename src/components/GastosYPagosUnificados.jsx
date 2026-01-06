import React, { useState } from 'react'
import { 
  CreditCard, 
  TrendingDown, 
  Edit2, 
  Trash2, 
  Repeat, 
  ArrowRight,
  CheckCircle,
  DollarSign,
  Wallet // Importante: Se agregó Wallet
} from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('deudas') // deudas, fijos, variables, suscripciones

  // Función auxiliar para formatear moneda
  const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`

  // Función auxiliar para calcular días restantes o estado
  const getDaysOrStatus = (item, type) => {
    const today = new Date()
    today.setHours(0,0,0,0)

    if (type === 'deuda') {
      if (deudaPagadaEsteMes && deudaPagadaEsteMes(item.id)) return { text: 'PAGADA', color: 'text-green-400', bg: 'bg-green-500/20' }
      if (!item.vence) return { text: 'SIN FECHA', color: 'text-gray-400', bg: 'bg-gray-700' }
      const diff = Math.ceil((new Date(item.vence) - today) / (1000 * 60 * 60 * 24))
      if (diff <= 0) return { text: 'VENCIDA', color: 'text-red-400', bg: 'bg-red-500/20' }
      if (diff <= 5) return { text: `${diff} días`, color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
      return { text: `${diff} días`, color: 'text-green-400', bg: 'bg-green-500/20' }
    }

    if (type === 'fijo') {
      if (item.estado === 'Pagado') return { text: 'PAGADO', color: 'text-green-400', bg: 'bg-green-500/20' }
      const dueDate = new Date(today.getFullYear(), today.getMonth(), item.dia_venc)
      const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
      if (diff <= 0) return { text: 'VENCIDO', color: 'text-red-400', bg: 'bg-red-500/20' }
      return { text: `Día ${item.dia_venc}`, color: 'text-gray-400', bg: 'bg-gray-700' }
    }

    if (type === 'suscripcion') {
      if (item.estado !== 'Activo') return { text: item.estado.toUpperCase(), color: 'text-gray-500', bg: 'bg-gray-700' }
      if (!item.proximo_pago) return { text: 'PENDIENTE', color: 'text-gray-400', bg: 'bg-gray-700' }
      const diff = Math.ceil((new Date(item.proximo_pago) - today) / (1000 * 60 * 60 * 24))
      return { text: diff <= 0 ? 'HOY' : `${diff} días`, color: diff <= 2 ? 'text-orange-400' : 'text-blue-400', bg: diff <= 2 ? 'bg-orange-500/20' : 'bg-blue-500/20' }
    }

    if (type === 'variable') {
      return { text: new Date(item.fecha).toLocaleDateString(), color: 'text-gray-400', bg: 'bg-gray-700' }
    }

    return { text: '-', color: 'text-gray-400', bg: 'bg-gray-700' }
  }

  // Renderizado de Tarjeta Unificada
  const renderCard = (item, type) => {
    const status = getDaysOrStatus(item, type)
    const isPaid = status.text.includes('PAGAD') || status.text.includes('PAGADO')

    let title, subtitle, amount, icon, extraInfo
    
    switch(type) {
      case 'deuda':
        title = item.cuenta
        subtitle = item.tipo || 'Tarjeta de Crédito'
        amount = item.saldo
        icon = <CreditCard className="w-5 h-5 text-purple-400" />
        extraInfo = (
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-400">Mínimo: {formatMoney(item.pago_minimo)}</span>
            <span className="text-gray-400">APR: {item.apr ? `${(item.apr*100).toFixed(1)}%` : '0%'}</span>
          </div>
        )
        break
      case 'fijo':
        title = item.nombre
        subtitle = item.categoria || 'Gasto Fijo'
        amount = item.monto
        icon = <DollarSign className="w-5 h-5 text-red-400" />
        break
      case 'suscripcion':
        title = item.servicio
        subtitle = `${item.categoria} • ${item.ciclo}`
        amount = item.costo
        icon = <Repeat className="w-5 h-5 text-blue-400" />
        break
      case 'variable':
        title = item.descripcion
        subtitle = item.categoria || 'Gasto Variable'
        amount = item.monto
        icon = <TrendingDown className="w-5 h-5 text-orange-400" />
        break
      default:
        return null
    }

    return (
      <div
        key={item.id}
        className="bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition-all group"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-800">{icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">{title}</h3>
                {!isPaid && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.bg} ${status.color} border border-opacity-30`}>
                    {status.text}
                  </span>
                )}
                {isPaid && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> PAGADO
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              {extraInfo}
            </div>
          </div>
          
          <div className="text-right">
            <p className={`font-bold text-lg ${type === 'deuda' ? 'text-red-400' : 'text-white'}`}>
              {formatMoney(amount)}
            </p>
          </div>
        </div>

        {/* BARRA DE PROGRESO (Solo para deudas) */}
        {type === 'deuda' && (
          <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 mb-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
              style={{ width: `${Math.min((item.pago_minimo / item.saldo) * 100, 100)}%` }}
            />
          </div>
        )}

        {/* ACCIONES */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
          {onEditar && (
            <button
              onClick={() => onEditar(item, type)}
              className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Edit2 className="w-3 h-3" /> Editar
            </button>
          )}

          {/* Botón Pagar/Registrar */}
          {type !== 'variable' && !isPaid && onPagar && (
            <button
              onClick={() => onPagar(item, type)}
              className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white py-1.5 rounded flex items-center justify-center gap-1 transition-colors font-semibold"
            >
              <CheckCircle className="w-3 h-3" /> Pagar
            </button>
          )}

          {/* Si ya está pagado, permitir ver detalles */}
          {isPaid && alVerDetalle && (
             <button
              onClick={() => alVerDetalle(item, type)}
              className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowRight className="w-3 h-3" /> Ver
            </button>
          )}

          {onEliminar && (
            <button
              onClick={() => onEliminar(item, type)}
              className="px-3 bg-gray-700 hover:bg-red-600 text-white py-1.5 rounded flex items-center justify-center transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Renderizado del Contenido según Tab
  const renderContent = () => {
    let items = []
    let emptyMessage = ""
    let emptyIcon = ""

    switch(activeTab) {
      case 'deudas':
        items = deudas
        emptyMessage = "¡Sin deudas registradas!"
        emptyIcon = "🎉"
        break
      case 'fijos':
        items = gastosFijos
        emptyMessage = "Sin gastos fijos pendientes"
        emptyIcon = "📅"
        break
      case 'suscripciones':
        items = suscripciones
        emptyMessage = "Sin suscripciones activas"
        emptyIcon = "🔄"
        break
      case 'variables':
        items = gastosVariables
        emptyMessage = "Sin gastos variables recientes"
        emptyIcon = "📝"
        break
      default:
        return null
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12 h-48 flex flex-col items-center justify-center bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
          <div className="text-5xl mb-3 opacity-50">{emptyIcon}</div>
          <p className="text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-2">
        {items.map(item => renderCard(item, activeTab))}
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700 h-full flex flex-col">
      
      {/* HEADER Y TABS */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-400" />
            GESTIÓN DE PAGOS
          </h2>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-4 gap-2 bg-gray-900 p-1 rounded-xl">
          {[
            { id: 'deudas', label: 'Deudas', count: deudas.length },
            { id: 'fijos', label: 'Fijos', count: gastosFijos.length },
            { id: 'suscripciones', label: 'Subs', count: suscripciones.filter(s => s.estado === 'Activo').length },
            { id: 'variables', label: 'Vars', count: gastosVariables.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative py-2 px-1 rounded-lg text-xs font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center border border-gray-900
                  ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO DINÁMICO */}
      {renderContent()}
    </div>
  )
}

export default GastosYPagosUnificados