import React, { useState } from 'react'
import { Upload, FileText, Image, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useGastosVariables } from '../hooks/useGastosVariables'
import { useIngresos } from '../hooks/useIngresos'

const LectorEstadoCuenta = ({ onClose }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  const { agregarGasto } = useGastosVariables()
  const { agregarIngreso } = useIngresos()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Tipo de archivo no válido. Solo se permiten: JPG, PNG, WEBP, PDF')
      return
    }

    // Validar tamaño (máx 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 10MB')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)

    // Crear preview para imágenes
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleScan = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Convertir archivo a base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        try {
          const base64 = reader.result

          // Llamar a la API serverless
          const response = await fetch('https://sistema-monarch-ocr.onrender.com/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileType: file.type
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.details || 'Error al procesar el archivo')
          }

          const data = await response.json()
          setResult(data)
          setLoading(false)
        } catch (err) {
          setError(err.message)
          setLoading(false)
        }
      }

      reader.onerror = () => {
        setError('Error al leer el archivo')
        setLoading(false)
      }

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSaveTransactions = async () => {
    if (!result || !result.transacciones) return

    setLoading(true)
    try {
      for (const trans of result.transacciones) {
        if (trans.tipo === 'gasto') {
          await agregarGasto({
            fecha: trans.fecha,
            categoria: trans.categoria,
            descripcion: trans.descripcion,
            monto: Math.abs(trans.monto),
            metodo: 'Tarjeta'
          })
        } else if (trans.tipo === 'ingreso') {
          await agregarIngreso({
            fecha: trans.fecha,
            fuente: 'Depósito',
            descripcion: trans.descripcion,
            monto: trans.monto
          })
        }
      }

      alert(`✅ ${result.transacciones.length} transacciones guardadas exitosamente`)
      onClose()
    } catch (err) {
      setError('Error al guardar transacciones: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Escanear Estado de Cuenta
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Upload Area */}
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 rounded" />
                ) : (
                  <>
                    <FileText className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG, WEBP (Máx. 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
              />
            </label>
            {file && (
              <p className="mt-2 text-sm text-gray-400">
                �� {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleScan}
              disabled={!file || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  Escanear Documento
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  Transacciones Encontradas: {result.transacciones.length}
                </h3>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-400 text-sm">Total Gastos</p>
                  <p className="text-red-400 text-xl font-bold">
                    ${Math.abs(result.resumen.total_gastos).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-400 text-sm">Total Ingresos</p>
                  <p className="text-green-400 text-xl font-bold">
                    ${result.resumen.total_ingresos.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-400 text-sm">Transacciones</p>
                  <p className="text-blue-400 text-xl font-bold">
                    {result.resumen.cantidad_transacciones}
                  </p>
                </div>
              </div>

              {/* Lista de transacciones */}
              <div className="max-h-64 overflow-y-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-gray-400">Fecha</th>
                      <th className="text-left p-2 text-gray-400">Descripción</th>
                      <th className="text-left p-2 text-gray-400">Categoría</th>
                      <th className="text-right p-2 text-gray-400">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.transacciones.map((trans, idx) => (
                      <tr key={idx} className="border-b border-gray-600">
                        <td className="p-2 text-gray-300">{trans.fecha}</td>
                        <td className="p-2 text-white">{trans.descripcion}</td>
                        <td className="p-2 text-gray-400">{trans.categoria}</td>
                        <td className={`p-2 text-right font-semibold ${trans.monto < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          ${Math.abs(trans.monto).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Guardar botón */}
              <button
                onClick={handleSaveTransactions}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {loading ? 'Guardando...' : 'Guardar Todas las Transacciones'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LectorEstadoCuenta
