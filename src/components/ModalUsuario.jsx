import React, { useEffect, useMemo } from 'react';
import { X, Brain, Shield, DollarSign, Target, AlertTriangle, Bell, Smartphone, CreditCard, Repeat } from 'lucide-react'


const ModalUsuario = ({ 
  usuario, 
  preferencias, 
  onClose, 
  onLogout,
  onChangePreferencias,
  // ✅ PROPS DE NOTIFICACIONES
  permission,
  showLocalNotification
}) => {

  // ✅ FUNCIÓN PARA SOLICITAR PERMISO DE NOTIFICACIÓN
  const solicitarPermisoNotificacion = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones nativas.");
      return;
    }
    if (Notification.permission === "granted") {
      alert("Ya tienes los permisos activados.");
      return;
    }

    const permiso = await Notification.requestPermission();
    if (permiso === "granted") {
      alert("✅ Notificaciones activadas correctamente.");
      // Opcional: Actualizar estado de preferencias si lo guardas ahí
    } else {
      alert("❌ Permiso denegado. Activa las notificaciones en la configuración de tu navegador.");
    }
  };

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

  const handleLogout = () => {
    if(window.confirm("¿Estás seguro de cerrar sesión?")) {
      // Limpiar datos sensibles si es necesario
      localStorage.removeItem('usuario_finguide');
      localStorage.removeItem('preferenciasUsuario');
      // Llamar la función de logout del padre
      if (onLogout) onLogout();
    }
  };

  // ✅ ESTADO PARA LAS PREFERENCIAS DE NOTIFICACIÓN
  // Usamos preferencias generales pero si no existen, usamos defaults
    // ✅ OPTIMIZACIÓN: useMemo para prefsNotificaciones (Soluciona error de Vercel)
  const prefsNotificaciones = useMemo(() => {
    return preferencias?.notificaciones || {
      gastos: true,
      deudas: true,
      suscripciones: true,
      alertasPush: false // Falso por defecto hasta que el usuario active
    };
  }, [preferencias?.notificaciones]);

  const toggleNotificacion = (tipo) => {
    const nuevasPrefs = {
      ...preferencias,
      notificaciones: {
        ...prefsNotificaciones,
        [tipo]: !prefsNotificaciones[tipo]
      }
    };
    if (onChangePreferencias) {
      onChangePreferencias(nuevasPrefs);
    }
  };

  // Si detectamos preferencias guardadas sin la sección de notificaciones (migración)
  const necesitaMigracion = !preferencias?.notificaciones;
  useEffect(() => {
    if (necesitaMigracion && onChangePreferencias) {
      onChangePreferencias({
        ...preferencias,
        notificaciones: prefsNotificaciones
      });
    }
    // ✅ Agregamos las dependencias para quitar el warning de ESLint
  }, [necesitaMigracion, onChangePreferencias, preferencias, prefsNotificaciones]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Perfil del Usuario
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-5 space-y-6">

          {/* 1. IDENTIDAD */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-2">
            <div className="text-gray-400 text-xs uppercase font-semibold tracking-wider">Información Personal</div>
            <div className="text-white font-medium text-lg">{usuario.nombre}</div>
            <div className="text-gray-300 text-sm">{usuario.email}</div>
          </section>

          {/* 2. PREFERENCIAS FINANCIERAS */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Preferencias Financieras
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-gray-500" /> Moneda
              </span>
              <span className="text-white font-medium">{preferencias.moneda}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Inicio del mes</span>
              <span className="text-white font-medium">Día {preferencias.inicioMes}</span>
            </div>

            <div className="flex justify-between items-center text-sm gap-3">
              <span className="text-gray-300 flex-shrink-0">Objetivo principal</span>
              <select
                value={preferencias.objetivo}
                onChange={(e) => onChangePreferencias({ ...preferencias, objetivo: e.target.value })}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
              >
                <option>Reducir deudas</option>
                <option>Ahorrar</option>
                <option>Invertir</option>
                <option>Controlar gastos</option>
              </select>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Perfil de riesgo</span>
              <span className="text-white font-medium">{preferencias.riesgo}</span>
            </div>
          </section>

          {/* ✅ 3. CONFIGURACIÓN DE NOTIFICACIONES (Nueva Sección) */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-4 border border-blue-500/20">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              Notificaciones
            </h3>

            {/* Estado del Permiso */}
            <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-600">
              <div className="flex flex-col">
                <span className="text-gray-300 text-xs font-semibold">Estado del Navegador</span>
                <span className="text-gray-500 text-[10px] mt-0.5">Se requiere permiso para recibir alertas push</span>
              </div>
              <div className="flex items-center gap-2">
                {permission === 'granted' && (
                  <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 text-xs font-semibold flex items-center gap-1">
                    <Bell className="w-3 h-3" /> ACTIVO
                  </div>
                )}
                {permission === 'denied' && (
                  <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30 text-xs font-semibold">
                    BLOQUEADO
                  </div>
                )}
                {permission === 'default' && (
                  <div className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full border border-gray-600/30 text-xs font-semibold">
                    INACTIVO
                  </div>
                )}
                
                {/* Botón de Acción */}
                <button
                  onClick={solicitarPermisoNotificacion}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  {permission === 'granted' ? 'Configurar' : 'Activar'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-600 my-3"></div>

            {/* Preferencias de Alertas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500/10 p-1.5 rounded-md"><Target className="w-4 h-4 text-red-400" /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Alertas de Deudas</p>
                    <p className="text-gray-400 text-xs">Cuando venza una cuota</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotificacion('deudas')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    prefsNotificaciones.deudas 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {prefsNotificaciones.deudas ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500/10 p-1.5 rounded-md"><CreditCard className="w-4 h-4 text-red-400" /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Alertas de Gastos</p>
                    <p className="text-gray-400 text-xs">Límite mensual o grandes compras</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotificacion('gastos')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    prefsNotificaciones.gastos 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {prefsNotificaciones.gastos ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-500/10 p-1.5 rounded-md"><Repeat className="w-4 h-4 text-purple-400" /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Alertas de Suscripciones</p>
                    <p className="text-gray-400 text-xs">Renovaciones o cortes de servicio</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotificacion('suscripciones')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    prefsNotificaciones.suscripciones 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {prefsNotificaciones.suscripciones ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>
            </div>
          </section>

          {/* 4. INTELIGENCIA ARTIFICIAL */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Inteligencia Artificial
            </h3>

            <div className="flex items-center justify-between text-sm gap-3">
              <span className="text-gray-300">IA financiera activa</span>
              <button
                onClick={() => onChangePreferencias({
                  ...preferencias,
                  iaActiva: !preferencias.iaActiva
                })}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  preferencias.iaActiva
                    ? "bg-green-600/20 text-green-400 border border-green-500/30"
                    : "bg-red-600/20 text-red-400 border border-red-500/30"
                }`}
              >
                {preferencias.iaActiva ? "ACTIVADA" : "DESACTIVADA"}
              </button>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              La IA analiza tus hábitos, detecta riesgos de gastos y sugiere acciones para llegar a tu objetivo ({preferencias.objetivo}).
            </p>
          </section>

          {/* 5. SEGURIDAD */}
          <section className="bg-red-600/5 border border-red-600/20 rounded-xl p-4 space-y-3">
            <h3 className="text-red-400 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Seguridad y Cuenta
            </h3>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/50"
            >
              <AlertTriangle className="w-5 h-5" />
              Cerrar Sesión y Salir
            </button>
          </section>
        </div>

        {/* FOOTER: BOTÓN GUARDAR */}
        <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-md p-4 border-t border-gray-700">
          <button 
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 border-b-4 border-blue-400"
          >
            <Target className="w-5 h-5" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalUsuario;