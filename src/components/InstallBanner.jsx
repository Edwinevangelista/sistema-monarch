import React, { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(isIOSDevice);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Si ya es iOS, mostrar automáticamente si no se ha descartado recientemente
    if (isIOSDevice && !localStorage.getItem('pwa-dismissed')) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isIOS]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("FinGuide instalada");
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (isIOS) {
      localStorage.setItem('pwa-dismissed', 'true');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-gray-900/90 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-900/20 rounded-2xl p-4 md:p-5 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30 text-blue-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="hidden md:block">
            <h3 className="text-white font-bold text-base">Instalar FinGuide</h3>
            <p className="text-gray-400 text-xs">
              Obtén acceso instantáneo y alertas financieras.
            </p>
          </div>
          {/* Texto solo móvil */}
          <div className="md:hidden">
            <h3 className="text-white font-bold text-sm">Instalar App</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isIOS && (
            <p className="text-[10px] md:text-xs text-blue-300 mr-2 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 hidden sm:block">
              Compartir → "Agregar a Inicio"
            </p>
          )}
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-5 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Instalar</span>
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}