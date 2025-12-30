import { useState } from 'react';
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

  const tabs = [
    { id: 'ingresos', label: '💰 Ingresos', count: ingresos.length, color: 'bg-green-600' },
    { id: 'gastos', label: '💸 Gastos', count: gastos.length, color: 'bg-red-600' },
    { id: 'gastosFijos', label: '📋 Gastos Fijos', count: gastosFijos.length, color: 'bg-yellow-600' },
    { id: 'suscripciones', label: '🔄 Suscripciones', count: suscripciones.length, color: 'bg-indigo-600' },
    { id: 'deudas', label: '💳 Deudas', count: deudas.length, color: 'bg-purple-600' }
  ];

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">
        📋 Gestión de Registros
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              tabActiva === tab.id
                ? `${tab.color} text-white`
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
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
          <TablaGastos
            gastos={gastos}
            updateGasto={updateGasto}
            deleteGasto={deleteGasto}
          />
        )}

        {tabActiva === 'gastosFijos' && (
          <TablaGastosFijos
            gastosFijos={gastosFijos}
            updateGastoFijo={updateGastoFijo}
            updateEstado={updateEstado}
            deleteGastoFijo={deleteGastoFijo}
          />
        )}

        {tabActiva === 'suscripciones' && (
          <TablaSuscripciones
            suscripciones={suscripciones}
            updateSuscripcion={updateSuscripcion}
            deleteSuscripcion={deleteSuscripcion}
          />
        )}

        {tabActiva === 'deudas' && (
          <TablaDeudas
            deudas={deudas}
            updateDeuda={updateDeuda}
            deleteDeuda={deleteDeuda}
          />
        )}
      </div>
    </div>
  );
}
