import { AlertTriangle } from 'lucide-react';

export default function ModalConfirmacion({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo = "¿Estás seguro?",
  mensaje = "Esta acción no se puede deshacer",
  textoConfirmar = "Eliminar",
  textoCancel = "Cancelar"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-red-500/20 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{titulo}</h3>
            <p className="text-gray-300">{mensaje}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            {textoCancel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
