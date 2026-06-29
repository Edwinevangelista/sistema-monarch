import { useState } from 'react';
import { X, PiggyBank, Target, TrendingUp, Zap, CheckCircle2 } from 'lucide-react';

import { usePlanesGuardados } from '../hooks/usePlanesGuardados';
import { toast } from 'sonner'

// ==========================================
// FUNCIONES DE CÁLCULO
// ==========================================

function calcularPlanAhorro(config) {
  const {
    montoObjetivo,
    plazoMeses,
    ahorroMensual,
    tasaInteres = 0,
    ahorroInicial = 0
  } = config;

  if (montoObjetivo && plazoMeses) {
    const tasaMensual = tasaInteres / 12 / 100;
    let ahorroNecesario;
    
    if (tasaMensual > 0) {
      const factor = (Math.pow(1 + tasaMensual, plazoMeses) - 1) / tasaMensual;
      ahorroNecesario = (montoObjetivo - ahorroInicial * Math.pow(1 + tasaMensual, plazoMeses)) / factor;
    } else {
      ahorroNecesario = (montoObjetivo - ahorroInicial) / plazoMeses;
    }

    return {
      tipoCalculo: 'por_objetivo',
      montoObjetivo,
      plazoMeses,
      ahorroMensual: Math.ceil(ahorroNecesario),
      ahorroInicial,
      tasaInteres,
      interesesGanados: montoObjetivo - (ahorroNecesario * plazoMeses + ahorroInicial)
    };
  }

  if (ahorroMensual && plazoMeses) {
    const tasaMensual = tasaInteres / 12 / 100;
    let montoFinal;
    
    if (tasaMensual > 0) {
      const factor = (Math.pow(1 + tasaMensual, plazoMeses) - 1) / tasaMensual;
      montoFinal = ahorroMensual * factor + ahorroInicial * Math.pow(1 + tasaMensual, plazoMeses);
    } else {
      montoFinal = ahorroMensual * plazoMeses + ahorroInicial;
    }

    return {
      tipoCalculo: 'por_ahorro_mensual',
      montoObjetivo: Math.round(montoFinal),
      plazoMeses,
      ahorroMensual,
      ahorroInicial,
      tasaInteres,
      interesesGanados: montoFinal - (ahorroMensual * plazoMeses + ahorroInicial)
    };
  }

  return null;
}

function generarRecomendaciones(plan, kpis) {
  const recomendaciones = [];
  const { ahorroMensual, plazoMeses, tasaInteres } = plan;
  const disponible = kpis.saldo || 0;
  const capacidad = disponible * 0.3;

  if (ahorroMensual > capacidad * 1.5) {
    recomendaciones.push({
      icon: '⚠️',
      title: 'Meta muy ambiciosa',
      message: `Tu ahorro mensual ($${ahorroMensual.toLocaleString()}) supera tu capacidad actual`,
      priority: 'critical',
      action: 'Considera extender el plazo o reducir el monto objetivo'
    });
  }

  if (plazoMeses >= 12 && tasaInteres === 0) {
    recomendaciones.push({
      icon: '📈',
      title: 'Aprovecha el interés compuesto',
      message: 'Un plazo largo es ideal para invertir tu ahorro',
      priority: 'high',
      action: 'Busca opciones de inversión con al menos 5% anual'
    });
  }

  if (ahorroMensual <= capacidad) {
    recomendaciones.push({
      icon: '✅',
      title: 'Plan alcanzable',
      message: 'Tu meta está dentro de tu capacidad de ahorro',
      priority: 'success',
      action: 'Mantén la disciplina y ajusta si aumentan tus ingresos'
    });
  }

  const extra = Math.floor(capacidad - ahorroMensual);
  if (extra > 100) {
    recomendaciones.push({
      icon: '🚀',
      title: 'Acelera tu meta',
      message: `Podrías ahorrar $${extra} extra al mes`,
      priority: 'medium',
      action: `Alcanzarías tu meta ${Math.round((ahorroMensual * plazoMeses) / (ahorroMensual + extra))} meses antes`
    });
  }

  return recomendaciones;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function SavingsPlannerModal({ kpis = {}, onClose, onPlanGuardado }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    tipoMeta: 'objetivo',
    montoObjetivo: '',
    plazoMeses: '',
    ahorroMensual: '',
    ahorroInicial: '',
    tasaInteres: '',
    nombreMeta: ''
  });
  const [plan, setPlan] = useState(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);

  const { addPlan } = usePlanesGuardados();

  const handleNext = () => {
    if (step === 1 && !config.tipoMeta) {
      toast.error('Selecciona un tipo de meta');
      return;
    }
    if (step === 2) {
      if (config.tipoMeta === 'objetivo' && (!config.montoObjetivo || !config.plazoMeses)) {
        toast.error('Completa el monto objetivo y el plazo');
        return;
      }
      if (config.tipoMeta === 'ahorro_libre' && (!config.ahorroMensual || !config.plazoMeses)) {
        toast.error('Completa el ahorro mensual y el plazo');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const generarPlan = () => {
    const configNumerica = {
      montoObjetivo: config.tipoMeta === 'objetivo' ? Number(config.montoObjetivo) : null,
      plazoMeses: Number(config.plazoMeses),
      ahorroMensual: config.tipoMeta === 'ahorro_libre' ? Number(config.ahorroMensual) : null,
      tasaInteres: Number(config.tasaInteres) || 0,
      ahorroInicial: Number(config.ahorroInicial) || 0
    };

    const resultado = calcularPlanAhorro(configNumerica);
    
    if (!resultado) {
      toast.error('No se pudo calcular el plan. Verifica los datos.');
      return;
    }

    const recomendaciones = generarRecomendaciones(resultado, kpis);
    
    setPlan({
      ...resultado,
      nombreMeta: config.nombreMeta || 'Ahorro General',
      recomendaciones
    });
    setStep(4);
  };

  return (
    <>
      {/* ✅ FIX: Usa 100dvh y resta espacio para menú inferior móvil */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 md:p-4">
  <div className="bg-gray-900 w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] md:rounded-2xl shadow-2xl border-0 md:border border-white/10 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-900/80 to-emerald-900/80 backdrop-blur-md p-4 md:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg text-green-300 border border-green-500/20">
                <PiggyBank className="w-5 h-5 md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-white">Planificador de Ahorro</h2>
                <p className="text-green-200 text-xs md:text-sm">Alcanza tus metas financieras</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-900/50 border-b border-white/5 shrink-0">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className={`h-2 rounded-full transition-all ${num === step ? 'w-12 bg-green-500' : num < step ? 'w-2 bg-green-600' : 'w-2 bg-gray-700'}`} />
            ))}
          </div>

          {/* ✅ FIX: Content area es flex-1 con overflow, min-h-0 es clave para que flex funcione */}
          <div className="p-4 md:p-6 overflow-y-auto flex-1 min-h-0">
            {step === 1 && <Step1TipoMeta config={config} setConfig={setConfig} />}
            {step === 2 && <Step2Detalles config={config} setConfig={setConfig} kpis={kpis} />}
            {step === 3 && <Step3Opcionales config={config} setConfig={setConfig} />}
            {step === 4 && plan && <Step4Resultado plan={plan} onGuardar={() => setShowConfirmacion(true)} />}
          </div>

          {/* ✅ FIX: Footer SIEMPRE visible con padding extra para safe area iOS */}
          <div className="p-4 pb-6 border-t border-white/10 bg-gray-900/90 backdrop-blur shrink-0 flex gap-3">
            {step > 1 && step < 4 && (
              <button onClick={handleBack} className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white py-3.5 rounded-xl font-bold transition">
                Atrás
              </button>
            )}
            {step < 3 && (
              <button onClick={handleNext} className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white py-3.5 rounded-xl font-bold transition">
                Siguiente
              </button>
            )}
            {step === 3 && (
              <button onClick={generarPlan} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:from-green-700 active:to-emerald-700 text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" /> Generar Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmacion && plan && (
        <ConfirmModal
          plan={plan}
          tipo="ahorro"
          onConfirmar={async (nombre) => {
            try {
              await addPlan({
                tipo: 'ahorro',
                nombre: nombre,
                descripcion: `Plan de ahorro: ${plan.nombreMeta}`,
                configuracion: plan,
                meta_principal: plan.nombreMeta,
                monto_objetivo: plan.montoObjetivo,
                monto_actual: plan.ahorroInicial || 0,
                progreso: 0,
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_objetivo: new Date(Date.now() + plan.plazoMeses * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                meses_duracion: plan.plazoMeses,
                activo: true,
                completado: false
              });

              toast.success('Plan guardado exitosamente');
              setShowConfirmacion(false);
              if (onPlanGuardado) onPlanGuardado();
              onClose();
            } catch (error) {
              console.error('Error guardando plan:', error);
              toast.error('Error al guardar el plan: ' + error.message);
            }
          }}
          onCancelar={() => setShowConfirmacion(false)}
        />
      )}
    </>
  );
}

// ==========================================
// STEPS DEL WIZARD
// ==========================================

function Step1TipoMeta({ config, setConfig }) {
  const tipos = [
    {
      id: 'objetivo',
      icon: <Target className="w-7 h-7 md:w-8 md:h-8" />,
      title: 'Meta Específica',
      desc: 'Tengo un monto objetivo y necesito saber cuánto ahorrar',
      examples: 'Ej: Casa, auto, viaje'
    },
    {
      id: 'ahorro_libre',
      icon: <PiggyBank className="w-7 h-7 md:w-8 md:h-8" />,
      title: 'Ahorro Mensual',
      desc: 'Quiero ahorrar una cantidad fija cada mes',
      examples: 'Ej: Fondo de emergencia, inversión'
    }
  ];

  return (
    <div className="space-y-5 max-w-2xl mx-auto animate-in fade-in">
      <div className="text-center mb-4 md:mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">¿Qué tipo de plan quieres crear?</h3>
        <p className="text-gray-400 text-sm">Elige según tu objetivo de ahorro</p>
      </div>

      {/* ✅ FIX: En móvil es columna, los cards son más compactos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {tipos.map(tipo => {
          const isSelected = config.tipoMeta === tipo.id;
          return (
            <button
              key={tipo.id}
              onClick={() => setConfig(prev => ({ ...prev, tipoMeta: tipo.id }))}
              className={`p-4 md:p-6 rounded-2xl text-left transition-all border-2 ${
                isSelected
                  ? 'bg-green-600/20 border-green-500 ring-2 ring-green-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <div className={`p-2.5 md:p-3 rounded-xl mb-3 md:mb-4 inline-block ${isSelected ? 'bg-white text-green-600' : 'bg-green-500/20 text-green-300'}`}>
                {tipo.icon}
              </div>
              <h4 className="text-white font-bold text-base md:text-lg mb-1 md:mb-2">{tipo.title}</h4>
              <p className="text-gray-300 text-sm mb-2 md:mb-3">{tipo.desc}</p>
              <p className="text-gray-500 text-xs italic">{tipo.examples}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step2Detalles({ config, setConfig, kpis }) {
  const capacidadEstimada = Math.floor((kpis.saldo || 0) * 0.3);

  return (
    <div className="space-y-5 max-w-xl mx-auto animate-in fade-in">
      <div className="text-center mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Detalles de tu plan</h3>
        <p className="text-gray-400 text-sm">Define los números principales</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 md:p-4">
        <div className="flex items-center gap-2 text-blue-300 mb-1">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-bold">Tu capacidad estimada de ahorro</span>
        </div>
        <div className="text-white text-xl md:text-2xl font-bold">${capacidadEstimada.toLocaleString()}<span className="text-sm text-gray-400">/mes</span></div>
        <p className="text-gray-400 text-xs mt-1">Basado en tu saldo disponible actual</p>
      </div>

      <div>
        <label className="block text-white font-semibold mb-2 text-sm">Nombre de tu meta</label>
        <input
          type="text"
          value={config.nombreMeta}
          onChange={(e) => setConfig(prev => ({ ...prev, nombreMeta: e.target.value }))}
          placeholder="Ej: Vacaciones en Europa"
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-base"
        />
      </div>

      {config.tipoMeta === 'objetivo' ? (
        <>
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">Monto objetivo</label>
            <input
              type="number"
              inputMode="numeric"
              value={config.montoObjetivo}
              onChange={(e) => setConfig(prev => ({ ...prev, montoObjetivo: e.target.value }))}
              placeholder="¿Cuánto necesitas?"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-base"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">Plazo (meses)</label>
            <input
              type="number"
              inputMode="numeric"
              value={config.plazoMeses}
              onChange={(e) => setConfig(prev => ({ ...prev, plazoMeses: e.target.value }))}
              placeholder="¿En cuánto tiempo?"
              min="1"
              max="120"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-base"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">Ahorro mensual</label>
            <input
              type="number"
              inputMode="numeric"
              value={config.ahorroMensual}
              onChange={(e) => setConfig(prev => ({ ...prev, ahorroMensual: e.target.value }))}
              placeholder="¿Cuánto puedes ahorrar al mes?"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-base"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">Plazo (meses)</label>
            <input
              type="number"
              inputMode="numeric"
              value={config.plazoMeses}
              onChange={(e) => setConfig(prev => ({ ...prev, plazoMeses: e.target.value }))}
              placeholder="¿Por cuánto tiempo?"
              min="1"
              max="120"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-base"
            />
          </div>
        </>
      )}
    </div>
  );
}

function Step3Opcionales({ config, setConfig }) {
  return (
    <div className="space-y-5 max-w-xl mx-auto animate-in fade-in">
      <div className="text-center mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Opciones avanzadas</h3>
        <p className="text-gray-400 text-sm">Estas son opcionales pero ayudan a mejorar tu plan</p>
      </div>

      <div>
        <label className="block text-white font-semibold mb-2 text-sm">Ahorro inicial (opcional)</label>
        <input
          type="number"
          inputMode="numeric"
          value={config.ahorroInicial}
          onChange={(e) => setConfig(prev => ({ ...prev, ahorroInicial: e.target.value }))}
          placeholder="¿Ya tienes algo ahorrado?"
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-base"
        />
        <p className="text-gray-500 text-xs mt-1">Ingresa $0 si empiezas desde cero</p>
      </div>

      <div>
        <label className="block text-white font-semibold mb-2 text-sm">Tasa de interés anual (opcional)</label>
        <input
          type="number"
          inputMode="decimal"
          value={config.tasaInteres}
          onChange={(e) => setConfig(prev => ({ ...prev, tasaInteres: e.target.value }))}
          placeholder="% anual"
          step="0.1"
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-base"
        />
        <p className="text-gray-500 text-xs mt-1">Si vas a invertir tu ahorro, ingresa el rendimiento esperado</p>
      </div>
    </div>
  );
}

function Step4Resultado({ plan, onGuardar }) {
  if (!plan) return null;

  const { montoObjetivo, plazoMeses, ahorroMensual, interesesGanados, recomendaciones, nombreMeta } = plan;

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto animate-in fade-in">
      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-2xl p-4 md:p-6 text-center">
        <div className="text-4xl md:text-5xl mb-3 md:mb-4">💰</div>
        <h3 className="text-white font-bold text-xl md:text-2xl mb-1 md:mb-2">{nombreMeta}</h3>
        <p className="text-green-200 text-sm">Tu plan de ahorro personalizado</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-1">Meta</div>
          <div className="text-white font-bold text-base md:text-xl">${montoObjetivo.toLocaleString()}</div>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-1">Plazo</div>
          <div className="text-white font-bold text-base md:text-xl">{plazoMeses}</div>
          <div className="text-gray-500 text-[10px] md:text-xs">meses</div>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-1">Mensual</div>
          <div className="text-green-400 font-bold text-base md:text-xl">${ahorroMensual.toLocaleString()}</div>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-1">Intereses</div>
          <div className="text-white font-bold text-base md:text-xl">${Math.round(interesesGanados).toLocaleString()}</div>
        </div>
      </div>

      {/* Recomendaciones */}
      {recomendaciones.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          <h4 className="text-white font-semibold text-base md:text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Recomendaciones
          </h4>
          {recomendaciones.map((rec, idx) => (
            <div 
              key={idx}
              className={`p-3 md:p-4 rounded-xl border flex items-start gap-3 ${
                rec.priority === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                rec.priority === 'high' ? 'bg-orange-500/10 border-orange-500/20' :
                rec.priority === 'success' ? 'bg-green-500/10 border-green-500/20' :
                'bg-white/5 border-white/10'
              }`}
            >
              <span className="text-xl md:text-2xl shrink-0">{rec.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{rec.title}</div>
                <div className="text-gray-300 text-xs md:text-sm mt-1">{rec.message}</div>
                {rec.action && (
                  <div className="text-green-300 text-xs md:text-sm mt-2 font-medium">→ {rec.action}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onGuardar}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:from-green-700 active:to-emerald-700 text-white py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg transition flex items-center justify-center gap-3"
      >
        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> Guardar Mi Plan
      </button>
    </div>
  );
}

function ConfirmModal({ onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      toast.error('Por favor ingresa un nombre para tu plan');
      return;
    }
    setGuardando(true);
    await onConfirmar(nombre);
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[20000] p-4 animate-in fade-in">
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/20">
        <button 
          onClick={onCancelar}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full border border-white/30 mb-4">
            <span className="text-3xl md:text-4xl">💰</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Guardar Plan de Ahorro</h3>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 md:p-4 mb-5 md:mb-6 border border-white/20">
            <p className="text-white/90 text-sm leading-relaxed">
              Este plan se guardará en tu lista de planes activos. Podrás verlo y seguir tu progreso.
            </p>
          </div>

          <div className="mb-5 md:mb-6 text-left">
            <label className="block text-white/80 text-sm mb-2 font-bold">Nombre del plan</label>
            <input 
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Ej: Plan de Ahorro ${new Date().getFullYear()}`}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-base"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              disabled={guardando}
              className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 bg-white text-green-900 py-3 rounded-xl font-bold hover:bg-white/90 active:bg-white/80 transition flex items-center justify-center gap-2"
            >
              {guardando ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="w-5 h-5" />}
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}