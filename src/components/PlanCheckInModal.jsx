// src/components/PlanCheckInModal.jsx
// ============================================
// MODAL DE CHECK-IN SEMANAL MEJORADO
// Flujo simple con estrategias personalizadas
// ============================================

import React, { useState, useMemo } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, ThumbsUp, ThumbsDown,
  DollarSign, Calendar, Sparkles, Trophy, Target, 
  ChevronRight, Zap, TrendingUp, Meh
} from 'lucide-react';

export default function PlanCheckInModal({ plan, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState({
    paidOnTime: null,
    amountPaid: '',
    usedCreditCards: null,
    followedBudget: null,
    mood: null,
    notes: ''
  });
  
  const config = plan?.configuracion || {};
  const targetDebt = config.plan?.orderedDebts?.[0];
  const expectedPayment = config.monthlyPayment || 0;
  
  const totalSteps = 5;
  const isLastStep = step === totalSteps;
  const isSummary = step > totalSteps;

  // ==========================================
  // HANDLERS
  // ==========================================
  
  const handleSelect = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNext = () => {
    // Si no pagó, saltar paso de monto
    if (step === 1 && responses.paidOnTime === false) {
      setStep(3);
    } else if (isLastStep) {
      setStep(totalSteps + 1);
    } else {
      setStep(s => s + 1);
    }
  };
  
  const handleBack = () => {
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

  const handleSubmit = () => {
    const paid = responses.paidOnTime ? (parseFloat(responses.amountPaid) || 0) : 0;
    const pct = expectedPayment > 0 ? Math.min(100, (paid / expectedPayment) * 100) : 0;
    // Calcular puntos ganados
    let pts = 20; // base por hacer check-in
    if (responses.paidOnTime) pts += 50;
    if (!responses.usedCreditCards) pts += 30;
    if (responses.followedBudget === 'yes') pts += 20;
    if (responses.mood >= 4) pts += 10;
    const data = {
      ...responses,
      amountPaid: paid,
      pctCumplido: pct,
      pointsEarned: pts,
      estrategia: strategy,
      expectedPayment,
      completedAt: new Date().toISOString(),
      planId: plan.id
    };
    onSubmit(data);
    onClose();
  };

  // ==========================================
  // ESTRATEGIA GENERADA POR IA
  // ==========================================
  
  const strategy = useMemo(() => {
    const paid = responses.paidOnTime ? (parseFloat(responses.amountPaid) || 0) : 0;
    const percentage = expectedPayment > 0 ? (paid / expectedPayment) * 100 : 0;
    const mood = responses.mood || 3;
    const usedCards = responses.usedCreditCards;
    

    // Caso crítico: Ánimo bajo + usó tarjetas
    if (mood <= 2 && usedCards) {
      return {
        type: 'rescue',
        title: '🆘 Plan de Rescate',
        advice: 'Esta semana prioriza tu bienestar. Congela físicamente las tarjetas y enfócate solo en lo esencial. No te juzgues.',
        color: 'purple'
      };
    }
    
    // Excelente: Pagó todo + buen ánimo
    if (percentage >= 100 && mood >= 4 && !usedCards) {
      return {
        type: 'accelerate',
        title: '🚀 Modo Aceleración',
        advice: '¡Semana perfecta! Si tienes ingresos extra, considera aplicarlos directamente a la deuda para terminar antes.',
        color: 'emerald'
      };
    }
    
    // Alerta: No cumplió pero tiene buen ánimo
    if (percentage < 50 && mood >= 3) {
      return {
        type: 'adjust',
        title: '🔧 Ajuste de Ruta',
        advice: 'Revisa tus gastos variables. Identifica 2-3 gastos "hormiga" que puedas eliminar esta semana.',
        color: 'orange'
      };
    }

    // Usó tarjetas
    if (usedCards) {
      return {
        type: 'discipline',
        title: '🎯 Disciplina Reforzada',
        advice: 'Aplica la "Regla 24h": antes de comprar algo, espera un día. Si aún lo necesitas, usa débito.',
        color: 'yellow'
      };
    }

    // Default: Mantenimiento
    return {
      type: 'maintain',
      title: '✅ Ritmo Constante',
      advice: 'Vas por buen camino. Mantén el hábito de revisar tus finanzas cada 2 días. La consistencia gana.',
      color: 'blue'
    };
  }, [responses, expectedPayment]);

  // ==========================================
  // RENDER DE PASOS
  // ==========================================
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepLayout
            icon={<DollarSign className="w-8 h-8 text-green-400" />}
            title="¿Hiciste tu pago esta semana?"
            subtitle={`Meta: $${expectedPayment.toLocaleString()} a ${targetDebt?.nombre || 'tu deuda'}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <SelectButton
                selected={responses.paidOnTime === true}
                onClick={() => handleSelect('paidOnTime', true)}
                icon={<ThumbsUp className="w-5 h-5" />}
                label="Sí, pagué"
                color="green"
              />
              <SelectButton
                selected={responses.paidOnTime === false}
                onClick={() => handleSelect('paidOnTime', false)}
                icon={<ThumbsDown className="w-5 h-5" />}
                label="No pude"
                color="red"
              />
            </div>
          </StepLayout>
        );
        
      case 2:
        const amount = parseFloat(responses.amountPaid) || 0;
        const pct = expectedPayment > 0 ? (amount / expectedPayment) * 100 : 0;
        
        return (
          <StepLayout
            icon={<TrendingUp className="w-8 h-8 text-blue-400" />}
            title="¿Cuánto pagaste?"
            subtitle="Incluye capital e intereses"
          >
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                <input
                  type="number"
                  value={responses.amountPaid}
                  onChange={(e) => handleSelect('amountPaid', e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-3 text-xl font-bold text-white text-center focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              {/* Botones rápidos */}
              <div className="flex gap-2 justify-center">
                {[0.5, 1, 1.2].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => handleSelect('amountPaid', (expectedPayment * mult).toString())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      Math.abs(amount - expectedPayment * mult) < 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {mult === 1 ? 'Meta' : mult < 1 ? '50%' : 'Extra'}
                  </button>
                ))}
              </div>
              
              {/* Feedback */}
              {amount > 0 && (
                <div className={`p-3 rounded-lg text-center text-sm ${
                  pct >= 100 ? 'bg-green-500/20 text-green-300' :
                  pct >= 70 ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-orange-500/20 text-orange-300'
                }`}>
                  {pct >= 100 ? '🎉 ¡Sobrepasaste la meta!' :
                   pct >= 70 ? `👍 Pagaste ${pct.toFixed(0)}% de la meta` :
                   `⚠️ ${pct.toFixed(0)}% de la meta`}
                </div>
              )}
            </div>
          </StepLayout>
        );
        
      case 3:
        return (
          <StepLayout
            icon={<AlertTriangle className="w-8 h-8 text-orange-400" />}
            title="¿Usaste tarjetas de crédito?"
            subtitle="Cualquier compra nueva afecta tu progreso"
          >
            <div className="grid grid-cols-2 gap-3">
              <SelectButton
                selected={responses.usedCreditCards === false}
                onClick={() => handleSelect('usedCreditCards', false)}
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="No, me abstuve"
                color="green"
              />
              <SelectButton
                selected={responses.usedCreditCards === true}
                onClick={() => handleSelect('usedCreditCards', true)}
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Sí, las usé"
                color="red"
              />
            </div>
            
            {responses.usedCreditCards === false && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-sm">
                <strong>🔥 ¡Victoria!</strong> Este hábito es el más importante.
              </div>
            )}
            
            {responses.usedCreditCards === true && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                <strong>💡 Tip:</strong> La próxima semana, deja las tarjetas en casa.
              </div>
            )}
          </StepLayout>
        );
        
      case 4:
        return (
          <StepLayout
            icon={<Target className="w-8 h-8 text-purple-400" />}
            title="Control de gastos"
            subtitle="¿Respetaste tu presupuesto de gastos variables?"
          >
            <div className="grid grid-cols-3 gap-2">
              <SelectButton
                selected={responses.followedBudget === 'yes'}
                onClick={() => handleSelect('followedBudget', 'yes')}
                icon={<ThumbsUp className="w-4 h-4" />}
                label="Sí"
                color="green"
                compact
              />
              <SelectButton
                selected={responses.followedBudget === 'mostly'}
                onClick={() => handleSelect('followedBudget', 'mostly')}
                icon={<Meh className="w-4 h-4" />}
                label="Casi"
                color="yellow"
                compact
              />
              <SelectButton
                selected={responses.followedBudget === 'no'}
                onClick={() => handleSelect('followedBudget', 'no')}
                icon={<ThumbsDown className="w-4 h-4" />}
                label="No"
                color="red"
                compact
              />
            </div>
          </StepLayout>
        );
        
      case 5:
        return (
          <StepLayout
            icon={<Sparkles className="w-8 h-8 text-pink-400" />}
            title="¿Cómo te sientes?"
            subtitle="Tu bienestar también importa"
          >
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 5, emoji: '😁' },
                { value: 4, emoji: '🙂' },
                { value: 3, emoji: '😐' },
                { value: 2, emoji: '😟' },
                { value: 1, emoji: '😫' }
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => handleSelect('mood', m.value)}
                  className={`p-3 rounded-xl text-2xl transition-all ${
                    responses.mood === m.value
                      ? 'bg-pink-500/30 border-2 border-pink-400 scale-110'
                      : 'bg-white/10 border border-white/10 hover:bg-white/20'
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </StepLayout>
        );
        
      default:
        return null;
    }
  };

  // ==========================================
  // RENDER DE RESUMEN
  // ==========================================
  
  const renderSummary = () => {
    const paid = responses.paidOnTime ? (parseFloat(responses.amountPaid) || 0) : 0;
    const pct = expectedPayment > 0 ? Math.min(100, (paid / expectedPayment) * 100) : 0;

    // Puntos ganados
    let pts = 20;
    if (responses.paidOnTime) pts += 50;
    if (!responses.usedCreditCards) pts += 30;
    if (responses.followedBudget === 'yes') pts += 20;
    if (responses.mood >= 4) pts += 10;

    // Acción concreta de la próxima semana
    const accionProxima = responses.paidOnTime === false
      ? `Separa $${Math.round(expectedPayment * 0.5).toLocaleString()} esta semana antes de gastar en otra cosa.`
      : responses.usedCreditCards
      ? 'Deja las tarjetas de crédito en casa los próximos 7 días. Solo usa efectivo o débito.'
      : pct < 70
      ? `Busca un gasto que puedas recortar para llegar más cerca de $${expectedPayment.toLocaleString()}/mes.`
      : '¡Sigue así! Paga lo mismo la próxima semana y ve si puedes agregar algo extra.';

    const colorMap = {
      emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300', icon: 'bg-emerald-500/20 text-emerald-300' },
      purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-300',  icon: 'bg-purple-500/20 text-purple-300' },
      orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-300',  icon: 'bg-orange-500/20 text-orange-300' },
      yellow:  { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  text: 'text-yellow-300',  icon: 'bg-yellow-500/20 text-yellow-300' },
      blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-300',    icon: 'bg-blue-500/20 text-blue-300' },
    };
    const clr = colorMap[strategy.color] || colorMap.blue;

    return (
      <div className="space-y-4">
        {/* Header con puntos */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-gray-900">
              +{pts}pts
            </div>
          </div>
          <h3 className="text-xl font-bold text-white">¡Check-in listo!</h3>
          <p className="text-gray-400 text-xs mt-0.5">Ganaste {pts} puntos esta semana</p>
        </div>

        {/* Barra de cumplimiento */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-400">Meta cumplida</span>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xs font-bold">${paid.toLocaleString()}</span>
              <span className="text-gray-600 text-xs">/ ${expectedPayment.toLocaleString()}</span>
            </div>
          </div>
          <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                pct >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                pct >= 70  ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                             'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>
          <p className={`text-xs font-bold mt-1.5 ${pct >= 100 ? 'text-green-400' : pct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {pct >= 100 ? '🎉 ¡Superaste la meta!' : pct >= 70 ? `👍 ${Math.round(pct)}% cumplido` : `⚠️ ${Math.round(pct)}% — sigamos`}
          </p>
        </div>

        {/* 3 badges de resultados */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2.5 rounded-xl border text-center ${responses.paidOnTime ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <span className="text-lg">{responses.paidOnTime ? '✅' : '❌'}</span>
            <p className="text-[9px] text-gray-500 mt-0.5">Pagó</p>
          </div>
          <div className={`p-2.5 rounded-xl border text-center ${!responses.usedCreditCards ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <span className="text-lg">{!responses.usedCreditCards ? '💳✅' : '💳⚠️'}</span>
            <p className="text-[9px] text-gray-500 mt-0.5">Tarjetas</p>
          </div>
          <div className="p-2.5 rounded-xl border bg-white/4 border-white/8 text-center">
            <span className="text-lg">{['😫', '😟', '😐', '🙂', '😁'][(responses.mood || 3) - 1]}</span>
            <p className="text-[9px] text-gray-500 mt-0.5">Ánimo</p>
          </div>
        </div>

        {/* Consejo de la IA */}
        <div className={`p-4 rounded-xl border ${clr.bg} ${clr.border}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${clr.icon}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`font-bold text-sm ${clr.text}`}>{strategy.title}</h4>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">{strategy.advice}</p>
            </div>
          </div>
        </div>

        {/* Acción concreta próxima semana */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3 items-start">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 flex-shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Tu tarea para esta semana</p>
            <p className="text-xs text-white leading-relaxed">{accionProxima}</p>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full md:max-w-md h-[85vh] md:h-auto md:max-h-[85vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/30 rounded-xl">
              <Calendar className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Check-in Semanal</h2>
              <p className="text-[10px] text-gray-400">
                {isSummary ? 'Resumen' : `${step} de ${totalSteps}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress bar */}
        {!isSummary && (
          <div className="h-1 bg-gray-800">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isSummary ? renderSummary() : renderStep()}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          {!isSummary && step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 bg-white/5 text-white py-3 rounded-xl font-semibold hover:bg-white/10 transition"
            >
              Atrás
            </button>
          )}
          
          {isSummary ? (
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-500 hover:to-emerald-500 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Finalizar
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLastStep ? 'Ver Resumen' : 'Siguiente'}
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

function StepLayout({ icon, title, subtitle, children }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-gray-400 text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SelectButton({ selected, onClick, icon, label, color, compact }) {
  const colors = {
    green: selected 
      ? 'bg-green-500/20 border-green-400 text-green-300' 
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-green-500/10',
    red: selected 
      ? 'bg-red-500/20 border-red-400 text-red-300' 
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-red-500/10',
    yellow: selected 
      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' 
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-yellow-500/10'
  };
  
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${colors[color]} ${
        selected ? 'scale-105' : ''
      } ${compact ? 'p-2' : ''}`}
    >
      {icon}
      <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
    </button>
  );
}