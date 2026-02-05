import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ModalConfirmacion({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo = "¿Estás seguro?",
  mensaje = "Esta acción no se puede deshacer.",
  textoConfirmar = "Eliminar",
  textoCancelar = "Cancelar",
  tipo = "peligro" // 'peligro' | 'info'
}) {
  if (!isOpen) return null;

  const isDanger = tipo === 'peligro';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        
        {/* Fondo decorativo */}
        {isDanger && (
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 to-pink-600"></div>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${
            isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">{titulo}</h3>
          <p className="text-gray-300 text-base">{mensaje}</p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all border border-gray-700 active:scale-95"
          >
            {textoCancelar}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 border ${
              isDanger 
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 border-rose-500 shadow-rose-900/20' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-blue-500 shadow-blue-900/20'
            }`}
          >
            {textoConfirmar}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}