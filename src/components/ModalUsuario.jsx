import React from "react";
import { X, Brain, Shield, DollarSign, Target, AlertTriangle, Check } from "lucide-react";

const ModalUsuario = ({ 
  usuario, 
  preferencias, 
  onClose, 
  onLogout,
  onChangePreferencias 
}) => {

  const handleSave = () => {
    // 1. Guardar en localStorage (Persistencia)
    localStorage.setItem("preferenciasUsuario", JSON.stringify(preferencias));
    
    // 2. Notificar al padre (Dashboard) para actualizar el estado global
    if (onChangePreferencias) {
      onChangePreferencias(preferencias);
    }
    
    // 3. Feedback y Cerrar
    alert("✅ Preferencias guardadas correctamente");
    onClose();
  };

  // Si por alguna razón no hay usuario (raro, pero por seguridad), fallback
  const displayNombre = usuario?.nombre || 'Usuario';
  const displayEmail = usuario?.email || 'usuario@ejemplo.com';
  const displayMoneda = preferencias?.moneda || 'USD';
  const displayObjetivo = preferencias?.objetivo || 'Reducir deudas';
  const displayRiesgo = preferencias?.riesgo || 'Conservador';
  const displayIA = preferencias?.iaActiva ?? true; // Default a true

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden relative">
        
        {/* HEADER VISUAL */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 pb-4 rounded-t-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-white/90" />
              Perfil del Usuario
            </h2>
            <button 
              onClick={onClose} 
              className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Información del Cliente (Solo lectura para evitar errores complejos de BD) */}
          <div className="flex items-center gap-4 mt-4 bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {displayNombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{displayNombre}</p>
              <p className="text-blue-200 text-xs flex items-center gap-1">
                <span className="opacity-50">✉</span> {displayEmail}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO DEL MODAL */}
        <div className="p-6 space-y-6 bg-gray-800">
          
          {/* SECCIÓN: PREFERENCIAS FINANCIERAS */}
          <section className="space-y-4">
            <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Configuración Financiera
            </h3>

            {/* Moneda */}
            <div>
              <label className="text-sm text-gray-300 block mb-1">Divisa Predeterminada</label>
              <div className="relative group">
                <select 
                  value={displayMoneda}
                  onChange={(e) => onChangePreferencias({ ...preferencias, moneda: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all hover:bg-gray-700"
                >
                  <option value="USD">🇺🇸 USD - Dólar Estadounidense</option>
                  <option value="EUR">🇪🇸 EUR - Euro</option>
                  <option value="MXN">🇲🇽 MXN - Peso Mexicano</option>
                  <option value="COP">🇨🇴 COP - Peso Colombiano</option>
                  <option value="ARS">🇦🇷 ARS - Peso Argentino</option>
                  <option value="CLP">🇨🇱 CLP - Peso Chileno</option>
                  <option value="PEN">🇵🇪 PEN - Sol Peruano</option>
                </select>
                <DollarSign className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-blue-400 transition-colors" />
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <label className="text-sm text-gray-300 block mb-1">Objetivo Principal</label>
              <div className="relative group">
                <select 
                  value={displayObjetivo}
                  onChange={(e) => onChangePreferencias({ ...preferencias, objetivo: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all hover:bg-gray-700"
                >
                  <option value="Reducir deudas">🔥 Reducir Deudas</option>
                  <option value="Ahorrar para viajes">✈️ Ahorrar para viajes</option>
                  <option value="Comprar casa">🏠 Comprar casa</option>
                  <option value="Jubilación anticipada">🏖️ Jubilación anticipada</option>
                  <option value="Invertir en negocios">📈 Invertir en negocios</option>
                </select>
                <Target className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-blue-400 transition-colors" />
              </div>
            </div>

            {/* Perfil de Riesgo */}
            <div>
              <label className="text-sm text-gray-300 block mb-1">Perfil de Riesgo</label>
              <div className="relative group">
                <select 
                  value={displayRiesgo}
                  onChange={(e) => onChangePreferencias({ ...preferencias, riesgo: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all hover:bg-gray-700"
                >
                  <option value="Conservador">🛡️ Conservador (Seguro)</option>
                  <option value="Moderado">⚖️ Moderado (Equilibrado)</option>
                  <option value="Agresivo">🚀 Agresivo (Alta rentabilidad)</option>
                </select>
                <Shield className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          </section>

          {/* SECCIÓN: INTELIGENCIA ARTIFICIAL (Toggle Switch) */}
          <section className="bg-gray-700/50 rounded-xl p-4 border border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="flex items-center justify-between pl-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Asistente Financiero IA</h4>
                  <p className="text-gray-400 text-xs">La IA analiza tus hábitos y te sugiere consejos.</p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => onChangePreferencias({ ...preferencias, iaActiva: !displayIA })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none duration-300 ${
                  displayIA 
                    ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                    : 'bg-gray-600 shadow-[0_0_10px_rgba(0,0,0,0.3)]'
                }`}
              >
                <span className="sr-only">Activar IA</span>
                <span 
                  className={`absolute left-1 top-1 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center text-[10px] font-bold ${
                    displayIA ? 'translate-x-6 bg-white text-green-500' : 'translate-x-0 bg-gray-300'
                  }`}
                >{displayIA ? '✓' : ''}</span>
              </button>
            </div>
          </section>
        </div>

        {/* FOOTER: ACCIONES */}
        <div className="px-6 pb-6 space-y-3">
          
          {/* Botón Guardar */}
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 border-b-4 border-blue-400"
          >
            <Check className="w-5 h-5" />
            Guardar Cambios
          </button>

          {/* Botón Cerrar Sesión (Peligroso) */}
          <button 
            onClick={onLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Cerrar Sesión
          </button>

        </div>
      </div>
    </div>
  );
};

export default ModalUsuario;