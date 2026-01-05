// src/components/SavingsPlannerModal.jsx
// ✅ VERSIÓN COMPLETA Y CORREGIDA con guardado de planes

import { useState } from 'react';
import { X, Target, Plane, ShoppingBag, Shield, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateSavingsPlan } from '../lib/brain/brain.savingsplanner';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

export default function SavingsPlannerModal({ kpis, onClose, onPlanGuardado }) {
  const [step, setStep] = useState(1);
  const [goalType, setGoalType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    item: '',
    destination: '',
    people: '',
    days: '',
    amount: '',
    timeframe: ''
  });
  const [plan, setPlan] = useState(null);
  const { addPlan } = usePlanesGuardados();
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [planParaGuardar, setPlanParaGuardar] = useState(null);
  
  const goalTypes = [
    { id: 'vacation', name: 'Vacaciones', icon: <Plane className="w-8 h-8" />, color: 'from-blue-600 to-cyan-600' },
    { id: 'purchase', name: 'Compra Específica', icon: <ShoppingBag className="w-8 h-8" />, color: 'from-purple-600 to-pink-600' },
    { id: 'emergency_fund', name: 'Fondo de Emergencia', icon: <Shield className="w-8 h-8" />, color: 'from-green-600 to-emerald-600' },
    { id: 'custom', name: 'Meta Personalizada', icon: <Sparkles className="w-8 h-8" />, color: 'from-orange-600 to-red-600' }
  ];

  const handleInputChange = (field, value) => {
    console.log('Cambiando', field, '=', value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('Nuevo estado:', newData);
      return newData;
    });
  };

  const handleGeneratePlan = () => {
    try {
      // Preparar datos según el tipo de meta
      const goalData = {
        type: goalType,
        amount: Number(formData.amount) || 1000,
        timeframe: Number(formData.timeframe) || 12,
        details: {}
      };

      // Agregar detalles específicos según el tipo
      if (goalType === 'vacation') {
        goalData.details = {
          destination: formData.destination || 'Destino',
          people: Number(formData.people) || 1,
          days: Number(formData.days) || 7
        };
      } else if (goalType === 'purchase') {
        goalData.details = {
          item: formData.item || 'Artículo',
          category: 'general'
        };
      } else if (goalType === 'custom') {
        goalData.details = {
          name: formData.name || 'Meta personalizada',
          description: 'Meta de ahorro personalizada'
        };
      }

      console.log('Generando plan con:', goalData, 'KPIs:', kpis);
      
      const generatedPlan = generateSavingsPlan(goalData, kpis);
      console.log('Plan generado:', generatedPlan);
      
      setPlan(generatedPlan);
      setPlanParaGuardar(generatedPlan);
      setStep(3);
    } catch (error) {
      console.error('Error generando plan:', error);
      alert('Error al generar el plan: ' + error.message + '\nRevisa la consola para más detalles.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl max-w-4xl w-full my-8" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-300" />
            <div>
              <h2 className="text-2xl font-bold text-white">Plan de Ahorro</h2>
              <p className="text-indigo-200 text-sm">Define metas personalizadas y alcánzalas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 p-6 bg-white/5">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'
              }`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-400'}`}>
                {s === 1 ? 'Tipo' : s === 2 ? 'Detalles' : 'Plan'}
              </span>
              {s < 3 && <div className="w-8 h-0.5 bg-white/20" />}
            </div>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* PASO 1: TIPO */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">¿Qué quieres ahorrar?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setGoalType(type.id);
                      setStep(2);
                    }}
                    className={`bg-gradient-to-br ${type.color} p-6 rounded-xl hover:scale-105 transition text-left`}
                  >
                    <div className="text-white mb-3">{type.icon}</div>
                    <h4 className="text-white font-bold text-lg">{type.name}</h4>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2: DETALLES */}
          {step === 2 && (
            <div className="space-y-6">
              <button onClick={() => setStep(1)} className="text-purple-300 hover:text-purple-200">
                ← Volver
              </button>

              <h3 className="text-xl font-bold text-white">
                {goalTypes.find(t => t.id === goalType)?.name}
              </h3>

              {goalType === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-white font-semibold mb-2 block">Nombre de tu meta</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ej: Casa nueva, Educación, Negocio..."
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Monto objetivo</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="10000"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">¿En cuántos meses?</label>
                    <input
                      type="number"
                      value={formData.timeframe}
                      onChange={(e) => handleInputChange('timeframe', e.target.value)}
                      placeholder="24"
                      min="1"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>
                </div>
              )}

              {goalType === 'purchase' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-white font-semibold mb-2 block">¿Qué quieres comprar?</label>
                    <input
                      type="text"
                      value={formData.item}
                      onChange={(e) => handleInputChange('item', e.target.value)}
                      placeholder="Ej: Laptop, Auto, Muebles..."
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Precio</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="5000"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">¿En cuántos meses?</label>
                    <input
                      type="number"
                      value={formData.timeframe}
                      onChange={(e) => handleInputChange('timeframe', e.target.value)}
                      placeholder="12"
                      min="1"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>
                </div>
              )}

              {goalType === 'vacation' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-white font-semibold mb-2 block">Destino</label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      placeholder="Ej: Cancún, París, Nueva York..."
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white font-semibold mb-2 block">Personas</label>
                      <input
                        type="number"
                        value={formData.people}
                        onChange={(e) => handleInputChange('people', e.target.value)}
                        placeholder="2"
                        min="1"
                        className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="text-white font-semibold mb-2 block">Días</label>
                      <input
                        type="number"
                        value={formData.days}
                        onChange={(e) => handleInputChange('days', e.target.value)}
                        placeholder="7"
                        min="1"
                        className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Presupuesto Estimado</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="3000"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">¿En cuántos meses?</label>
                    <input
                      type="number"
                      value={formData.timeframe}
                      onChange={(e) => handleInputChange('timeframe', e.target.value)}
                      placeholder="12"
                      min="1"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>
                </div>
              )}

              {goalType === 'emergency_fund' && (
                <div className="space-y-4">
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                    <p className="text-blue-200 text-sm">
                      💡 Se recomienda tener 3-6 meses de gastos ahorrados
                    </p>
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Meta de Ahorro</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="5000"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">¿En cuántos meses?</label>
                    <input
                      type="number"
                      value={formData.timeframe}
                      onChange={(e) => handleInputChange('timeframe', e.target.value)}
                      placeholder="12"
                      min="1"
                      className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-purple-400 outline-none placeholder-gray-400"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGeneratePlan}
                disabled={!formData.amount || !formData.timeframe}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Generar Plan de Ahorro
              </button>
            </div>
          )}

          {/* PASO 3: PLAN */}
          {step === 3 && plan && (
            <PlanView plan={plan} onBack={() => setStep(2)} onGuardar={() => setShowConfirmacion(true)} />
          )}
        </div>

        {/* ✅ MODAL DE CONFIRMACIÓN */}
        {showConfirmacion && planParaGuardar && (
          <ConfirmacionGuardadoPlan
            plan={planParaGuardar}
            tipo="ahorro"
            onConfirmar={async (nombre) => {
              try {
                const config = planParaGuardar.configuracion || planParaGuardar;
                
                // ✅ CALCULAR MESES
                let mesesCalculados = 0;
                
                if (config.meses) {
                  mesesCalculados = Number(config.meses);
                } else if (config.plan?.timeframe) {
                  mesesCalculados = Number(config.plan.timeframe);
                } else if (config.timeline?.length) {
                  mesesCalculados = config.timeline.length;
                } else if (config.fechaObjetivo) {
                  const hoy = new Date();
                  const objetivo = new Date(config.fechaObjetivo);
                  const diffMeses = Math.ceil((objetivo - hoy) / (1000 * 60 * 60 * 24 * 30));
                  mesesCalculados = Math.max(1, diffMeses);
                }
                
                mesesCalculados = isNaN(mesesCalculados) || mesesCalculados <= 0 ? 12 : mesesCalculados;

                console.log('💾 Guardando plan con:', {
                  nombre,
                  meses: mesesCalculados,
                  config
                });

                await addPlan({
                  tipo: 'ahorro',
                  nombre: nombre,
                  descripcion: `Plan de ahorro para ${config.goal?.name || formData.name || goalTypes.find(t => t.id === goalType)?.name || 'objetivo financiero'}`,
                  configuracion: config,
                  meta_principal: config.goal?.name || formData.name || goalTypes.find(t => t.id === goalType)?.name || 'Ahorro',
                  monto_objetivo: config.plan?.targetAmount || Number(formData.amount) || 0,
                  monto_actual: 0,
                  progreso: 0,
                  fecha_inicio: new Date().toISOString().split('T')[0],
                  fecha_objetivo: config.fechaObjetivo || null,
                  meses_duracion: mesesCalculados,
                  activo: true,
                  completado: false
                });

                console.log('✅ Plan guardado en DB');

                if (onPlanGuardado) {
                  console.log('🔄 Actualizando lista de planes...');
                  await onPlanGuardado();
                }

                alert('✅ Plan guardado exitosamente');
                setShowConfirmacion(false);
                
                setTimeout(() => {
                  onClose();
                }, 300);

              } catch (error) {
                console.error('❌ Error guardando plan:', error);
                alert('Error al guardar el plan: ' + error.message);
              }
            }}
            onCancelar={() => setShowConfirmacion(false)}
          />
        )}
      </div>
    </div>
  );
}

// ========== VISTA DEL PLAN ==========
function PlanView({ plan, onBack, onGuardar }) {
  if (!plan || !plan.plan) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-white text-lg">Error al generar el plan</p>
        <button onClick={onBack} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg">
          Volver
        </button>
      </div>
    );
  }

  const { plan: planDetails, capacity = {}, feasibility = {}, recommendations = [] } = plan;
  const targetAmount = Number(planDetails.targetAmount) || 0;
  const monthlyRequired = Number(planDetails.monthlyRequired) || 0;
  const timeframe = Number(planDetails.timeframe) || 1;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-purple-300 hover:text-purple-200 flex items-center gap-2">
        ← Volver
      </button>

      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-400/30">
        <h3 className="text-2xl font-bold text-white mb-4">Tu Plan de Ahorro</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-gray-300 text-sm mb-1">Meta</div>
            <div className="text-white text-2xl font-bold">${targetAmount.toLocaleString()}</div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-gray-300 text-sm mb-1">Mensual</div>
            <div className="text-white text-2xl font-bold">${monthlyRequired}</div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-gray-300 text-sm mb-1">Tiempo</div>
            <div className="text-white text-2xl font-bold">{timeframe} meses</div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-gray-300 text-sm mb-1">Semanal</div>
            <div className="text-white text-2xl font-bold">${planDetails.weeklyRequired || 0}</div>
          </div>
        </div>
      </div>

      {feasibility.level && (
        <div className={`rounded-xl p-5 border ${
          feasibility.color === 'green' ? 'bg-green-500/20 border-green-400/30' :
          feasibility.color === 'blue' ? 'bg-blue-500/20 border-blue-400/30' :
          feasibility.color === 'yellow' ? 'bg-yellow-500/20 border-yellow-400/30' :
          'bg-red-500/20 border-red-400/30'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {feasibility.level === 'easy' && <CheckCircle2 className="w-6 h-6 text-green-300" />}
            {feasibility.level === 'moderate' && <Target className="w-6 h-6 text-blue-300" />}
            {feasibility.level === 'challenging' && <TrendingUp className="w-6 h-6 text-yellow-300" />}
            {feasibility.level === 'difficult' && <AlertCircle className="w-6 h-6 text-red-300" />}
            <h4 className="text-white font-semibold">Factibilidad: {feasibility.percentage}%</h4>
          </div>
          <p className="text-gray-200">{feasibility.message}</p>
        </div>
      )}

      <div className="bg-white/10 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-3">Tu Capacidad de Ahorro</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Conservador:</span>
            <span className="text-white font-semibold">${capacity.conservativeMonthly || 0}/mes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Recomendado:</span>
            <span className="text-white font-semibold">${capacity.recommendedMonthly || 0}/mes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Agresivo:</span>
            <span className="text-white font-semibold">${capacity.aggressiveMonthly || 0}/mes</span>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold">💡 Recomendaciones</h4>
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`rounded-xl p-4 border ${
              rec.priority === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
              rec.priority === 'success' ? 'bg-green-500/10 border-green-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{rec.icon}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">{rec.title}</div>
                  <div className="text-gray-300 text-sm mb-2">{rec.message}</div>
                  {rec.actions && rec.actions.length > 0 && (
                    <ul className="text-purple-300 text-sm space-y-1">
                      {rec.actions.map((action, i) => (
                        <li key={i}>→ {action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button
        onClick={onGuardar}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition"
      >
        💾 Guardar Este Plan
      </button>
    </div>
  );
}

// ========== COMPONENTE DE CONFIRMACIÓN ==========
function ConfirmacionGuardadoPlan({ plan, tipo, onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre para tu plan');
      return;
    }
    
    setGuardando(true);
    try {
      await onConfirmar(nombre);
    } catch (error) {
      console.error('Error en handleGuardar:', error);
    } finally {
      setGuardando(false);
    }
  };

  const getTipoInfo = () => {
    switch(tipo) {
      case 'ahorro':
        return { emoji: '💰', color: 'from-green-600 to-emerald-600', label: 'Ahorro' };
      case 'deudas':
        return { emoji: '💳', color: 'from-red-600 to-pink-600', label: 'Deudas' };
      case 'gastos':
        return { emoji: '💸', color: 'from-orange-600 to-yellow-600', label: 'Gastos' };
      default:
        return { emoji: '📋', color: 'from-blue-600 to-purple-600', label: 'Plan' };
    }
  };

  const { emoji, color, label } = getTipoInfo();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className={`bg-gradient-to-br ${color} rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200`}>
        
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          {emoji} Guardar Plan de {label}
        </h3>
        
        <div className="bg-white/10 rounded-xl p-4 mb-4 backdrop-blur">
          <p className="text-white/90 text-sm mb-3">
            Este plan se guardará en tu lista de planes activos. Podrás verlo, editarlo y seguir tu progreso.
          </p>
          
          {plan && plan.plan && (
            <div className="bg-white/10 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-white/70">Monto:</span>
                <span className="text-white font-semibold">
                  ${(plan.plan.targetAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Tiempo:</span>
                <span className="text-white font-semibold">
                  {plan.plan.timeframe || 12} meses
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-white text-sm mb-2 font-medium">
            Nombre del plan:
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={`Ej: ${label} ${new Date().getFullYear()}`}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 backdrop-blur"
            autoFocus
            disabled={guardando}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={guardando}
            className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition backdrop-blur disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !nombre.trim()}
            className="flex-1 bg-white text-gray-900 py-3 rounded-xl font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {guardando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Guardando...
              </span>
            ) : (
              '✅ Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}