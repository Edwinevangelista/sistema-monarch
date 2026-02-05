import React from 'react'

const KPICard = ({ icon, label, value, color, formatAsCurrency = true }) => {
  const formatValue = (val) => {
    if (formatAsCurrency) {
      return `$${Math.abs(val).toLocaleString('es-MX')}`
    }
    return `${(val * 100).toFixed(1)}%`
  }

  return (
    <div 
      className="rounded-2xl p-6 shadow-xl border-2"
      style={{ 
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderColor: `${color}99`
      }}
    >
      <div className="text-center">
        <div className="text-5xl mb-2">{icon}</div>
        <div className="text-sm font-semibold text-white text-opacity-90 mb-2">
          {label}
        </div>
        <div className="text-3xl font-bold text-white">
          {formatValue(value)}
        </div>
      </div>
    </div>
  )
}

export default KPICard