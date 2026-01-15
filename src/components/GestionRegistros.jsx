import React, { useState } from 'react';
import { 
  CreditCard, 
  TrendingDown, 
  Edit2, 
  Trash2, 
  Repeat, 
  ArrowRight,
  Wallet, 
  Calendar,
  FileText 
} from 'lucide-react';

import { useIngresos } from '../hooks/useIngresos';
import { useGastosVariables } from '../hooks/useGastosVariables';
import { useGastosFijos } from '../hooks/useGastosFijos';
import { useSuscripciones } from '../hooks/useSuscripciones';
import { useDeudas } from '../hooks/useDeudas';
import TablaIngresos from './TablaIngresos';
import TablaGastos from './TablaGastos';
import TablaGastosFijos from './TablaGastosFijos';
import TablaSuscripciones from './TablaSuscripciones';
import TablaDeudas from './TablaDeudas';

export default function GestionRegistros() {
  const [tabActiva, setTabActiva] = useState('ingresos');
  
  const { ingresos, updateIngreso, deleteIngreso } = useIngresos();
  const { gastos, updateGasto, deleteGasto } = useGastosVariables();
  const { gastosFijos, updateGastoFijo, updateEstado, deleteGastoFijo } = useGastosFijos();
  const { suscripciones, updateSuscripcion, deleteSuscripcion } = useSuscripciones();
  const { deudas, updateDeuda, deleteDeuda } = useDeudas();

  // Configuración de pestañas
  const tabs = [
    { id: 'ingresos', label: 'Ingresos', count: ingresos.length, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-600' },
    { id: 'gastos', label: 'Gastos', count: gastos.length, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-600' },
    { id: 'gastosFijos', label: 'Fijos', count: gastosFijos.length, icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-600' },
    { id: 'suscripciones', label: 'Subscripciones', count: suscripciones.length, icon: Repeat, color: 'text-purple-400', bg: 'bg-purple-600' },
    { id: 'deudas', label: 'Deudas', count: deudas.length, icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-600' }
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-4 md:p-6 shadow-2xl border border-white/10 h-full flex flex-col">
      
      {/* HEADER */}
      <div className="mb-6 pb-4 border-b border-white/10">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
          Gestión de Registros
        </h2>
        <p className="text-gray-400 text-sm md:text-base">
          Administra todos tus movimientos financieros en un solo lugar.
        </p>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto pb-6 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`
              relative flex-shrink-0 flex flex-col md:flex-row items-center md:items-center gap-3 px-4 py-3 md:py-4 rounded-xl border transition-all duration-200
              ${tabActiva === tab.id
                ? `bg-gradient-to-r from-gray-800 to-gray-700 border-white/20 shadow-lg transform scale-105`
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
              }
            `}
          >
            <div className={`p-2 rounded-lg ${tab.bg} ${tab.color} shadow-sm`}>
              <tab.icon className="w-5 h-5" />
            </div>
            <div className="text-left md:text-center min-w-[60px]">
              <span className={`block font-bold text-sm md:text-base ${tabActiva === tab.id ? 'text-white' : 'text-gray-300'}`}>
                {tab.label}
              </span>
              <span className={`text-[10px] md:text-xs ${tabActiva === tab.id ? 'text-gray-400' : 'text-gray-500'}`}>
                {tab.count} registros
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* CONTENIDO DINÁMICO */}
      <div className="bg-gray-900/50 rounded-2xl p-1 md:p-2 border border-white/5 flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/50 pointer-events-none rounded-2xl" />
        
        {/* Contenedor de Tablas */}
        <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-2 md:p-4">
          {tabActiva === 'ingresos' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <TablaIngresos
                ingresos={ingresos}
                updateIngreso={updateIngreso}
                deleteIngreso={deleteIngreso}
              />
            </div>
          )}

          {tabActiva === 'gastos' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <TablaGastos
                gastos={gastos}
                updateGasto={updateGasto}
                deleteGasto={deleteGasto}
              />
            </div>
          )}

          {tabActiva === 'gastosFijos' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <TablaGastosFijos
                gastosFijos={gastosFijos}
                updateGastoFijo={updateGastoFijo}
                updateEstado={updateEstado}
                deleteGastoFijo={deleteGastoFijo}
              />
            </div>
          )}

          {tabActiva === 'suscripciones' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <TablaSuscripciones
                suscripciones={suscripciones}
                updateSuscripcion={updateSuscripcion}
                deleteSuscripcion={deleteSuscripcion}
              />
            </div>
          )}

          {tabActiva === 'deudas' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <TablaDeudas
                deudas={deudas}
                updateDeuda={updateDeuda}
                deleteDeuda={deleteDeuda}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}