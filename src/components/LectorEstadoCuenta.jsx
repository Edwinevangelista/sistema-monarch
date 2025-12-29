import React, { useState } from 'react'
import { FileText, Upload, X, Loader, CheckCircle } from 'lucide-react'

const LectorEstadoCuenta = ({ onClose, onTransaccionesExtraidas }) => {
  const [archivo, setArchivo] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  const handleArchivoSeleccionado = (e) => {
    const file = e.target.files[0]
    if (file) {
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!tiposPermitidos.includes(file.type)) {
        setError('Solo se permiten imágenes (JPG, PNG) o PDFs')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar 5MB')
        return
      }
      
      setArchivo(file)
      setError(null)
    }
  }

  const procesarConIA = async () => {
    alert('Función de IA disponible próximamente. Por ahora agrega transacciones manualmente.')
    onClose()
  }

  const confirmarTransacciones = () => {
    if (resultado && resultado.length > 0) {
      onTransaccionesExtraidas(resultado)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-400" />
            Lector de Estados de Cuenta
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleArchivoSeleccionado}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-400 hover:text-blue-300 font-semibold"
            >
              Click para seleccionar archivo
            </label>
            <p className="text-gray-400 text-sm mt-2">
              JPG, PNG o PDF (máx. 5MB)
            </p>
          </div>

          {archivo && (
            <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-white font-semibold">{archivo.name}</p>
                  <p className="text-gray-400 text-xs">
                    {(archivo.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setArchivo(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>💡 Próximamente:</strong> Podrás escanear estados de cuenta automáticamente con IA.
              Por ahora, agrega las transacciones manualmente.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={procesarConIA}
            disabled={!archivo}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Procesar (Próximamente)
          </button>
        </div>
      </div>
    </div>
  )
}

export default LectorEstadoCuenta
