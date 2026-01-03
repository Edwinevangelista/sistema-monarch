import React from "react";
import { X, Brain, Shield, DollarSign, Target, AlertTriangle } from "lucide-react";

const ModalUsuario = ({ usuario, preferencias, onClose, onLogout }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            👤 Perfil del Usuario
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-5 space-y-5">

          {/* IDENTIDAD */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-2">
            <div className="text-gray-400 text-xs">Nombre</div>
            <div className="text-white font-semibold">{usuario.nombre}</div>

            <div className="text-gray-400 text-xs mt-3">Email</div>
            <div className="text-white font-semibold">{usuario.email}</div>
          </section>

          {/* PREFERENCIAS FINANCIERAS */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Preferencias Financieras
            </h3>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Moneda
              </span>
              <span className="text-white font-medium">{preferencias.moneda}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Inicio del mes</span>
              <span className="text-white font-medium">Día {preferencias.inicioMes}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Objetivo principal</span>
              <span className="text-white font-medium">
                {preferencias.objetivo}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Perfil de riesgo</span>
              <span className="text-white font-medium">
                {preferencias.riesgo}
              </span>
            </div>
          </section>

          {/* INTELIGENCIA ARTIFICIAL */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Inteligencia Artificial
            </h3>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">IA activa</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  preferencias.iaActiva
                    ? "bg-green-600/20 text-green-400"
                    : "bg-red-600/20 text-red-400"
                }`}
              >
                {preferencias.iaActiva ? "ACTIVADA" : "DESACTIVADA"}
              </span>
            </div>

            <p className="text-gray-400 text-xs leading-relaxed">
              La IA analiza tus hábitos, detecta riesgos y sugiere acciones
              alineadas a tu objetivo financiero.
            </p>
          </section>

          {/* SEGURIDAD */}
          <section className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 space-y-3">
            <h3 className="text-red-400 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Seguridad
            </h3>

            <button
              onClick={onLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Cerrar sesión
            </button>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ModalUsuario;
