import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import ModalIngreso from './ModalIngreso';
import ModalGastoVariable from './ModalGastoVariable';

export default function MenuFlotante({ onIngresoCreado, onGastoCreado }) {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [modalIngreso, setModalIngreso] = useState(false);
  const [modalGasto, setModalGasto] = useState(false);

  return (
    <>
      {/* Botones Flotantes */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Opciones expandidas */}
        {mostrarOpciones && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <button
              onClick={() => {
                setModalIngreso(true);
                setMostrarOpciones(false);
              }}
              className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full shadow-2xl transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Ingreso</span>
            </button>
            
            <button
              onClick={() => {
                setModalGasto(true);
                setMostrarOpciones(false);
              }}
              className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-2xl transition-all"
            >
              <TrendingDown className="w-5 h-5" />
              <span className="font-semibold">Gasto</span>
            </button>
          </div>
        )}

        {/* Botón Principal */}
        <button
          onClick={() => setMostrarOpciones(!mostrarOpciones)}
          className={`bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all ${
            mostrarOpciones ? 'rotate-45' : ''
          }`}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Modales */}
      {modalIngreso && (
        <ModalIngreso
          onClose={() => setModalIngreso(false)}
          onSave={onIngresoCreado}
        />
      )}

      {modalGasto && (
        <ModalGastoVariable
          onClose={() => setModalGasto(false)}
          onSave={onGastoCreado}
        />
      )}
    </>
  );
}
