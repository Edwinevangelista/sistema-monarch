import React from 'react';
import { TrendingUp, Wallet, Activity } from 'lucide-react';

const KPICard = ({ 
  icon, 
  label, 
  value, 
  color, 
  formatAsCurrency = true, 
  suffix = '' 
}) => {
  const formatValue = (val) => {
    if (formatAsCurrency) {
      return `$${Math.abs(Number(val || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${val}${suffix}`;
  };

  // Determinar icono basado en la etiqueta si no se pasa uno explícito
  const IconComponent = icon || (() => {
    if (label.toLowerCase().includes('gasto')) return TrendingDown;
    if (label.toLowerCase().includes('ingreso') || label.toLowerCase().includes('saldo')) return Wallet;
    return Activity;
  })();

  return (
    <div 
      className="relative bg-white/5 backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300"
    >
      {/* Fondo decorativo dinámico basado en el color */}
      <div 
        className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          filter: 'blur(20px)'
        }}
      />
      
      {/* Borde brillante superior (sutil) */}
      <div 
        className="absolute top-0 left-0 w-full h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="relative z-10 text-center">
        <div className="flex justify-center mb-3">
          <div 
            className="p-3 rounded-2xl shadow-lg"
            style={{ background: `${color}20`, color: `${color}` }}
          >
            <span className="text-2xl md:text-3xl filter drop-shadow-md">
              {typeof icon === 'string' ? icon : <IconComponent className="w-6 h-6 md:w-8 md:h-8" />}
            </span>
          </div>
        </div>
        
        <h3 className="text-gray-300 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">
          {label}
        </h3>
        
        <div className="text-white text-2xl md:text-3xl font-bold tracking-tight filter drop-shadow-sm">
          {formatValue(value)}
        </div>
      </div>
    </div>
  );
};

// Fix import si usas TrendingDown u otros iconos específicos
import { TrendingDown } from 'lucide-react';
export default KPICard;