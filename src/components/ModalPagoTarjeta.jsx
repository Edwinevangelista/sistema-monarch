import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CreditCard, X, Loader2, Info, Calculator, Wallet, Building2, AlertTriangle } from 'lucide-react';
import { useDeudas } from '../hooks/useDeudas';
import { useCuentasBancarias } from '../hooks/useCuentasBancarias';

export default function ModalPagoTarjeta({ onClose, onSave, deudas, deudaPreseleccionada = null }) {
  const { cuentas } = useCuentasBancarias();
  const [isLoading, setIsLoading] = useState(false);
  const montoInputRef = useRef(null);
  const cuentasSectionRef = useRef(null);

  const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque', 'Débito'];

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tarjeta: deudaPreseleccionada?.cuenta || deudas[0]?.cuenta || '',
    monto: '',
    principal: '',
    interes: '',
    metodo: 'Efectivo',
    cuenta_id: '',
    notas: ''
  });

  // Helper: Calcular Interés Mensual (APR / 12)
  const calcularInteresMensual = useCallback((deuda) => {
    if (!deuda || !deuda.apr || !deuda.saldo) return 0;
    const tasaMensual = deuda.apr / 12;
    return deuda.saldo * tasaMensual;
  }, []);

  // Helper: Distribuir el pago (Interes vs Principal)
  const distribuirPago = useCallback((montoPago, deuda) => {
    if (!montoPago || montoPago <= 0) {
      return { principal: 0, interes: 0 };
    }
    const interesMensual = calcularInteresMensual(deuda);
    if (montoPago <= interesMensual) {
      return { interes: montoPago, principal: 0 };
    } else {
      return { interes: interesMensual, principal: montoPago - interesMensual };
    }
  }, [calcularInteresMensual]);

  // Efecto: Calcular automáticamente distribución cuando hay monto y tarjeta
  useEffect(() => {
    if (formData.monto && formData.tarjeta) {
      const deudaSeleccionada = deudas.find(d => d.cuenta === formData.tarjeta);
      if (deudaSeleccionada) {
        const { principal, interes } = distribuirPago(
          Number(formData.monto),
          deudaSeleccionada
        );
        setFormData(prev => ({
          ...prev,
          principal: principal.toFixed(2),
          interes: interes.toFixed(2)
        }));
      }
    }
  }, [formData.monto, formData.tarjeta, deudas, distribuirPago]);

  // Efecto: Scroll suave al input monto si viene con deuda preseleccionada
  useEffect(() => {
    if (deudaPreseleccionada && montoInputRef.current) {
      setTimeout(() => {
        montoInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          montoInputRef.current.querySelector('input')?.focus();
        }, 1200);
      }, 800);
    }
  }, [deudaPreseleccionada]);

  // Efecto: Scroll a cuentas si se selecciona débito
  useEffect(() => {
    if (formData.metodo === 'Débito' && cuentasSectionRef.current) {
      setTimeout(() => {
        cuentasSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    }
  }, [formData.metodo]);

  // Manejo de cambio de tarjeta manual
  const handleSeleccionarTarjeta = (cuentaTarjeta) => {
    setFormData({ ...formData, tarjeta: cuentaTarjeta });
    setTimeout(() => {
      if (montoInputRef.current) {
        montoInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => montoInputRef.current.querySelector('input')?.focus(), 1200);
      }
    }, 600);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const deudaSeleccionada = deudas.find(d => d.cuenta === formData.tarjeta);
      if (!deudaSeleccionada) {
        alert('Debes seleccionar una tarjeta válida');
        return;
      }

      if (!formData.monto || Number(formData.monto) <= 0) {
        alert('Debes ingresar un monto válido');
        return;
      }

      // Validación de saldo para Débito
      if (formData.metodo === 'Débito') {
        if (!formData.cuenta_id) {
          alert('⚠️ Debes seleccionar una cuenta bancaria para débito automático');
          return;
        }
        const cuenta = cuentas.find(c => c.id === formData.cuenta_id);
        if (cuenta && Number(cuenta.balance) < Number(formData.monto)) {
          alert(`❌ Fondos insuficientes\nSaldo: $${Number(cuenta.balance).toFixed(2)}\nMonto: $${Number(formData.monto).toFixed(2)}`);
          return;
        }
      }

      await onSave({
        deuda_id: deudaSeleccionada.id,
        monto_total: Number(formData.monto),
        a_principal: Number(formData.principal),
        intereses: Number(formData.interes),
        metodo: formData.metodo,
        cuenta_id: formData.cuenta_id || null,
        fecha: formData.fecha,
        notas: formData.notas
      });

      onClose();
    } catch (e) {
      console.error('Error registrando pago:', e);
      alert('Error al registrar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  // Datos para visualización
  const deudaActual = deudas.find(d => d.cuenta === formData.tarjeta);
  const interesMensualCalculado = deudaActual ? calcularInteresMensual(deudaActual) : 0;
  const principalNumber = Number(formData.principal || 0);
  const interesNumber = Number(formData.interes || 0);
  const cuentaSeleccionada = cuentas.find(c => c.id === formData.cuenta_id);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-purple-500/30 shadow-2xl relative"
        style={{ scrollBehavior: 'smooth', scrollPaddingTop: '20px' }}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-t-3xl sticky top-0 z-10 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-xl border border-purple-400/30">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Pagar Tarjeta</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-gray-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* SELECTOR DE TARJETAS */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
              1️⃣ Elige la tarjeta a pagar
            </label>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {deudas.map((deuda) => {
                const isSelected = formData.tarjeta === deuda.cuenta;
                const pagoMinimo = deuda.pago_minimo || 0;
                // Porcentaje de uso (si hay balance total)
                const usoPorcentaje = deuda.balance && deuda.balance > 0 
                  ? Math.min((deuda.saldo / deuda.balance) * 100, 100) 
                  : 0;

                return (
                  <button
                    key={deuda.id}
                    type="button"
                    onClick={() => handleSeleccionarTarjeta(deuda.cuenta)}
                    disabled={isLoading}
                    className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 scale-[1.02]' 
                        : 'border-gray-700 bg-white/5 hover:border-purple-500/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                    )}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-5 h-5 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                        <div>
                          <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                            {deuda.cuenta}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {deuda.tipo || 'Crédito'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isSelected ? 'text-purple-300' : 'text-gray-300'}`}>
                          ${deuda.saldo?.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Pago Min: ${pagoMinimo.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {deuda.balance && deuda.balance > 0 && (
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-full rounded-full transition-all ${isSelected ? 'bg-purple-500' : 'bg-gray-500'}`}
                          style={{ width: `${usoPorcentaje}%` }}
                        />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INFO DE INTERESES CALCULADO */}
          {deudaActual && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-blue-200 text-xs font-semibold uppercase">Interés mensual estimado:</p>
                <p className="text-blue-100 text-sm">
                  ${interesMensualCalculado.toFixed(2)} <span className="text-blue-300 opacity-70">(APR {((deudaActual.apr || 0) * 100).toFixed(1)}%)</span>
                </p>
              </div>
            </div>
          )}

          {/* MONTO */}
          <div ref={montoInputRef}>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
              2️⃣ Monto a Pagar
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                disabled={isLoading}
                className="w-full bg-gray-800 text-white pl-10 pr-4 py-4 rounded-2xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700 disabled:bg-gray-900 disabled:opacity-50 placeholder-gray-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            {/* FECHA */}
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              disabled={isLoading}
              className="w-full mt-2 bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-xl focus:outline-none focus:border-purple-500 disabled:opacity-50"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* DISTRIBUCIÓN VISUAL */}
          {formData.monto && Number(formData.monto) > 0 && (
            <div className="bg-gray-800/50 border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-purple-400" />
                <h4 className="text-white font-semibold text-sm">Distribución del Pago</h4>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="text-center">
                  <p className="text-gray-400 text-xs uppercase">A Intereses</p>
                  <p className="text-red-400 font-bold text-lg">${interesNumber.toFixed(2)}</p>
                </div>
                <div className="h-8 w-px bg-gray-700"></div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs uppercase">A Capital</p>
                  <p className="text-emerald-400 font-bold text-lg">${principalNumber.toFixed(2)}</p>
                </div>
              </div>
              {principalNumber === 0 && interesNumber > 0 && (
                <div className="mt-2 text-xs text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Este pago solo cubre intereses. El saldo no se reducirá.
                </div>
              )}
              {principalNumber > 0 && (
                <div className="mt-2 text-xs text-emerald-500 flex items-center gap-1">
                  ✅ Reducirás tu deuda en ${principalNumber.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* MÉTODO DE PAGO */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
              3️⃣ Método
            </label>
            <div className="grid grid-cols-1 gap-2">
              {METODOS_PAGO.map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => setFormData({ ...formData, metodo: metodo, cuenta_id: metodo === 'Débito' ? formData.cuenta_id : null })}
                  disabled={isLoading}
                  className={`p-3 md:p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                    formData.metodo === metodo 
                      ? 'bg-purple-600 border-purple-600 text-white' 
                      : 'bg-gray-800 border-gray-700 hover:border-purple-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-black/20 p-1.5 rounded-lg">
                      {metodo === 'Efectivo' && '💵'}
                      {metodo === 'Tarjeta' && '💳'}
                      {metodo === 'Transferencia' && '🏦'}
                      {metodo === 'Cheque' && '📄'}
                      {metodo === 'Débito' && '💳'}
                    </div>
                    <span className="font-semibold text-sm md:text-base">{metodo}</span>
                  </div>
                  {formData.metodo === metodo && <div className="w-2 h-2 bg-white rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTOR DE CUENTA (SI ES DÉBITO) */}
          {formData.metodo === 'Débito' && (
            <div ref={cuentasSectionRef} className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <h4 className="text-white font-semibold text-sm">4️⃣ Cuenta de Débito</h4>
              </div>
              {cuentas.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tienes cuentas bancarias.
                </div>
              ) : (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                  {cuentas.map((cuenta) => {
                    const isSelected = formData.cuenta_id === cuenta.id;
                    const tieneFondos = !formData.monto || Number(cuenta.balance) >= Number(formData.monto);
                    return (
                      <button
                        key={cuenta.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, cuenta_id: cuenta.id })}
                        disabled={isLoading || !tieneFondos}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                          isSelected 
                            ? 'bg-cyan-600 border-cyan-600 text-white' 
                            : tieneFondos
                            ? 'bg-gray-800 border-gray-700 hover:border-cyan-500/50 hover:bg-gray-700' 
                            : 'bg-red-500/10 border-red-500/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                          <div>
                            <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                              {cuenta.nombre}
                            </div>
                            <div className="text-xs text-gray-400">
                              {cuenta.tipo} • {cuenta.banco}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${
                            tieneFondos ? isSelected ? 'text-cyan-100' : 'text-emerald-400' : 'text-red-400'
                          }`}>
                            ${Number(cuenta.balance).toFixed(2)}
                          </div>
                          {!tieneFondos && <div className="text-[10px] text-red-400">Fondos</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* NOTAS */}
          <div>
             <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
               📝 Notas
             </label>
             <textarea
               value={formData.notas}
               onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
               rows={2}
               disabled={isLoading}
               className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 resize-none text-sm md:text-base border border-gray-700"
               style={{ fontSize: '16px' }}
               placeholder="Detalles del pago..."
             />
          </div>

          {/* RESUMEN DEUDA (AL PIE) */}
          {deudaActual && cuentaSeleccionada && formData.metodo === 'Débito' && formData.monto && (
             <div className="mt-4 p-3 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between">
                <span className="text-gray-400 text-xs">Saldo Final Tarjeta:</span>
                <span className="text-white font-bold text-sm">
                  ${((deudaActual.saldo || 0) - principalNumber).toFixed(2)}
                </span>
             </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-gray-900/90 sticky bottom-0 z-10">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.monto}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
              {isLoading ? 'Procesando...' : 'Pagar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}