import { useState, useEffect, useMemo } from 'react';
import { 
  X, CreditCard, CheckCircle2, Zap, Snowflake, Scale, 
  AlertTriangle, ChevronDown, ArrowRight, Clock
} from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

// ==========================================
// FUNCIONES DE CÁLCULO FINANCIERO (mejoradas)
// ==========================================

function analyzeDebtSituation(deudas, kpis = {}) {
  const cleanDebts = deudas.map(d => normalizeDebt(d)).filter(d => d.balance > 0);
  
  if (cleanDebts.length === 0) return null;
  
  const totalDebt = cleanDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayments = cleanDebts.reduce((sum, d) => sum + d.pagoMinimo, 0);
  const avgInterest = cleanDebts.reduce((sum, d) => sum + d.interes, 0) / cleanDebts.length;
  const maxInterest = Math.max(...cleanDebts.map(d => d.interes));
  const minBalance = Math.min(...cleanDebts.map(d => d.balance));
  
  // Calcular interés mensual total
  const monthlyInterestCost = cleanDebts.reduce((sum, d) => {
    return sum + (d.balance * (d.interes / 100) / 12);
  }, 0);
  
  // Identificar deudas problemáticas
  const highInterestDebts = cleanDebts.filter(d => d.interes > 20);
  const interestConcentration = highInterestDebts.length > 0 
    ? (highInterestDebts.reduce((sum, d) => sum + (d.balance * d.interes / 100 / 12), 0) / monthlyInterestCost) * 100
    : 0;
  
  // Disponible para deudas
  const disponible = Math.max(0, (kpis.saldo || 0) + ((kpis.totalIngresos || 0) - (kpis.totalGastos || 0)));
  const capacidadPago = disponible * 0.5;
  
  // Determinar nivel de crisis
  let crisisLevel = 'stable';
  let crisisMessage = '';
  
  if (totalMinPayments > disponible) {
    crisisLevel = 'critical';
    crisisMessage = 'Tus pagos mínimos superan tu disponible. Situación de emergencia.';
  } else if (totalDebt > (kpis.totalIngresos || 1) * 12) {
    crisisLevel = 'high';
    crisisMessage = 'Tu deuda supera un año de ingresos. Requiere acción inmediata.';
  } else if (avgInterest > 25) {
    crisisLevel = 'warning';
    crisisMessage = 'Tus tasas de interés son muy altas. Estás perdiendo dinero cada mes.';
  } else {
    crisisLevel = 'manageable';
    crisisMessage = 'Tu situación es manejable con disciplina.';
  }
  
  return {
    cleanDebts,
    totalDebt,
    totalMinPayments,
    avgInterest,
    maxInterest,
    minBalance,
    monthlyInterestCost,
    highInterestDebts,
    interestConcentration,
    disponible,
    capacidadPago,
    crisisLevel,
    crisisMessage,
    debtCount: cleanDebts.length
  };
}

function determineOptimalStrategy(analysis) {
  if (!analysis) return { strategy: 'avalancha', confidence: 0, reason: '' };
  
  const { highInterestDebts, cleanDebts, avgInterest, minBalance, totalDebt } = analysis;
  
  // Lógica de decisión autoritativa
  let strategy = 'avalancha';
  let confidence = 85;
  let reason = '';
  let alternativeReason = '';
  
  // Si hay deudas con interés muy alto (>25%), definitivamente Avalancha
  if (highInterestDebts.length > 0 && avgInterest > 20) {
    strategy = 'avalancha';
    confidence = 95;
    reason = `Tienes ${highInterestDebts.length} deuda(s) con interés superior al 20%. Matemáticamente, atacar el interés primero te ahorra más dinero.`;
    alternativeReason = 'Bola de Nieve te daría victorias rápidas pero pagarías más intereses a largo plazo.';
  }
  // Si la deuda más pequeña es menos del 10% del total, Bola de Nieve tiene sentido psicológico
  else if (minBalance < totalDebt * 0.10 && cleanDebts.length >= 3) {
    strategy = 'bola_nieve';
    confidence = 80;
    reason = `Tu deuda más pequeña ($${minBalance.toLocaleString()}) se puede eliminar rápido. Las victorias tempranas mantienen la motivación.`;
    alternativeReason = 'Avalancha ahorraría algo de interés pero tardarías más en ver progreso tangible.';
  }
  // Si los intereses son similares (diferencia < 5%), Bola de Nieve
  else if (Math.max(...cleanDebts.map(d => d.interes)) - Math.min(...cleanDebts.map(d => d.interes)) < 5) {
    strategy = 'bola_nieve';
    confidence = 75;
    reason = 'Tus tasas de interés son similares. En este caso, la motivación psicológica de victorias rápidas es más valiosa.';
    alternativeReason = 'Avalancha tendría un impacto marginal en este escenario.';
  }
  // Default: Avalancha (matemáticamente óptimo)
  else {
    strategy = 'avalancha';
    confidence = 85;
    reason = 'Atacar las tasas más altas primero minimiza el dinero que regalas al banco en intereses.';
    alternativeReason = 'Bola de Nieve es válida si necesitas motivación extra, pero pagarás más a largo plazo.';
  }
  
  return { strategy, confidence, reason, alternativeReason };
}

function generateStructuredPlan(analysis, strategy, customPayment = null) {
  if (!analysis) return null;
  
  const { cleanDebts, capacidadPago, totalMinPayments, disponible } = analysis;
  
  // Ordenar deudas según estrategia
  const orderedDebts = orderDebtsByStrategy([...cleanDebts], strategy);
  
  // Calcular pago mensual
  const minRequired = totalMinPayments;
  const recommended = Math.max(minRequired, capacidadPago);
  const aggressive = Math.max(minRequired, disponible * 0.7);
  
  const monthlyPayment = customPayment || recommended;
  
  // Simular plan
  const simulation = simulateFullPlan(orderedDebts, monthlyPayment);
  
  // Generar pasos estructurados
  const steps = generateActionSteps(orderedDebts, analysis, monthlyPayment);
  
  return {
    orderedDebts,
    monthlyPayment: Math.round(monthlyPayment),
    minRequired: Math.round(minRequired),
    recommended: Math.round(recommended),
    aggressive: Math.round(aggressive),
    simulation,
    steps,
    timeline: simulation.schedule
  };
}

function simulateFullPlan(orderedDebts, monthlyPayment) {
  const schedule = [];
  let month = 0;
  let totalInterest = 0;
  let remainingDebts = orderedDebts.map(d => ({ ...d }));
  
  while (remainingDebts.length > 0 && month < 360) {
    month++;
    let availableThisMonth = monthlyPayment;
    
    // Aplicar intereses
    for (const debt of remainingDebts) {
      const monthlyInterest = (debt.balance * (debt.interes / 100)) / 12;
      debt.balance += monthlyInterest;
      totalInterest += monthlyInterest;
    }
    
    // Pagar deudas
    for (let i = 0; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      const payment = i === 0 
        ? Math.min(debt.balance, availableThisMonth)
        : Math.min(debt.pagoMinimo, availableThisMonth, debt.balance);
      
      debt.balance -= payment;
      availableThisMonth -= payment;
      
      if (debt.balance <= 0.01) {
        schedule.push({
          month,
          debtId: debt.id,
          debtName: debt.nombre,
          originalBalance: debt.originalBalance || debt.balance,
          paidOff: true
        });
      }
      
      if (availableThisMonth <= 0) break;
    }
    
    remainingDebts = remainingDebts.filter(d => d.balance > 0.01);
  }
  
  return {
    months: month,
    totalInterest: Math.round(totalInterest),
    schedule,
    freedomDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000)
  };
}

function generateActionSteps(orderedDebts, analysis, monthlyPayment) {
  const steps = [];
  
  // PASO 1: CONTENCIÓN
  steps.push({
    phase: 'contention',
    title: '🔒 Contención',
    subtitle: 'Detener el sangrado',
    description: 'Antes de atacar, hay que dejar de empeorar la situación.',
    actions: [
      {
        id: 'freeze_cards',
        text: 'Congela el uso de tarjetas con deuda',
        detail: 'No uses tarjetas que tengan saldo. Cada compra nueva aumenta tu deuda.',
        critical: analysis.crisisLevel === 'critical'
      },
      {
        id: 'min_payments',
        text: 'Asegura todos los pagos mínimos',
        detail: `Total de mínimos: $${analysis.totalMinPayments.toLocaleString()}/mes`,
        critical: true
      },
      {
        id: 'emergency_fund',
        text: 'Mantén $500-1000 de emergencia',
        detail: 'Sin colchón, cualquier imprevisto te regresa a la deuda.',
        critical: false
      }
    ],
    status: 'pending'
  });
  
  // PASO 2: ATAQUE PRIMARIO
  const targetDebt = orderedDebts[0];
  steps.push({
    phase: 'attack',
    title: '🎯 Ataque Principal',
    subtitle: `Objetivo: ${targetDebt.nombre}`,
    description: 'Esta es la deuda que debes eliminar primero. Todo el dinero extra va aquí.',
    targetDebt: {
      ...targetDebt,
      extraPayment: Math.round(monthlyPayment - analysis.totalMinPayments),
      estimatedMonths: Math.ceil(targetDebt.balance / (monthlyPayment - analysis.totalMinPayments + targetDebt.pagoMinimo))
    },
    actions: [
      {
        id: 'extra_payment',
        text: `Paga $${Math.round(monthlyPayment - analysis.totalMinPayments + targetDebt.pagoMinimo).toLocaleString()} a ${targetDebt.nombre}`,
        detail: `Mínimo ($${targetDebt.pagoMinimo}) + Extra ($${Math.round(monthlyPayment - analysis.totalMinPayments).toLocaleString()})`,
        critical: true
      }
    ],
    status: 'pending'
  });
  
  // PASO 3: DEFENSA
  const otherDebts = orderedDebts.slice(1);
  if (otherDebts.length > 0) {
    steps.push({
      phase: 'defense',
      title: '🛡️ Defensa',
      subtitle: 'Mantener las otras deudas estables',
      description: 'Mientras atacas la primera, las demás solo reciben el pago mínimo.',
      actions: otherDebts.map(debt => ({
        id: `min_${debt.id}`,
        text: `${debt.nombre}: Pago mínimo $${debt.pagoMinimo.toLocaleString()}`,
        detail: `Saldo: $${debt.balance.toLocaleString()} | Interés: ${debt.interes}%`,
        critical: false
      })),
      status: 'pending'
    });
  }
  
  // PASO 4: LIBERACIÓN (efecto cascada)
  steps.push({
    phase: 'liberation',
    title: '🚀 Liberación',
    subtitle: 'El efecto bola de nieve',
    description: 'Cuando elimines la primera deuda, ese dinero se redirige automáticamente a la siguiente.',
    cascade: orderedDebts.map((debt, idx) => ({
      order: idx + 1,
      name: debt.nombre,
      balance: debt.balance
    })),
    status: 'future'
  });
  
  return steps;
}

function calculatePaymentImpact(analysis, currentPayment, newPayment) {
  if (!analysis) return null;
  
  const currentPlan = simulateFullPlan([...analysis.cleanDebts], currentPayment);
  const newPlan = simulateFullPlan([...analysis.cleanDebts], newPayment);
  
  const monthsDiff = currentPlan.months - newPlan.months;
  const interestDiff = currentPlan.totalInterest - newPlan.totalInterest;
  
  let warningLevel = 'safe';
  let warningMessage = '';
  
  if (newPayment < analysis.totalMinPayments) {
    warningLevel = 'danger';
    warningMessage = '⛔ Este monto no cubre los pagos mínimos. Acumularás más deuda.';
  } else if (newPayment < analysis.totalMinPayments * 1.1) {
    warningLevel = 'critical';
    warningMessage = '🚨 Solo pagas mínimos. La deuda tardará décadas en desaparecer.';
  } else if (newPayment < analysis.capacidadPago * 0.5) {
    warningLevel = 'warning';
    warningMessage = `⚠️ Pago bajo. Esto alarga el plan ${Math.abs(monthsDiff)} meses y cuesta $${Math.abs(interestDiff).toLocaleString()} extra en intereses.`;
  } else {
    warningLevel = 'safe';
    warningMessage = '✅ Pago dentro del rango saludable.';
  }
  
  return {
    currentMonths: currentPlan.months,
    newMonths: newPlan.months,
    monthsDiff,
    currentInterest: currentPlan.totalInterest,
    newInterest: newPlan.totalInterest,
    interestDiff,
    warningLevel,
    warningMessage
  };
}

function normalizeDebt(deuda) {
  const balance = Number(deuda.balance || deuda.monto || deuda.amount || deuda.saldo || 0);
  const interes = Number(deuda.interes || deuda.interest || deuda.tasa || deuda.rate || deuda.apr * 100 || 0);
  const pagoMinimo = Number(deuda.pagoMinimo || deuda.pago_minimo || deuda.pago_min || deuda.minPayment || Math.max(25, balance * 0.03));
  const nombre = deuda.nombre || deuda.cuenta || deuda.name || deuda.descripcion || 'Deuda sin nombre';
  
  return { ...deuda, balance, interes, pagoMinimo, nombre, originalBalance: balance };
}

function orderDebtsByStrategy(cleanDebts, strategy) {
  const debtsCopy = [...cleanDebts];
  
  if (strategy === 'avalancha') {
    return debtsCopy.sort((a, b) => b.interes - a.interes);
  } else if (strategy === 'bola_nieve') {
    return debtsCopy.sort((a, b) => a.balance - b.balance);
  } else {
    // Balanceada
    const avgInterest = debtsCopy.reduce((sum, d) => sum + d.interes, 0) / debtsCopy.length;
    const avgBalance = debtsCopy.reduce((sum, d) => sum + d.balance, 0) / debtsCopy.length;
    
    return debtsCopy.sort((a, b) => {
      const scoreA = (a.interes / avgInterest) + (1 - a.balance / avgBalance);
      const scoreB = (b.interes / avgInterest) + (1 - b.balance / avgBalance);
      return scoreB - scoreA;
    });
  }
}

function getStrategyInfo(strategy) {
  const strategies = {
    avalancha: {
      name: 'Avalancha',
      description: 'Ataca primero las deudas con mayor tasa de interés.',
      benefit: 'Minimiza el dinero total que pagas en intereses.',
      icon: Zap,
      emoji: '🏔️',
      color: 'from-orange-500 to-red-600'
    },
    bola_nieve: {
      name: 'Bola de Nieve',
      description: 'Elimina primero las deudas más pequeñas.',
      benefit: 'Genera victorias rápidas que mantienen tu motivación.',
      icon: Snowflake,
      emoji: '⛄',
      color: 'from-blue-500 to-cyan-600'
    },
    balanceada: {
      name: 'Balanceada',
      description: 'Combina interés alto y saldo bajo.',
      benefit: 'Un punto medio entre ahorro e impacto psicológico.',
      icon: Scale,
      emoji: '⚖️',
      color: 'from-purple-500 to-indigo-600'
    }
  };
  
  return strategies[strategy] || strategies.avalancha;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function DebtPlannerModal({ deudas = [], kpis = {}, onClose, onPlanGuardado }) {
  const [phase, setPhase] = useState(1); // 1-6 fases
  const [analysis, setAnalysis] = useState(null);
  const [optimalStrategy, setOptimalStrategy] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [customPayment, setCustomPayment] = useState(null);
  const [plan, setPlan] = useState(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [hasOverridden, setHasOverridden] = useState(false);
  
  const { addPlan } = usePlanesGuardados();

  // Analizar deudas al montar
  useEffect(() => {
    if (deudas && deudas.length > 0) {
      const situationAnalysis = analyzeDebtSituation(deudas, kpis);
      setAnalysis(situationAnalysis);
      
      if (situationAnalysis) {
        const optimal = determineOptimalStrategy(situationAnalysis);
        setOptimalStrategy(optimal);
        setSelectedStrategy(optimal.strategy);
        setCustomPayment(situationAnalysis.capacidadPago);
      }
    }
  }, [deudas, kpis]);

  // Generar plan cuando cambia estrategia o pago
  useEffect(() => {
    if (analysis && selectedStrategy) {
      const newPlan = generateStructuredPlan(analysis, selectedStrategy, customPayment);
      setPlan(newPlan);
    }
  }, [analysis, selectedStrategy, customPayment]);

  // Calcular impacto del ajuste de pago
  const paymentImpact = useMemo(() => {
    if (!analysis || !plan) return null;
    return calculatePaymentImpact(analysis, plan.recommended, customPayment);
  }, [analysis, plan, customPayment]);

  // Sin deudas
  if (!deudas || deudas.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">¡Sin deudas!</h3>
            <p className="text-gray-400 mb-4">No tienes deudas registradas. ¡Excelente!</p>
            <button onClick={onClose} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSavePlan = async (nombre) => {
    try {
      await addPlan({
        tipo: 'deudas',
        nombre: nombre,
        descripcion: `Plan ${getStrategyInfo(selectedStrategy).name}: Libertad en ${plan.simulation.months} meses`,
        configuracion: {
          strategy: selectedStrategy,
          monthlyPayment: customPayment,
          plan: plan,
          analysis: analysis
        },
        meta_principal: `Eliminar $${analysis.totalDebt.toLocaleString()} en deudas`,
        monto_objetivo: analysis.totalDebt,
        monto_actual: 0,
        progreso: 0,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_objetivo: plan.simulation.freedomDate.toISOString().split('T')[0],
        meses_duracion: plan.simulation.months,
        activo: true,
        completado: false
      });

      setShowConfirmacion(false);
      if (onPlanGuardado) onPlanGuardado();
      onClose();
    } catch (error) {
      console.error('Error guardando plan:', error);
      alert('Error al guardar el plan: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 w-full md:max-w-4xl md:h-auto md:max-h-[90vh] h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden">
        
        {/* Header Dinámico */}
        <Header phase={phase} analysis={analysis} onClose={onClose} />
        
        {/* Progress Bar */}
        <ProgressBar phase={phase} />
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {phase === 1 && analysis && (
            <Phase1Confrontation 
              analysis={analysis} 
              onNext={() => setPhase(2)} 
            />
          )}
          
          {phase === 2 && (
            <Phase2Education 
              onNext={() => setPhase(3)} 
              onBack={() => setPhase(1)}
            />
          )}
          
          {phase === 3 && optimalStrategy && (
            <Phase3Strategy 
              optimalStrategy={optimalStrategy}
              selectedStrategy={selectedStrategy}
              onSelectStrategy={(s) => {
                setSelectedStrategy(s);
                if (s !== optimalStrategy.strategy) setHasOverridden(true);
              }}
              hasOverridden={hasOverridden}
              onNext={() => setPhase(4)}
              onBack={() => setPhase(2)}
            />
          )}
          
          {phase === 4 && plan && (
            <Phase4Plan 
              plan={plan}
              analysis={analysis}
              strategy={selectedStrategy}
              onNext={() => setPhase(5)}
              onBack={() => setPhase(3)}
            />
          )}
          
          {phase === 5 && plan && (
            <Phase5Adjustment
              plan={plan}
              analysis={analysis}
              customPayment={customPayment}
              setCustomPayment={setCustomPayment}
              paymentImpact={paymentImpact}
              onNext={() => setPhase(6)}
              onBack={() => setPhase(4)}
            />
          )}
          
          {phase === 6 && plan && (
            <Phase6Commitment
              plan={plan}
              analysis={analysis}
              strategy={selectedStrategy}
              onSave={() => setShowConfirmacion(true)}
              onBack={() => setPhase(5)}
            />
          )}
        </div>
      </div>

      {/* Modal Confirmación */}
      {showConfirmacion && (
        <ConfirmModal
          plan={plan}
          strategy={selectedStrategy}
          onConfirmar={handleSavePlan}
          onCancelar={() => setShowConfirmacion(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTES DE CADA FASE
// ==========================================

function Header({ phase, analysis, onClose }) {
  const titles = {
    1: { title: 'La Verdad', subtitle: 'Tu situación actual' },
    2: { title: 'Educación', subtitle: 'Cómo funcionan las deudas' },
    3: { title: 'Tu Estrategia', subtitle: 'El sistema ha decidido' },
    4: { title: 'Tu Plan', subtitle: 'Paso a paso hacia la libertad' },
    5: { title: 'Ajustes', subtitle: 'Personaliza tu compromiso' },
    6: { title: 'Compromiso', subtitle: 'Sella tu plan' }
  };
  
  const { title, subtitle } = titles[phase] || titles[1];
  
  const bgColors = {
    1: 'from-red-900/80 to-rose-900/80',
    2: 'from-blue-900/80 to-indigo-900/80',
    3: 'from-purple-900/80 to-violet-900/80',
    4: 'from-emerald-900/80 to-teal-900/80',
    5: 'from-amber-900/80 to-orange-900/80',
    6: 'from-green-900/80 to-emerald-900/80'
  };

  return (
    <div className={`bg-gradient-to-r ${bgColors[phase]} backdrop-blur-md p-4 md:p-6 border-b border-white/10 flex items-center justify-between shrink-0`}>
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-lg border border-white/20">
          <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <p className="text-white/70 text-xs md:text-sm">{subtitle}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

function ProgressBar({ phase }) {
  const phases = [
    { num: 1, label: 'Verdad' },
    { num: 2, label: 'Educación' },
    { num: 3, label: 'Estrategia' },
    { num: 4, label: 'Plan' },
    { num: 5, label: 'Ajuste' },
    { num: 6, label: 'Compromiso' }
  ];
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-white/5 overflow-x-auto">
      {phases.map((p, idx) => (
        <div key={p.num} className="flex items-center">
          <div className={`flex flex-col items-center ${idx > 0 ? 'ml-2' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              phase === p.num 
                ? 'bg-white text-gray-900 scale-110' 
                : phase > p.num 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-400'
            }`}>
              {phase > p.num ? '✓' : p.num}
            </div>
            <span className={`text-[10px] mt-1 hidden md:block ${phase === p.num ? 'text-white font-bold' : 'text-gray-500'}`}>
              {p.label}
            </span>
          </div>
          {idx < phases.length - 1 && (
            <div className={`w-6 md:w-12 h-0.5 mx-1 ${phase > p.num ? 'bg-green-500' : 'bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// FASE 1: CONFRONTACIÓN
function Phase1Confrontation({ analysis, onNext }) {
  const { 
    totalDebt, monthlyInterestCost, interestConcentration, 
    highInterestDebts, crisisLevel, crisisMessage, debtCount 
  } = analysis;

  const crisisColors = {
    critical: 'from-red-500 to-rose-600',
    high: 'from-orange-500 to-red-500',
    warning: 'from-yellow-500 to-orange-500',
    manageable: 'from-blue-500 to-indigo-500',
    stable: 'from-green-500 to-emerald-500'
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      {/* Mensaje Principal de Confrontación */}
      <div className={`bg-gradient-to-r ${crisisColors[crisisLevel]} rounded-2xl p-6 text-center`}>
        <div className="text-5xl mb-4">
          {crisisLevel === 'critical' ? '🚨' : crisisLevel === 'high' ? '⚠️' : crisisLevel === 'warning' ? '📊' : '💪'}
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
          {crisisLevel === 'critical' || crisisLevel === 'high' 
            ? 'Necesitas actuar ahora.' 
            : 'Tu situación es manejable.'}
        </h3>
        <p className="text-white/90 text-sm md:text-base">
          {crisisMessage}
        </p>
      </div>

      {/* Estadísticas Impactantes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <div className="text-3xl md:text-4xl font-black text-red-400">
            ${totalDebt.toLocaleString()}
          </div>
          <div className="text-xs text-red-300 mt-1">Deuda Total</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
          <div className="text-3xl md:text-4xl font-black text-orange-400">
            ${Math.round(monthlyInterestCost).toLocaleString()}
          </div>
          <div className="text-xs text-orange-300 mt-1">Pierdes al mes en intereses</div>
        </div>
      </div>

      {/* Insights Específicos */}
      <div className="space-y-3">
        <h4 className="text-white font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Lo que tus números revelan:
        </h4>
        
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💳</div>
            <div>
              <div className="text-white font-semibold">Tienes {debtCount} deudas activas</div>
              <div className="text-gray-400 text-sm">
                {debtCount > 3 
                  ? 'Múltiples deudas = múltiples frentes de batalla. Hay que priorizar.' 
                  : 'Pocas deudas = más fácil de manejar con la estrategia correcta.'}
              </div>
            </div>
          </div>
        </div>

        {highInterestDebts.length > 0 && (
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="text-white font-semibold">
                  {highInterestDebts.length} deuda(s) con interés tóxico (+20%)
                </div>
                <div className="text-red-300 text-sm">
                  Estas deudas generan el {interestConcentration.toFixed(0)}% de tus intereses mensuales.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📅</div>
            <div>
              <div className="text-white font-semibold">
                En 1 año sin cambios, habrás pagado ~${Math.round(monthlyInterestCost * 12).toLocaleString()} solo en intereses
              </div>
              <div className="text-purple-300 text-sm">
                Ese dinero podría ser tuyo. Vamos a recuperarlo.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-gradient-to-r from-white to-gray-200 text-gray-900 py-4 rounded-xl font-bold text-lg hover:from-gray-100 hover:to-white transition-all flex items-center justify-center gap-3 shadow-lg"
      >
        Entiendo. Muéstrame cómo salir.
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// FASE 2: EDUCACIÓN
function Phase2Education({ onNext, onBack }) {
  const [activeCard, setActiveCard] = useState(null);

  const concepts = [
    {
      id: 'interest',
      emoji: '💸',
      title: 'Por qué el interés manda',
      content: 'No todas las deudas son iguales. Una deuda de $1,000 al 30% te cuesta $300/año. La misma deuda al 15% te cuesta $150. El interés decide cuál te roba más.',
      takeaway: 'Atacar el interés alto primero = menos dinero regalado al banco.'
    },
    {
      id: 'methods',
      emoji: '⚔️',
      title: 'Avalancha vs Bola de Nieve',
      content: 'Avalancha: Pagas primero la deuda con mayor interés. Matemáticamente óptimo.\n\nBola de Nieve: Pagas primero la deuda más pequeña. Psicológicamente poderoso.',
      takeaway: 'Ambos funcionan. La mejor es la que puedas mantener.'
    },
    {
      id: 'mistake',
      emoji: '❌',
      title: 'El error más común',
      content: 'Pagar todas las deudas "un poquito extra" se siente bien pero es ineficiente. El dinero extra debe concentrarse en UNA sola deuda mientras las demás reciben el mínimo.',
      takeaway: 'Enfoque láser > dispersión.'
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          90 segundos que cambiarán tu perspectiva
        </h3>
        <p className="text-gray-400 text-sm">
          Toca cada tarjeta para entender la mecánica de las deudas
        </p>
      </div>

      <div className="space-y-3">
        {concepts.map((concept) => (
          <div 
            key={concept.id}
            className={`bg-white/5 border rounded-xl overflow-hidden transition-all cursor-pointer ${
              activeCard === concept.id ? 'border-purple-500' : 'border-white/10 hover:border-white/30'
            }`}
            onClick={() => setActiveCard(activeCard === concept.id ? null : concept.id)}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{concept.emoji}</span>
                <span className="text-white font-semibold">{concept.title}</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${activeCard === concept.id ? 'rotate-180' : ''}`} />
            </div>
            
            {activeCard === concept.id && (
              <div className="px-4 pb-4 pt-0 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                <p className="text-gray-300 text-sm whitespace-pre-line mb-3">
                  {concept.content}
                </p>
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                  <div className="text-purple-300 text-xs font-bold uppercase mb-1">Conclusión:</div>
                  <div className="text-white text-sm font-medium">{concept.takeaway}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navegación */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-purple-500 hover:to-indigo-500 transition flex items-center justify-center gap-2"
        >
          Ver mi estrategia
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// FASE 3: ESTRATEGIA (AUTORITATIVA)
function Phase3Strategy({ optimalStrategy, selectedStrategy, onSelectStrategy, hasOverridden, onNext, onBack }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  const optimal = getStrategyInfo(optimalStrategy.strategy);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      {/* Recomendación Principal */}
      <div className={`bg-gradient-to-br ${optimal.color} rounded-2xl p-6 text-center relative overflow-hidden`}>
        <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full text-xs font-bold text-white">
          {optimalStrategy.confidence}% confianza
        </div>
        
        <div className="text-5xl mb-4">{optimal.emoji}</div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
          Tu estrategia: {optimal.name}
        </h3>
        <p className="text-white/90 text-sm md:text-base mb-4">
          {optimalStrategy.reason}
        </p>
        
        <div className="bg-white/20 rounded-xl p-3 text-left">
          <div className="text-white/80 text-xs uppercase font-bold mb-1">Beneficio Principal:</div>
          <div className="text-white font-semibold">{optimal.benefit}</div>
        </div>
      </div>

      {/* Advertencia si cambió */}
      {hasOverridden && selectedStrategy !== optimalStrategy.strategy && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-yellow-300 font-semibold">Has cambiado la recomendación</div>
            <div className="text-yellow-200/70 text-sm">{optimalStrategy.alternativeReason}</div>
          </div>
        </div>
      )}

      {/* Botón para ver alternativas */}
      <button
        onClick={() => setShowAlternatives(!showAlternatives)}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-gray-300 text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition"
      >
        {showAlternatives ? 'Ocultar' : 'Ver'} otras estrategias
        <ChevronDown className={`w-4 h-4 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
      </button>

      {/* Alternativas */}
      {showAlternatives && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2">
          {['avalancha', 'bola_nieve', 'balanceada'].map(strat => {
            const info = getStrategyInfo(strat);
            const Icon = info.icon;
            const isSelected = selectedStrategy === strat;
            const isOptimal = optimalStrategy.strategy === strat;
            
            return (
              <button
                key={strat}
                onClick={() => onSelectStrategy(strat)}
                className={`p-4 rounded-xl text-left transition-all border-2 ${
                  isSelected 
                    ? 'bg-white/10 border-white/50 ring-2 ring-white/20' 
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  {isOptimal && (
                    <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                      Recomendada
                    </span>
                  )}
                </div>
                <div className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{info.name}</div>
                <div className="text-gray-500 text-xs mt-1">{info.description}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 transition flex items-center justify-center gap-2"
        >
          Ver mi plan
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// FASE 4: PLAN ESTRUCTURADO
function Phase4Plan({ plan, analysis, strategy, onNext, onBack }) {
  const [expandedStep, setExpandedStep] = useState('attack');
  
  if (!plan) return null;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-in fade-in">
      {/* Resumen Rápido */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xl md:text-2xl font-bold text-white">{plan.simulation.months}</div>
          <div className="text-[10px] text-gray-400">meses</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xl md:text-2xl font-bold text-green-400">${plan.monthlyPayment.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">pago/mes</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xl md:text-2xl font-bold text-orange-400">${plan.simulation.totalInterest.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">intereses</div>
        </div>
      </div>

      {/* Pasos del Plan */}
      <div className="space-y-3">
        {plan.steps.map((step) => {
          const isExpanded = expandedStep === step.phase;
          const phaseColors = {
            contention: 'border-red-500/30 bg-red-500/5',
            attack: 'border-orange-500/30 bg-orange-500/5',
            defense: 'border-blue-500/30 bg-blue-500/5',
            liberation: 'border-green-500/30 bg-green-500/5'
          };
          
          return (
            <div 
              key={step.phase}
              className={`rounded-xl border overflow-hidden transition-all ${phaseColors[step.phase]}`}
            >
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.phase)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div>
                  <div className="text-white font-bold text-sm md:text-base">{step.title}</div>
                  <div className="text-gray-400 text-xs">{step.subtitle}</div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-gray-300 text-sm">{step.description}</p>
                  
                  {step.actions && (
                    <div className="space-y-2">
                      {step.actions.map((action, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            action.critical 
                              ? 'bg-red-500/10 border-red-500/30' 
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {action.critical && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                            <div>
                              <div className="text-white text-sm font-medium">{action.text}</div>
                              {action.detail && (
                                <div className="text-gray-400 text-xs mt-1">{action.detail}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {step.targetDebt && (
                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">{step.targetDebt.nombre}</span>
                        <span className="text-orange-300 font-bold">${step.targetDebt.balance.toLocaleString()}</span>
                      </div>
                      <div className="text-gray-300 text-xs">
                        Interés: {step.targetDebt.interes}% • Pago sugerido: ${(step.targetDebt.extraPayment + step.targetDebt.pagoMinimo).toLocaleString()}/mes
                      </div>
                      <div className="text-green-400 text-xs mt-1">
                        Estimado: eliminada en ~{step.targetDebt.estimatedMonths} meses
                      </div>
                    </div>
                  )}
                  
                  {step.cascade && (
                    <div className="space-y-2">
                      {step.cascade.map((debt, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {debt.order}
                          </div>
                          <span className="text-white">{debt.name}</span>
                          <span className="text-gray-500 ml-auto">${debt.balance.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline Visual */}
      {plan.timeline && plan.timeline.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Timeline de Libertad
          </h4>
          <div className="space-y-2">
            {plan.timeline.map((milestone, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="w-16 text-gray-500">Mes {milestone.month}</div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="text-green-400">✓ {milestone.debtName} liquidada</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-bold hover:from-amber-500 hover:to-orange-500 transition flex items-center justify-center gap-2"
        >
          Ajustar mi pago
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// FASE 5: AJUSTE CON FRICCIÓN
function Phase5Adjustment({ plan, analysis, customPayment, setCustomPayment, paymentImpact, onNext, onBack }) {
  const [showSlider, setShowSlider] = useState(false);
  
  if (!plan || !analysis) return null;

  const handlePaymentChange = (value) => {
    setCustomPayment(Number(value));
  };

  const warningColors = {
    safe: 'bg-green-500/10 border-green-500/30 text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    critical: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    danger: 'bg-red-500/10 border-red-500/30 text-red-300'
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2">¿Cuánto puedes pagar al mes?</h3>
        <p className="text-gray-400 text-sm">
          El sistema recomienda <span className="text-green-400 font-bold">${plan.recommended.toLocaleString()}</span>.
          Puedes ajustarlo, pero verás las consecuencias.
        </p>
      </div>

      {/* Pago Recomendado (Destacado) */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-green-300 text-xs uppercase font-bold">Pago Recomendado</div>
            <div className="text-3xl font-black text-white">${plan.recommended.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">Libre en</div>
            <div className="text-white font-bold">{plan.simulation.months} meses</div>
          </div>
        </div>
        
        {!showSlider && customPayment === plan.recommended && (
          <button
            onClick={() => setShowSlider(true)}
            className="w-full bg-white/10 text-white py-2 rounded-lg text-sm hover:bg-white/20 transition"
          >
            Quiero ajustar el monto →
          </button>
        )}
      </div>

      {/* Slider de Ajuste */}
      {(showSlider || customPayment !== plan.recommended) && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Tu pago personalizado:</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">${customPayment?.toLocaleString()}</span>
              <span className="text-gray-500">/mes</span>
            </div>
          </div>
          
          {/* Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={Math.max(plan.minRequired * 0.8, 50)}
              max={plan.aggressive * 1.2}
              step={10}
              value={customPayment}
              onChange={(e) => handlePaymentChange(e.target.value)}
              className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Mínimo: ${plan.minRequired.toLocaleString()}</span>
              <span>Agresivo: ${plan.aggressive.toLocaleString()}</span>
            </div>
          </div>

          {/* Impacto en Tiempo Real */}
          {paymentImpact && (
            <div className={`rounded-xl p-4 border ${warningColors[paymentImpact.warningLevel]}`}>
              <div className="font-semibold mb-2">{paymentImpact.warningMessage}</div>
              
              {paymentImpact.warningLevel !== 'safe' && (
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-gray-400 text-xs">Tiempo extra</div>
                    <div className="text-white font-bold">
                      {paymentImpact.monthsDiff > 0 ? '+' : ''}{paymentImpact.monthsDiff} meses
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-gray-400 text-xs">Intereses extra</div>
                    <div className="text-white font-bold">
                      {paymentImpact.interestDiff > 0 ? '+' : ''}${Math.abs(paymentImpact.interestDiff).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botón para volver al recomendado */}
          {customPayment !== plan.recommended && (
            <button
              onClick={() => setCustomPayment(plan.recommended)}
              className="w-full bg-green-500/20 text-green-300 py-2 rounded-lg text-sm hover:bg-green-500/30 transition border border-green-500/30"
            >
              ↩ Volver al recomendado (${plan.recommended.toLocaleString()})
            </button>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={customPayment < plan.minRequired}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirmar plan
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// FASE 6: COMPROMISO
function Phase6Commitment({ plan, analysis, strategy, onSave, onBack }) {
  const [accepted, setAccepted] = useState(false);
  const strategyInfo = getStrategyInfo(strategy);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      {/* Resumen Final */}
      <div className={`bg-gradient-to-br ${strategyInfo.color} rounded-2xl p-6 text-center`}>
        <div className="text-5xl mb-4">{strategyInfo.emoji}</div>
        <h3 className="text-2xl font-black text-white mb-2">Tu Plan de Libertad</h3>
        <p className="text-white/80 text-sm">Estrategia: {strategyInfo.name}</p>
      </div>

      {/* Métricas Finales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{plan.simulation.months}</div>
          <div className="text-xs text-gray-400">meses hasta ser libre</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-green-400">${plan.monthlyPayment.toLocaleString()}</div>
          <div className="text-xs text-gray-400">pago mensual</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-red-400">${analysis.totalDebt.toLocaleString()}</div>
          <div className="text-xs text-gray-400">deuda a eliminar</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-orange-400">${plan.simulation.totalInterest.toLocaleString()}</div>
          <div className="text-xs text-gray-400">intereses totales</div>
        </div>
      </div>

      {/* Fecha de Libertad */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
        <div className="text-green-300 text-xs uppercase font-bold mb-1">Fecha estimada de libertad</div>
        <div className="text-2xl font-black text-white">
          {plan.simulation.freedomDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Checkbox de Compromiso */}
      <div 
        onClick={() => setAccepted(!accepted)}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          accepted 
            ? 'bg-green-500/20 border-green-500' 
            : 'bg-white/5 border-white/20 hover:border-white/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
            accepted ? 'bg-green-500 border-green-400' : 'border-gray-500'
          }`}>
            {accepted && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <div>
            <div className="text-white font-semibold">Me comprometo con este plan</div>
            <div className="text-gray-400 text-sm mt-1">
              Entiendo que el éxito depende de mi disciplina. Pagaré ${plan.monthlyPayment.toLocaleString()} cada mes 
              y no usaré las tarjetas con deuda hasta eliminarla.
            </div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onSave}
          disabled={!accepted}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-500 hover:to-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/30"
        >
          <CheckCircle2 className="w-6 h-6" />
          Guardar Mi Plan
        </button>
      </div>
    </div>
  );
}

// MODAL DE CONFIRMACIÓN
function ConfirmModal({ plan, strategy, onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const strategyInfo = getStrategyInfo(strategy);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre para tu plan');
      return;
    }
    setGuardando(true);
    await onConfirmar(nombre);
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className={`bg-gradient-to-br ${strategyInfo.color} rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/20`}>
        <button 
          onClick={onCancelar}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full border border-white/30 mb-4">
            <span className="text-4xl">{strategyInfo.emoji}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">¡Último paso!</h3>
          <p className="text-white/80 text-sm mb-6">Dale un nombre a tu plan de libertad financiera</p>

          <div className="mb-6 text-left">
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Operación Libertad 2025"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 md:px-5 py-4 text-white placeholder-white/50 focus:outline-none focus:border-white/40 backdrop-blur text-base md:text-lg font-medium"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              disabled={guardando}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white py-3.5 rounded-xl font-bold transition backdrop-blur disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando || !nombre.trim()}
              className="flex-1 bg-white text-gray-900 py-3.5 rounded-xl font-bold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3 shadow-lg"
            >
              {guardando ? <span className="animate-spin text-2xl">⏳</span> : <CheckCircle2 className="w-6 h-6" />}
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}