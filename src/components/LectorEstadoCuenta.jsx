import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, Image, Loader2, CheckCircle, XCircle, TrendingDown, Wallet, X } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useGastosVariables } from '../hooks/useGastosVariables';
import { useIngresos } from '../hooks/useIngresos';

export default function LectorEstadoCuenta({ onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const { agregarGasto } = useGastosVariables();
  const { agregarIngreso } = useIngresos();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Solo aceptamos JPG, PNG, WEBP o PDF.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo supera los 10MB permitidos.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setProgress(0);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const parseTransactionsFromText = (text) => {
    const lines = text.split('\n');
    const transactions = [];
    let totalGastos = 0;
    let totalIngresos = 0;

    // CORREGIDO: Removidos escapes innecesarios dentro de los corchetes []
    const dateRegex = /(\d{1,2})[/.\\-](\d{1,2})[/.\\-](\d{2,4})/;
    const amountRegex = /\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.?\d*)/;

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      const dateMatch = cleanLine.match(dateRegex);
      const amountMatch = cleanLine.match(amountRegex);

      if (dateMatch && amountMatch) {
        const rawAmount = amountMatch[0].replace(/[(),\-$]/g, '');
        const amount = parseFloat(rawAmount);

        if (!isNaN(amount) && amount !== 0) {
          let tipo = 'gasto';
          let montoFinal = Math.abs(amount);
          
          if (cleanLine.includes('-') || cleanLine.includes('(')) {
             tipo = 'gasto';
          } else if (cleanLine.toLowerCase().includes('deposito') || 
                     cleanLine.toLowerCase().includes('sueldo') || 
                     cleanLine.toLowerCase().includes('transferencia rec') ||
                     cleanLine.toLowerCase().includes('abono')) {
             tipo = 'ingreso';
          }

          // CORREGIDO: Removidos escapes innecesarios en replace
          let descripcion = cleanLine
            .replace(dateMatch[0], '')
            .replace(amountMatch[0], '')
            .replace(/[()\\-]/g, '')
            .trim()
            .substring(0, 40);

          let categoria = 'Varios';
          const lowerDesc = descripcion.toLowerCase();
          
          if (tipo === 'gasto') {
            if (lowerDesc.includes('uber') || lowerDesc.includes('didi')) categoria = 'Transporte';
            else if (lowerDesc.includes('super') || lowerDesc.includes('tienda') || lowerDesc.includes('oxxo')) categoria = 'Comida';
            else if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify')) categoria = 'Entretenimiento';
            else if (lowerDesc.includes('luz') || lowerDesc.includes('agua') || lowerDesc.includes('tel')) categoria = 'Servicios';
            
            totalGastos += montoFinal;
          } else {
            totalIngresos += montoFinal;
          }

          let fechaStr = dateMatch[0];
          if (dateMatch[3].length === 2) {
            fechaStr = `${dateMatch[1]}/${dateMatch[2]}/20${dateMatch[3]}`;
          }

          transactions.push({
            fecha: fechaStr,
            descripcion: descripcion || 'Movimiento detectado',
            monto: tipo === 'gasto' ? -montoFinal : montoFinal,
            tipo: tipo,
            categoria: categoria
          });
        }
      }
    });

    return {
      transacciones: transactions,
      resumen: {
        total_gastos: totalGastos,
        total_ingresos: totalIngresos
      }
    };
  };

  const handleScan = async () => {
    if (!file) return;

    setLoading(true);
    setScanning(true);
    setError(null);

    try {
      const { data: { text } } = await Tesseract.recognize(
        file,
        'spa', 
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const parsedData = parseTransactionsFromText(text);

      if (parsedData.transacciones.length === 0) {
        setError('No se detectaron transacciones. Intenta con una imagen más clara o verifica el formato.');
      } else {
        setResult(parsedData);
      }
    } catch (err) {
      console.error(err);
      setError('Error al procesar el archivo localmente: ' + err.message);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleSaveTransactions = async () => {
    if (!result || !result.transacciones) return;
    setLoading(true);
    try {
      for (const trans of result.transacciones) {
        await new Promise(r => setTimeout(r, 50)); 
        if (trans.tipo === 'gasto') {
          await agregarGasto({
            fecha: trans.fecha,
            categoria: trans.categoria,
            descripcion: trans.descripcion,
            monto: Math.abs(trans.monto),
            metodo: 'Escaneo Local'
          });
        } else {
          await agregarIngreso({
            fecha: trans.fecha,
            fuente: 'Escaneo Local',
            descripcion: trans.descripcion,
            monto: trans.monto
          });
        }
      }
      onClose();
      console.log('✅ Transacciones guardadas');
    } catch (err) {
      setError('Error al guardar en la base de datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (scanning) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-blue-500/30 rounded-3xl p-8 max-w-sm w-full text-center">
           <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin mb-4" />
           <p className="text-white font-bold text-lg">Procesando Localmente...</p>
           <p className="text-gray-400 text-sm mb-2">Extrayendo texto con OCR</p>
           <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
             <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
           </div>
           <p className="text-xs text-gray-500">{progress}% Completado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full md:max-w-3xl md:h-auto md:max-h-[90vh] h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden animate-slide-in-from-bottom-10">
        
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gray-800/50 md:hidden">
           <h2 className="text-white font-bold text-lg flex items-center gap-2">
             <Upload className="w-5 h-5 text-blue-400" /> Escáner Local
           </h2>
           <button onClick={onClose} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
        </div>

        <div className="hidden md:flex items-center justify-between p-6 border-b border-white/10 bg-gray-900">
           <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
             <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Upload className="w-6 h-6" /></div>
             Escáner de Estado de Cuenta (Offline)
           </h2>
           <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {!result ? (
            <>
              <div className="mb-6">
                <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 md:p-10 text-center transition-all hover:border-blue-400/50 hover:bg-white/10 group relative overflow-hidden">
                  <input type="file" className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.webp" />
                  
                  <div className="relative z-20 pointer-events-none">
                    {preview ? (
                      <div className="mb-4">
                        <img src={preview} alt="Vista previa" className="max-h-48 mx-auto rounded-lg shadow-lg border border-white/20" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <p className="text-white font-medium text-lg mb-2">
                      {file ? file.name : "Subir estado de cuenta"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      El procesamiento ocurre en tu dispositivo.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={!file || loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:shadow-indigo-900/40 active:scale-[0.98]"
              >
                <Image className="w-5 h-5" />
                {loading ? "Procesando..." : "Analizar con OCR Local"}
              </button>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-green-500/20 rounded-full border border-green-500/30"><CheckCircle className="w-6 h-6 text-green-400" /></div>
                 <div>
                    <h3 className="text-white font-bold text-xl">¡Análisis Completado!</h3>
                    <p className="text-gray-400 text-sm">{result.transacciones.length} transacciones detectadas.</p>
                 </div>
                 <button onClick={() => setResult(null)} className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                 <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-400 text-xs uppercase">Total Gastos</p>
                    <p className="text-rose-400 text-xl font-bold text-lg">
                      ${Math.abs(result.resumen.total_gastos).toLocaleString()}
                    </p>
                 </div>
                 <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-400 text-xs uppercase">Total Ingresos</p>
                    <p className="text-emerald-400 text-xl font-bold text-lg">
                      ${result.resumen.total_ingresos.toLocaleString()}
                    </p>
                 </div>
                 <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-400 text-xs uppercase">Neto</p>
                    <p className={`text-white text-xl font-bold text-lg ${result.resumen.total_ingresos - result.resumen.total_gastos >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      ${(result.resumen.total_ingresos - result.resumen.total_gastos).toLocaleString()}
                    </p>
                 </div>
              </div>

              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                 {result.transacciones.map((trans, idx) => (
                   <div 
                     key={idx} 
                     className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                   >
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           {trans.tipo === 'gasto' ? (
                              <div className="p-1 bg-rose-500/20 rounded text-rose-400"><TrendingDown className="w-3 h-3" /></div>
                           ) : (
                              <div className="p-1 bg-emerald-500/20 rounded text-emerald-400"><Wallet className="w-3 h-3" /></div>
                           )}
                           <p className="text-white font-semibold truncate">{trans.descripcion}</p>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-400">
                           <span>{trans.fecha}</span>
                           <span className="text-gray-600">•</span>
                           <span>{trans.categoria}</span>
                        </div>
                     </div>
                     <div className={`font-bold text-lg ${trans.monto < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ${Math.abs(trans.monto).toLocaleString()}
                     </div>
                   </div>
                 ))}
              </div>

              <button
                onClick={handleSaveTransactions}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? "Guardando..." : "Guardar Transacciones"}
              </button>
            </div>
          )}
          
          {error && (
             <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}