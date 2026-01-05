import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
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

  // ✅ INICIO: Cargar configuración desde LocalStorage al inicio
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

  // ✅ FIN: Guardar en LocalStorage cada vez que cambia la config
  useEffect(() => {
    localStorage.setItem("configNotificaciones", JSON.stringify(config));
  }, [config]);

  const handleActivarNotificaciones = async () => {
    setLoading(true);
    try {
      const perm = await requestPermission();
      
      if (perm === 'granted') {
        await subscribeToPush();
        
        // Mostrar notificación de prueba
        showLocalNotification('¡Notificaciones activadas!', {
          body: 'Recibirás alertas sobre tus finanzas',
          icon: '/logo192.png'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al activar notificaciones: ' + error.message);
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
      <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-400" />
          <h2 className="text-xl font-bold text-white">Notificaciones Push</h2>
        </div>
        <p className="text-gray-400">
          Tu navegador no soporta notificaciones push. Prueba con Chrome, Firefox o Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${
            permission === 'granted' ? 'bg-green-600' : 'bg-gray-700'
          }`}>
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Notificaciones Push</h2>
            <p className="text-sm text-gray-400">
              {permission === 'granted' ? '✓ Activadas' : 'Desactivadas'}
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={handleActivarNotificaciones}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Activando...' : 'Activar'}
          </button>
        )}
      </div>

      {/* Configuración */}
      {permission === 'granted' && (
        <>
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
              <div>
                <h3 className="text-white font-semibold">Gastos próximos a vencer</h3>
                <p className="text-sm text-gray-400">
                  Alertar con {config.diasAnticipacion} días de anticipación
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.gastosProximosVencer}
                  onChange={(e) => setConfig({ ...config, gastosProximosVencer: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
              <div>
                <h3 className="text-white font-semibold">Suscripciones próximas a renovar</h3>
                <p className="text-sm text-gray-400">Notificar 2 días antes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.suscripcionesRenovar}
                  onChange={(e) => setConfig({ ...config, suscripcionesRenovar: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
              <div>
                <h3 className="text-white font-semibold">Saldo bajo</h3>
                <p className="text-sm text-gray-400">
                  Cuando queden menos de ${config.montoMinimo}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.saldoBajo}
                  onChange={(e) => setConfig({ ...config, saldoBajo: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
              <div>
                <h3 className="text-white font-semibold">Resumen semanal</h3>
                <p className="text-sm text-gray-400">Cada lunes a las 9:00 AM</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.resumenSemanal}
                  onChange={(e) => setConfig({ ...config, resumenSemanal: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Botón de prueba */}
          <button
            onClick={handleProbarNotificacion}
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
          >
            🔔 Probar Notificación
          </button>
        </>
      )}
    </div>
  );
}