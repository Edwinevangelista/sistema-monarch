import { useState, useEffect } from 'react';
import { Bell, BellOff, Calendar, TrendingDown, CreditCard, FileText } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function ConfiguracionNotificaciones() {
  const { 
    supported, 
    permission, 
    requestPermission, 
    subscribeToPush,
    showLocalNotification 
  } = useNotifications();

  const [loading, setLoading] = useState(false);

  // Config inicial
  const [config, setConfig] = useState(() => {
    const guardadas = localStorage.getItem("configNotificaciones");
    return guardadas
      ? JSON.parse(guardadas)
      : {
          gastosProximosVencer: true,
          diasAnticipacion: 3,
          suscripcionesRenovar: true,
          saldoBajo: true,
          montoMinimo: 100,
          resumenSemanal: false,
        };
  });

  // Guardar cambios
  useEffect(() => {
    localStorage.setItem("configNotificaciones", JSON.stringify(config));
  }, [config]);

  const handleActivarNotificaciones = async () => {
    setLoading(true);
    try {
      const perm = await requestPermission();
      if (perm === 'granted') {
        await subscribeToPush();
        showLocalNotification('¡Notificaciones activadas!', {
          body: 'Recibirás alertas sobre tus finanzas',
          icon: '/logo192.png'
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProbarNotificacion = () => {
    showLocalNotification('🔔 Notificación de Prueba', {
      body: 'Internet vence en 2 días - $70.00',
      data: { url: '/' }
    });
  };

  if (!supported) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center shadow-xl">
        <BellOff className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No soportado</h2>
        <p className="text-gray-400">
          Tu navegador no soporta notificaciones push. Prueba con Chrome, Firefox o Edge en Android/iOS.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-colors ${
            permission === 'granted' 
              ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Notificaciones Push</h2>
            <p className="text-sm text-gray-400">
              {permission === 'granted' ? 'Activas y funcionando' : 'Desactivadas actualmente'}
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={handleActivarNotificaciones}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            {loading ? 'Activando...' : 'Activar'}
          </button>
        )}
      </div>

      {/* Configuraciones (Ocultas si no hay permiso) */}
      {permission === 'granted' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* Gastos por vencer */}
          <SettingCard 
            icon={<Calendar className="w-5 h-5 text-orange-400" />}
            title="Gastos por vencer"
            description={`Alertar ${config.diasAnticipacion} días antes`}
            enabled={config.gastosProximosVencer}
            onToggle={() => setConfig({ ...config, gastosProximosVencer: !config.gastosProximosVencer })}
          />

          {/* Suscripciones */}
          <SettingCard 
            icon={<Repeat className="w-5 h-5 text-purple-400" />}
            title="Suscripciones"
            description="Alertar 2 días antes del cobro"
            enabled={config.suscripcionesRenovar}
            onToggle={() => setConfig({ ...config, suscripcionesRenovar: !config.suscripcionesRenovar })}
          />
          
          {/* Saldo bajo */}
          <SettingCard 
            icon={<TrendingDown className="w-5 h-5 text-rose-400" />}
            title="Saldo bajo"
            description={`Si baja de $${config.montoMinimo}`}
            enabled={config.saldoBajo}
            onToggle={() => setConfig({ ...config, saldoBajo: !config.saldoBajo })}
          />

          {/* Resumen semanal */}
          <SettingCard 
            icon={<FileText className="w-5 h-5 text-blue-400" />}
            title="Resumen semanal"
            description="Cada lunes a las 9:00 AM"
            enabled={config.resumenSemanal}
            onToggle={() => setConfig({ ...config, resumenSemanal: !config.resumenSemanal })}
          />
          
          {/* Botón de prueba */}
          <button
            onClick={handleProbarNotificacion}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Probar Notificación
          </button>

        </div>
      )}
    </div>
  );
}

// Componente auxiliar para las tarjetas de configuración
function SettingCard({ icon, title, description, enabled, onToggle }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${enabled ? 'bg-white/5 border-white/10' : 'bg-black/20 border-transparent opacity-60'}`}>
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
          {icon}
        </div>
        <div>
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      
      {/* Custom Toggle Switch */}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
      </label>
    </div>
  );
}

import { Repeat } from 'lucide-react'; // Agregar esto al import