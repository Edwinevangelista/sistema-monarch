import { useState } from 'react';
import { useIngresos } from '../hooks/useIngresos';
import { useGastosVariables } from '../hooks/useGastosVariables';
import TablaIngresos from './TablaIngresos';

export default function GestionRegistros() {
  const [tabActiva, setTabActiva] = useState('ingresos');
  const { ingresos, updateIngreso, deleteIngreso } = useIngresos();
  const { gastos, updateGasto, deleteGasto } = useGastosVariables();

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">
        📋 Gestión de Registros
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setTabActiva('ingresos')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            tabActiva === 'ingresos'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          💰 Ingresos ({ingresos.length})
        </button>
        <button
          onClick={() => setTabActiva('gastos')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            tabActiva === 'gastos'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          💸 Gastos ({gastos.length})
        </button>
      </div>

      {/* Contenido */}
      <div className="bg-gray-900 rounded-xl p-4">
        {tabActiva === 'ingresos' && (
          <TablaIngresos
            ingresos={ingresos}
            updateIngreso={updateIngreso}
            deleteIngreso={deleteIngreso}
          />
        )}

        {tabActiva === 'gastos' && (
          <div className="text-center py-8 text-gray-400">
            Tabla de gastos próximamente...
          </div>
        )}
      </div>
    </div>
  );
}
