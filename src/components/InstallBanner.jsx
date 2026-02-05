import React, { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

// ✅ FIX: Componente como función normal con export default
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua) && !window.matchMedia('(display-mode: standalone)').matches
    setIsIOS(ios)

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") {
        console.log("FinGuide instalada")
      }
      setDeferredPrompt(null)
      setVisible(false)
    }
  }

  if (!visible && !isIOS) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-900 border border-blue-600 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
      <div>
        <h3 className="text-white font-bold text-sm">Instalar FinGuide</h3>
        <p className="text-gray-300 text-xs">
          Accede más rápido y recibe alertas financieras
        </p>
        {isIOS && (
          <p className="text-gray-400 text-[11px] mt-1">
            En iPhone: Compartir → "Agregar a inicio"
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            Instalar
          </button>
        )}
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ✅ CRÍTICO: Export default al final
export default InstallBanner