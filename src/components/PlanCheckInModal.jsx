// src/components/PlanCheckInModal.jsx
import React, { useState, useMemo } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, TrendingUp, 
  Meh, ThumbsUp, ThumbsDown,
  MessageSquare, DollarSign, Calendar, Sparkles,
  Trophy, Target, ChevronRight, Zap
} from 'lucide-react';

export default function PlanCheckInModal({ plan, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState({
    paidOnTime: null,
    amountPaid: '',
    usedCreditCards: null,
    followedBudget: null,
    biggestChallenge: '',
    nextWeekCommitment: '',
    mood: null,
    notes: ''
  });
  
  const config = plan?.configuracion || {};
  const targetDebt = config.plan?.orderedDebts?.[0];
  const expectedPayment = config.monthlyPayment || 0;
  
  const handleOptionSelect = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };
  
  // Navegación inteligente
  const handleNextStep = () => {
    if (step === 1 && responses.paidOnTime === false) {
      setStep(3);
    } else if (isLastStep) {
      setStep(totalSteps + 1);
    } else {
      setStep(s => s + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step === 3 && responses.paidOnTime === false) {
      setStep(1);
    } else {
      setStep(s => s - 1);
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return responses.paidOnTime !== null;
      case 2: return responses.amountPaid !== ''; 
      case 3: return responses.usedCreditCards !== null;
      case 4: return responses.followedBudget !== null;
      case 5: return responses.mood !== null;
      default: return true;
    }
  };

  // Generador de Estrategia
  const weeklyStrategy = useMemo(() => {
    const paid = (responses.paidOnTime === true ? parseFloat(responses.amountPaid) : 0) || 0;
    const mood = responses.mood || 3;
    const usedCards = responses.usedCreditCards;
    const percentagePaid = expectedPayment > 0 ? (paid / expectedPayment) * 100 : 0;

    if (mood <= 2 && usedCards) {
      return {
        type: 'rescue',
        title: 'Plan de Rescate Semanal',
        advice: 'Esta semana prioriza tu estabilidad mental. Congela las tarjetas y enfócate solo en cubrir tus necesidades básicas. No te juzgues, recupérate.',
        color: 'purple'
      };
    }
    
    if (percentagePaid >= 100 && mood >= 4) {
      return {
        type: 'acceleration',
        title: 'Modo Aceleración',
        advice: '¡Tienes el viento a favor! Considera aplicar cualquier extra ingreso directamente a la deuda principal para cortar meses de intereses.',
        color: 'emerald'
      };
    }
    
    if (percentagePaid < 50 && mood >= 3) {
      return {
        type: 'adjustment',
        title: 'Ajuste de Ruta',
        advice: 'Detectamos un desvío en el flujo de caja. Revisa tus gastos variables este fin de semana y categoriza: "Necesario" vs "Deseable".',
        color: 'orange'
      };
    }

    return {
      type: 'maintenance',
      title: 'Ritmo Constante',
      advice: 'Vas por buen camino. Mantén el hábito de revisar tus finanzas cada 48 horas. La consistencia es clave para ganar.',
      color: 'blue'
    };
  }, [responses, expectedPayment]);
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepContainer
            icon={<DollarSign className="w-8 h-8 text-green-400" />}
            title="¿Hiciste tu pago esta semana?"
            subtitle={`Meta programada: $${expectedPayment.toLocaleString()} a ${targetDebt?.nombre || 'tu deuda'}`}
          >
            <div className="grid grid-cols-2 gap-4">
              <OptionButton
                selected={responses.paidOnTime === true}
                onClick={() => handleOptionSelect('paidOnTime', true)}
                icon={<ThumbsUp className="w-6 h-6" />}
                label="Sí, cumplí"
                color="green"
              />
              <OptionButton
                selected={responses.paidOnTime === false}
                onClick={() => handleOptionSelect('paidOnTime', false)}
                icon={<ThumbsDown className="w-6 h-6" />}
                label="No pude"
                color="red"
              />
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200">
              <span className="font-bold">💡 IA Tip:</span> Si pagaste menos de la meta, no te preocupes. Lo importante es mantener el ritmo.
            </div>
          </StepContainer>
        );
        
      case 2:
        const currentAmount = parseFloat(responses.amountPaid) || 0;
        const percentage = expectedPayment > 0 ? (currentAmount / expectedPayment) * 100 : 0;
        
        return (
          <StepContainer
            icon={<TrendingUp className="w-8 h-8 text-blue-400" />}
            title="¿Cuánto pagaste exactamente?"
            subtitle="Registra el monto total (capital + intereses)"
          >
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">$</span>
                <input
                  type="number"
                  value={responses.amountPaid}
                  onChange={(e) => setResponses(prev => ({ ...prev, amountPaid: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-white text-center focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="flex gap-2 justify-center flex-wrap">
                {[
                  { label: '50%', val: expectedPayment * 0.5 },
                  { label: 'Meta', val: expectedPayment },
                  { label: 'Extra', val: expectedPayment * 1.2 }
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setResponses(prev => ({ ...prev, amountPaid: opt.val.toString() }))}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      Math.abs(currentAmount - opt.val) < 1
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {currentAmount > 0 && (
                <div className={`p-3 rounded-xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${
                  percentage >= 100 
                    ? 'bg-green-500/20 border-green-500/30' 
                    : percentage >= 70 
                    ? 'bg-yellow-500/20 border-yellow-500/30' 
                    : 'bg-orange-500/20 border-orange-500/30'
                }`}>
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">
                      {percentage >= 100 
                        ? '🚀 ¡Sobrepasaste la meta!' 
                        : percentage >= 70 
                        ? '👍 Buena aportación' 
                        : '⚠️ Por debajo de la meta'}
                    </div>
                    <div className="text-xs text-gray-300">
                      {percentage >= 100 
                        ? 'Estás semanas por delante de tu plan. ¡Sigue así!' 
                        : `Has pagado el ${percentage.toFixed(0)}% de lo necesario.`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </StepContainer>
        );
        
      case 3:
        return (
          <StepContainer
            icon={<AlertTriangle className="w-8 h-8 text-orange-400" />}
            title="¿Usaste tarjetas de crédito?"
            subtitle="Cualquier compra nueva afecta tu progreso"
          >
            <div className="grid grid-cols-2 gap-4">
              <OptionButton
                selected={responses.usedCreditCards === false}
                onClick={() => handleOptionSelect('usedCreditCards', false)}
                icon={<CheckCircle2 className="w-6 h-6" />}
                label="No, me abstuve"
                color="green"
              />
              <OptionButton
                selected={responses.usedCreditCards === true}
                onClick={() => handleOptionSelect('usedCreditCards', true)}
                icon={<AlertTriangle className="w-6 h-6" />}
                label="Sí, las usé"
                color="red"
              />
            </div>
            
            {responses.usedCreditCards === true && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in fade-in">
                <div className="flex gap-2 text-red-200 text-sm">
                  <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Estrategia de Corrección:</strong><br/>
                    No te castigues, pero aplica la <strong>"Regla de las 24 Horas"</strong> la próxima semana. 
                    Si quieres comprar algo, espera 24h. Si aún lo necesitas, usa dinero (débito).
                  </div>
                </div>
              </div>
            )}
            
            {responses.usedCreditCards === false && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-in fade-in">
                <div className="flex gap-2 text-green-200 text-sm">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>¡Victoria silenciosa!</strong><br/>
                    No usar tarjetas es el hábito más difícil de romper. Acabas de ganar la semana solo con esta decisión.
                  </div>
                </div>
              </div>
            )}
          </StepContainer>
        );
        
      case 4:
        return (
          <StepContainer
            icon={<Target className="w-8 h-8 text-purple-400" />}
            title="Control de Gastos Variables"
            subtitle="¿Respetaste tu presupuesto de gastos variables?"
          >
            <div className="grid grid-cols-3 gap-3">
              <OptionButton
                selected={responses.followedBudget === 'yes'}
                onClick={() => handleOptionSelect('followedBudget', 'yes')}
                icon={<ThumbsUp className="w-5 h-5" />}
                label="Sí, todo"
                color="green"
                compact
              />
              <OptionButton
                selected={responses.followedBudget === 'mostly'}
                onClick={() => handleOptionSelect('followedBudget', 'mostly')}
                icon={<Meh className="w-5 h-5" />}
                label="Casi todo"
                color="yellow"
                compact
              />
              <OptionButton
                selected={responses.followedBudget === 'no'}
                onClick={() => handleOptionSelect('followedBudget', 'no')}
                icon={<ThumbsDown className="w-5 h-5" />}
                label="Me excedí"
                color="red"
                compact
              />
            </div>
          </StepContainer>
        );
        
      case 5:
        return (
          <StepContainer
            icon={<Sparkles className="w-8 h-8 text-pink-400" />}
            title="¿Cómo te sientes emocionalmente?"
            subtitle="Tu salud mental es parte de la fórmula"
          >
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 5, emoji: '😁', label: 'Genial' },
                { value: 4, emoji: '🙂', label: 'Bien' },
                { value: 3, emoji: '😐', label: 'Normal' },
                { value: 2, emoji: '😟', label: 'Difícil' },
                { value: 1, emoji: '😫', label: 'Agotado' }
              ].map(mood => (
                <button
                  key={mood.value}
                  onClick={() => handleOptionSelect('mood', mood.value)}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    responses.mood === mood.value
                      ? 'bg-pink-500/30 border-2 border-pink-400 scale-105 shadow-lg shadow-pink-500/20'
                      : 'bg-white/10 border border-white/10 hover:bg-white/20'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-[10px] text-gray-300">{mood.label}</span>
                </button>
              ))}
            </div>
          </StepContainer>
        );
        
      case 6:
        return (
          <StepContainer
            icon={<MessageSquare className="w-8 h-8 text-cyan-400" />}
            title="Notas para tu futuro yo"
            subtitle="¿Hay algo que debas recordar para la próxima semana?"
          >
            <textarea
              value={responses.notes}
              onChange={(e) => setResponses(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ej: Gasto inesperado en dentista... Tengo que reducir salidas..."
              className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </StepContainer>
        );
        
      default:
        return null;
    }
  };
  
  const renderSummary = () => {
    const paid = (responses.paidOnTime === true ? parseFloat(responses.amountPaid) : 0) || 0;
    const achievement = expectedPayment > 0 ? (paid / expectedPayment) * 100 : 0;
    
    return (
      <div className="space-y-6">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-xl shadow-green-500/30 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Check-in Completado</h3>
          <p className="text-gray-400 text-sm">Tu perfil financiero de esta semana</p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
          <div className="flex justify-between items-end mb-2 relative z-10">
            <div>
              <div className="text-4xl font-black text-white">
                {Math.min(100, Math.round(achievement))}%
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Meta Cumplida</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-400">${paid.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Pagado</div>
            </div>
          </div>
          
          <div className="h-3 bg-black/50 rounded-full overflow-hidden relative z-10">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                achievement >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
                achievement >= 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, achievement)}%` }}
            />
          </div>
          
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <SummaryItem
            label="Tarjetas"
            value={responses.usedCreditCards ? 'Uso Detectado' : 'Sin Uso'}
            icon={<AlertTriangle className="w-4 h-4" />}
            positive={!responses.usedCreditCards}
          />
          <SummaryItem
            label="Ánimo"
            value={['😫', '😟', '😐', '🙂', '😁'][responses.mood - 1] || '---'}
            icon={<Sparkles className="w-4 h-4" />}
            positive={responses.mood >= 3}
          />
        </div>
        
        <div className={`p-4 rounded-xl border animate-in slide-in-from-bottom-4 ${
          weeklyStrategy.type === 'acceleration' ? 'bg-emerald-500/10 border-emerald-500/30' :
          weeklyStrategy.type === 'rescue' ? 'bg-purple-500/10 border-purple-500/30' :
          'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              weeklyStrategy.type === 'acceleration' ? 'bg-emerald-500/20 text-emerald-300' :
              weeklyStrategy.type === 'rescue' ? 'bg-purple-500/20 text-purple-300' :
              'bg-blue-500/20 text-blue-300'
            }`}>
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm mb-1">{weeklyStrategy.title}</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                {weeklyStrategy.advice}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const totalSteps = 6;
  const isLastStep = step === totalSteps;
  const isSummary = step > totalSteps;
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full md:max-w-lg h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden relative">
        
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-indigo-900/50 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/30 rounded-xl shadow-inner">
              <Calendar className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Análisis Semanal</h2>
              <p className="text-xs text-gray-400">
                {isSummary ? 'Resumen Estratégico' : `Paso ${step} de ${totalSteps}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!isSummary && (
          <div className="h-1 bg-gray-800 relative z-10">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-6 relative">
          {isSummary ? renderSummary() : renderStep()}
        </div>
        
        <div className="p-4 border-t border-white/10 flex gap-3 bg-gray-900 z-10">
          {!isSummary && step > 1 && (
            <button
              onClick={handlePreviousStep}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition border border-white/5 active:scale-95"
            >
              Atrás
            </button>
          )}
          
          {isSummary ? (
            <button
              onClick={() => {
                // ✅ LÓGICA INLINE DE ENVÍO PARA EVITAR VARIABLES SIN USAR
                const checkInData = {
                  ...responses,
                  amountPaid: (responses.paidOnTime === true ? parseFloat(responses.amountPaid) : 0) || 0,
                  expectedPayment,
                  completedAt: new Date().toISOString(),
                  weekNumber: getWeekNumber(new Date()),
                  planId: plan.id
                };
                onSubmit(checkInData);
                onClose();
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-500 hover:to-emerald-500 transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              Finalizar
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95"
            >
              {isLastStep ? 'Ver Análisis' : 'Siguiente'}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

function StepContainer({ icon, title, subtitle, children }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 ring-1 ring-white/5 shadow-sm">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        <p className="text-gray-400 text-sm font-medium">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function OptionButton({ selected, onClick, icon, label, color, compact }) {
  const colors = {
    green: selected 
      ? 'bg-green-500/20 border-green-400 text-green-300 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-green-500/5 hover:text-green-200',
    red: selected 
      ? 'bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_15px_rgba(248,113,113,0.3)]' 
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-red-500/5 hover:text-red-200',
    yellow: selected 
      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-yellow-500/5 hover:text-yellow-200'
  };
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 group ${colors[color]} ${
        selected ? 'scale-105' : 'active:scale-95'
      } ${compact ? 'p-3' : ''}`}
    >
      {icon}
      <span className={`font-semibold transition-colors ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
    </button>
  );
}

function SummaryItem({ label, value, icon, positive }) {
  return (
    <div className={`p-3 rounded-xl border flex items-center justify-between ${
      positive 
        ? 'bg-green-500/5 border-green-500/20' 
        : 'bg-red-500/5 border-red-500/20'
    }`}>
      <div className="flex items-center gap-2">
        <span className={positive ? 'text-green-400' : 'text-red-400'}>{icon}</span>
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <div className={`text-sm font-bold ${positive ? 'text-green-300' : 'text-red-300'}`}>
        {value}
      </div>
    </div>
  );
}

function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((diff / oneWeek) + start.getDay() / 7);
}