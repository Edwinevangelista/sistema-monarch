import { useState, useEffect } from 'react';
import { X, CreditCard, TrendingDown, CheckCircle2, AlertCircle, Zap, Calendar, Snowflake, Scale } from 'lucide-react'; // Eliminado 'Repeat' porque no se usa aquí
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

// ==========================================
// FUNCIONES DE CÁLCULO FINANCIERO
// ==========================================

function generateDebtPaymentPlan(selectedDebts, kpis = {}, strategy = 'avalancha', targetMonths = null) {
  if (!selectedDebts || !Array.isArray(selectedDebts) || selectedDebts.length === 0) {
    return {
      error: true,
      message: "Selecciona al menos una deuda para generar un plan"
    };
  }

  const safeKpis = {
    saldo: Number(kpis.saldo) || 0,
    totalIngresos: Number(kpis.totalIngresos) || 1000,
    totalGastos: Number(kpis.totalGastos) || 0
  };
  
  // Normalizar deudas
  const cleanDebts = selectedDebts.map(d => ({
    id: d.id || Math.random().toString(),
    nombre: d.nombre || d.cuenta || 'Deuda sin nombre',
    balance: Number(d.balance) || 0,
    interes: Number(d.interes) || 0,
    pagoMinimo: Number(d.pagoMinimo) || Math.max(25, (Number(d.balance) || 0) * 0.03)
  })).filter(d => d.balance > 0);

  if (cleanDebts.length === 0) {
    return {
      error: true,
      message: "Las deudas seleccionadas no tienen balances válidos"
    };
  }
  
  const totalDebt = cleanDebts.reduce((sum, d) => sum + d.balance, 0);
  const availableForDebt = calculateAvailableForDebt(safeKpis.saldo, safeKpis.totalIngresos, safeKpis.totalGastos);
  const orderedDebts = orderDebtsByStrategy(cleanDebts, strategy);
  
  let paymentPlan;
  if (targetMonths && targetMonths > 0) {
    const requiredPayment = calculateRequiredPayment(orderedDebts, targetMonths);
    paymentPlan = calculateMonthlyPlanWithTarget(orderedDebts, requiredPayment, targetMonths);
  } else {
    paymentPlan = calculateMonthlyPlan(orderedDebts, availableForDebt);
  }
  
  const summary = {
    totalDebt,
    monthsToPayoff: paymentPlan.months,
    totalInterest: paymentPlan.totalInterest,
    monthlyPayment: paymentPlan.monthlyPayment,
    monthlySavings: paymentPlan.savedInterest
  };
  
  const financialCapacity = analyzeFinancialCapacity(availableForDebt, summary.totalDebt, paymentPlan.monthlyPayment);
  const timeline = buildTimeline(paymentPlan.schedule);
  const recommendations = generateRecommendations(cleanDebts, summary, financialCapacity, safeKpis);
  
  return {
    strategy: getStrategyInfo(strategy),
    summary,
    financialCapacity,
    timeline,
    recommendations,
    paymentPlan
  };
}

function calculateRequiredPayment(cleanDebts, targetMonths) {
  let low = cleanDebts.reduce((sum, d) => sum + d.pagoMinimo, 0);
  let high = cleanDebts.reduce((sum, d) => sum + d.balance, 0) * 2;
  let requiredPayment = low;
  
  // Búsqueda binaria
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const testPlan = simulatePaymentPlan(cleanDebts, mid, targetMonths * 2);
    
    if (testPlan.months <= targetMonths) {
      requiredPayment = mid;
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return Math.ceil(requiredPayment);
}

function simulatePaymentPlan(cleanDebts, monthlyPayment, maxMonths) {
  let month = 0;
  let totalInterest = 0;
  let remainingDebts = cleanDebts.map(d => ({ ...d })); // Copia para no mutar original
  
  while (remainingDebts.length > 0 && month < maxMonths) {
    month++;
    let availableThisMonth = monthlyPayment;
    
    // Acumular intereses primero
    for (const debt of remainingDebts) {
      const monthlyInterest = (debt.balance * (debt.interes / 100)) / 12;
      debt.balance += monthlyInterest;
      totalInterest += monthlyInterest;
    }
    
    // Pagar deudas
    for (let i = 0; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      const payment = i === 0 
        ? Math.min(debt.balance, availableThisMonth) // Pago extra a la primera
        : Math.min(debt.pagoMinimo, availableThisMonth, debt.balance);
      
      debt.balance -= payment;
      availableThisMonth -= payment;
      
      if (debt.balance <= 0.01) break; // Deuda pagada
      if (availableThisMonth <= 0) break;   // Dinero agotado
    }
    
    // Remover deudas pagadas
    remainingDebts = remainingDebts.filter(d => d.balance > 0.01);
  }
  
  return { months: month, totalInterest };
}

function calculateMonthlyPlanWithTarget(cleanDebts, monthlyPayment, maxMonths) {
  const schedule = [];
  let month = 0;
  let totalInterest = 0;
  let remainingDebts = cleanDebts.map(d => ({ ...d }));
  
  while (remainingDebts.length > 0 && month < maxMonths) {
    month++;
    let availableThisMonth = monthlyPayment;
    
    // Aplicar intereses
    for (const debt of remainingDebts) {
      const monthlyInterest = (debt.balance * (debt.interes / 100)) / 12;
      debt.balance += monthlyInterest;
      totalInterest += monthlyInterest;
    }
    
    // Pagar deudas según estrategia
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
    monthlyPayment: Math.round(monthlyPayment),
    savedInterest: 0,
    schedule
  };
}

function calculateAvailableForDebt(saldo, ingresos, gastos) {
  const disponible = Math.max(0, saldo + (ingresos - gastos));
  const conservador = Math.max(50, disponible * 0.3);
  const recomendado = Math.max(100, disponible * 0.5);
  const agresivo = Math.max(150, disponible * 0.7);
  
  return {
    conservativeMonthly: Math.round(conservador),
    recommendedMonthly: Math.round(recomendado),
    aggressiveMonthly: Math.round(agresivo),
    monthlyAvailable: Math.round(recomendado)
  };
}

function orderDebtsByStrategy(cleanDebts, strategy) {
  const debtsCopy = [...cleanDebts];
  
  if (strategy === 'avalancha') {
    return debtsCopy.sort((a, b) => b.interes - a.interes);
  } else if (strategy === 'bola_nieve') {
    return debtsCopy.sort((a, b) => a.balance - b.balance);
  } else {
    const avgInterest = debtsCopy.reduce((sum, d) => sum + d.interes, 0) / debtsCopy.length;
    const avgBalance = debtsCopy.reduce((sum, d) => sum + d.balance, 0) / debtsCopy.length;
    
    return debtsCopy.sort((a, b) => {
      const scoreA = (a.interes / avgInterest) + (1 - a.balance / avgBalance);
      const scoreB = (b.interes / avgInterest) + (1 - b.balance / avgBalance);
      return scoreB - scoreA;
    });
  }
}

function calculateMonthlyPlan(cleanDebts, capacity) {
  const monthlyPayment = Math.max(capacity.recommendedMonthly, cleanDebts.reduce((sum, d) => sum + d.pagoMinimo, 0));
  const schedule = [];
  let month = 0;
  let totalInterest = 0;
  let remainingDebts = cleanDebts.map(d => ({ ...d }));
  
  while (remainingDebts.length > 0 && month < 120) {
    month++;
    let availableThisMonth = monthlyPayment;
    
    for (const debt of remainingDebts) {
      const monthlyInterest = (debt.balance * (debt.interes / 100)) / 12;
      debt.balance += monthlyInterest;
      totalInterest += monthlyInterest;
    }
    
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
    monthlyPayment: Math.round(monthlyPayment),
    savedInterest: 0,
    schedule
  };
}

function analyzeFinancialCapacity(capacity, totalDebt, monthlyPayment) {
  const safeCapacity = capacity.recommendedMonthly || 0;
  const safeDebt = Number(totalDebt) || 1;
  const ratio = (safeCapacity / safeDebt) * 100;
  
  let warningLevel, message;
  if (ratio > 10) {
    warningLevel = 'good';
    message = 'Tienes buena capacidad de pago';
  } else if (ratio > 5) {
    warningLevel = 'warning';
    message = 'Capacidad ajustada - considera aumentar ingresos';
  } else {
    warningLevel = 'critical';
    message = 'Capacidad crítica - necesitas reestructurar deudas';
  }
  
  return {
    ...capacity,
    warningLevel,
    message,
    recommendedPayment: monthlyPayment || safeCapacity,
    monthlyAvailable: safeCapacity
  };
}

function buildTimeline(schedule) {
  return {
    milestones: schedule.filter(s => s.paidOff).map(s => ({
      month: s.month,
      message: `Deuda liquidada`,
      debtName: s.debtName
    }))
  };
}

function generateRecommendations(cleanDebts, summary, capacity, kpis) {
  const recommendations = [];
  
  if (capacity.warningLevel === 'critical') {
    recommendations.push({
      icon: '🚨',
      title: 'Situación crítica',
      message: 'Tu capacidad de pago es muy limitada',
      priority: 'critical',
      action: 'Considera consolidar deudas o buscar asesoría financiera'
    });
  }
  
  if (summary.monthsToPayoff > 36) {
    recommendations.push({
      icon: '🏰',
      title: 'Plan largo',
      message: `Tomará ${Math.round(summary.monthsToPayoff / 12)} años liquidar las deudas`,
      priority: 'high',
      action: 'Aumenta tu pago mensual en $50-100 para acelerar'
    });
  }
  
  const highInterestDebts = cleanDebts.filter(d => d.interes > 20);
  if (highInterestDebts.length > 0) {
    recommendations.push({
      icon: '📈',
      title: 'Intereses altos detectados',
      message: `${highInterestDebts.length} deuda(s) con más de 20% de interés`,
      priority: 'high',
      action: 'Prioriza estas deudas o busca refinanciamiento'
    });
  }
  
  if (capacity.warningLevel === 'good' && summary.monthsToPayoff <= 24) {
    recommendations.push({
      icon: '✅',
      title: 'Excelente plan',
      message: 'Estás en muy buen camino para eliminar tus deudas',
      priority: 'success',
      action: 'Mantén el ritmo y evita nuevas deudas'
    });
  }
  
  const extraPayment = Math.round(capacity.aggressiveMonthly - capacity.recommendedMonthly);
  if (extraPayment > 0) {
    recommendations.push({
      icon: '💪',
      title: 'Acelera tu libertad financiera',
      message: `Podrías pagar $${extraPayment} extra al mes`,
      priority: 'medium',
      action: `Reducirías aproximadamente ${Math.round(summary.monthsToPayoff * 0.3)} meses del plan`
    });
  }
  
  return recommendations;
}

function getStrategyInfo(strategy) {
  const strategies = {
    avalancha: {
      name: 'Avalancha',
      description: 'Paga primero las deudas con mayor tasa de interés. Minimiza el interés total pagado.',
      icon: <Zap className="w-6 h-6" />,
      emoji: '🏔️'
    },
    bola_nieve: {
      name: 'Bola de Nieve',
      description: 'Paga primero las deudas más pequeñas. Genera victorias rápidas y motivación.',
      icon: <Snowflake className="w-6 h-6" />,
      emoji: '⛄'
    },
    balanceada: {
      name: 'Balanceada',
      description: 'Combina interés alto y balance bajo. Un enfoque equilibrado.',
      icon: <Scale className="w-6 h-6" />,
      emoji: '⚖️'
    }
  };
  
  return strategies[strategy] || strategies.avalancha;
}

function compareDebtStrategies(cleanDebts, kpis = {}) {
  const strategies = ['avalancha', 'bola_nieve', 'balanceada'];
  
  return strategies.map(strategy => {
    try {
      const plan = generateDebtPaymentPlan(cleanDebts, kpis, strategy);
      if (plan.error) return null;
      
      return {
        strategy,
        name: getStrategyInfo(strategy).name,
        monthsToPayoff: plan.summary.monthsToPayoff,
        totalInterest: plan.summary.totalInterest,
        monthlyPayment: plan.summary.monthlyPayment,
        recommended: strategy === 'avalancha'
      };
    } catch (error) {
      console.error(`Error comparando estrategia ${strategy}:`, error);
      return null;
    }
  }).filter(s => s !== null);
}

// ==========================================
// COMPONENTE PRINCIPAL DEL MODAL
// ==========================================

export default function DebtPlannerModal({ deudas = [], kpis = {}, onClose, onPlanGuardado }) {
  const [selectedDebts, setSelectedDebts] = useState([]);
  const [strategy, setStrategy] = useState('avalancha');
  const [targetMonths, setTargetMonths] = useState('');
  const [plan, setPlan] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [view, setView] = useState('select');
  
  const { addPlan } = usePlanesGuardados();
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [planParaGuardar, setPlanParaGuardar] = useState(null);

  useEffect(() => {
    if (deudas && deudas.length > 0) {
      setSelectedDebts(deudas.map(d => d.id));
    }
  }, [deudas]);

  const normalizeDebt = (deuda) => {
    const balance = Number(deuda.balance || deuda.monto || deuda.amount || deuda.saldo || 0);
    const interes = Number(deuda.interes || deuda.interest || deuda.tasa || deuda.rate || 0);
    const pagoMinimo = Number(deuda.pagoMinimo || deuda.pago_min || deuda.minPayment || Math.max(25, balance * 0.03));
    const nombre = deuda.nombre || deuda.cuenta || deuda.name || deuda.descripcion || 'Deuda sin nombre'; 
  
    return { ...deuda, balance, interes, pagoMinimo, nombre };
  };

  const toggleDebt = (debtId) => {
    setSelectedDebts(prev => 
      prev.includes(debtId) ? prev.filter(id => id !== debtId) : [...prev, debtId]
    );
  };

  const generatePlan = () => {
    try {
      const selected = deudas.filter(d => selectedDebts.includes(d.id)).map(normalizeDebt);
      
      if (selected.length === 0) {
        alert('Por favor selecciona al menos una deuda');
        return;
      }
      
      const months = targetMonths ? parseInt(targetMonths) : null;
      const generatedPlan = generateDebtPaymentPlan(selected, kpis, strategy, months);
      
      if (generatedPlan.error) {
        alert(generatedPlan.message);
        return;
      }
      
      setPlan(generatedPlan);
      setPlanParaGuardar(generatedPlan);
      setView('plan');
    } catch (error) {
      console.error('Error generando plan:', error);
      alert('Error al generar el plan: ' + error.message);
    }
  };

  const compareStrategiesView = () => {
    try {
      const selected = deudas.filter(d => selectedDebts.includes(d.id)).map(normalizeDebt);
      
      if (selected.length === 0) {
        alert('Por favor selecciona al menos una deuda');
        return;
      }
      
      const comp = compareDebtStrategies(selected, kpis);
      setComparison(comp);
      setView('compare');
    } catch (error) {
      console.error('Error comparando estrategias:', error);
      alert('Error al comparar estrategias: ' + error.message);
    }
  };

  if (!deudas || deudas.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hay deudas registradas</h3>
            <p className="text-gray-400 mb-4">Primero agrega tus deudas en la sección de Tarjetas.</p>
            <button onClick={onClose} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full md:max-w-4xl md:h-auto md:max-h-[90vh] h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md p-4 md:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-300 border border-purple-500/20">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Planificador de Deudas</h2>
              <p className="text-purple-200 text-xs md:text-sm">Elimina tus deudas estratégicamente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {view === 'select' && (
            <SelectWizard 
              deudas={deudas}
              selectedDebts={selectedDebts}
              toggleDebt={toggleDebt}
              strategy={strategy}
              setStrategy={setStrategy}
              targetMonths={targetMonths}
              setTargetMonths={setTargetMonths}
              // --- CORRECCIÓN AQUÍ: Pasar setSelectedDebts como prop ---
              setSelectedDebts={setSelectedDebts} 
              onGenerate={generatePlan}
              onCompare={compareStrategiesView}
              normalizeDebt={normalizeDebt}
            />
          )}

          {view === 'compare' && comparison && (
            <CompareWizard 
              comparison={comparison}
              onSelectStrategy={(strat) => {
                setStrategy(strat);
                setView('select');
              }}
              onBack={() => setView('select')}
            />
          )}

          {view === 'plan' && plan && (
            <PlanResult 
              plan={plan}
              onBack={() => setView('select')}
              onGuardar={() => setShowConfirmacion(true)}
            />
          )}
        </div>
      </div>

      {/* Modal de Confirmación (Overlay separado) */}
      {showConfirmacion && planParaGuardar && (
        <ConfirmModal
          plan={planParaGuardar}
          tipo="deudas"
          onConfirmar={async (nombre) => {
            try {
              const config = planParaGuardar;
              await addPlan({
                tipo: 'deudas',
                nombre: nombre,
                descripcion: `Plan de pago de deudas: ${config.strategy?.name || 'Libertad financiera'}`,
                configuracion: config,
                meta_principal: config.strategy?.name || 'Pagar deudas',
                monto_objetivo: config.summary?.totalDebt || 0,
                monto_actual: 0,
                progreso: 0,
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_objetivo: new Date(Date.now() + (config.summary?.monthsToPayoff || 0) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                meses_duracion: config.summary?.monthsToPayoff || 0,
                activo: true,
                completado: false
              });

              alert('✅ Plan guardado exitosamente');
              setShowConfirmacion(false);
              if (onPlanGuardado) onPlanGuardado();
              onClose();
            } catch (error) {
              console.error('Error guardando plan:', error);
              alert('Error al guardar el plan: ' + error.message);
            }
          }}
          onCancelar={() => setShowConfirmacion(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// SUB-COMPONENTES DEL WIZARD
// ==========================================

function SelectWizard({ deudas, selectedDebts, toggleDebt, strategy, setStrategy, targetMonths, setTargetMonths, setSelectedDebts, onGenerate, onCompare, normalizeDebt }) {
  const strategies = [
    { id: 'avalancha', name: 'Avalancha', icon: Zap, desc: 'Tasa más alta (ahorra más)' },
    { id: 'bola_nieve', name: 'Bola de Nieve', icon: Snowflake, desc: 'Saldo menor (motivación)' },
    { id: 'balanceada', name: 'Balanceada', icon: Scale, desc: 'Combina ambos métodos' }
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 md:pb-0">
      
      {/* 1. Seleccionar Deudas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg md:text-xl flex items-center gap-3">
            <span className="bg-purple-600 text-white text-xs md:text-sm w-7 h-7 rounded-full flex items-center justify-center border border-purple-400">1</span>
            Selecciona tus deudas
          </h3>
          <button 
            // --- CORRECCIÓN AQUÍ: Usar setSelectedDebts pasado como prop ---
            onClick={() => selectedDebts.length === deudas.length ? setSelectedDebts([]) : setSelectedDebts(deudas.map(d => d.id))} 
            className="text-purple-300 hover:text-white transition text-xs md:text-sm"
          >
            {selectedDebts.length === deudas.length ? 'Desmarcar todos' : 'Seleccionar todos'}
          </button>
        </div>
        <div className="space-y-2">
          {deudas.map(deuda => {
            const normalized = normalizeDebt(deuda);
            const isSelected = selectedDebts.includes(deuda.id);
            
            return (
              <button
                key={deuda.id}
                onClick={() => toggleDebt(deuda.id)}
                className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all active:scale-[0.98] flex items-center gap-4 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-400' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-gray-500'
                }`}>
                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-sm md:text-base">{normalized.nombre}</div>
                  <div className="text-gray-400 text-xs md:text-sm mt-0.5">
                    Saldo: <span className="text-white font-medium">${normalized.balance.toLocaleString()}</span> • 
                    Interés: <span className="text-orange-300">{normalized.interes}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Estrategia */}
      <div>
        <h3 className="text-white font-bold text-lg md:text-xl flex items-center gap-3 mb-4">
          <span className="bg-purple-600 text-white text-xs md:text-sm w-7 h-7 rounded-full flex items-center justify-center border border-purple-400">2</span>
          Elige tu estrategia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {strategies.map(strat => {
            const Icon = strat.icon;
            const isSelected = strategy === strat.id;
            return (
              <button
                key={strat.id}
                onClick={() => setStrategy(strat.id)}
                className={`p-4 md:p-5 rounded-2xl text-left transition-all duration-300 border-2 ${
                  isSelected
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/30 scale-105'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 inline-block ${isSelected ? 'bg-white text-purple-600' : 'bg-purple-500/20 text-purple-300'}`}>
                  <Icon className={`w-6 h-6 md:w-8 md:h-8 ${isSelected ? 'animate-bounce' : ''}`} />
                </div>
                <h4 className="text-white font-bold text-base md:text-lg mb-1">{strat.name}</h4>
                <p className="text-gray-400 text-xs md:text-sm">{strat.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Plazo (Opcional) */}
      <div>
        <h3 className="text-white font-bold text-lg md:text-xl flex items-center gap-3 mb-4">
          <span className="bg-purple-600 text-white text-xs md:text-sm w-7 h-7 rounded-full flex items-center justify-center border border-purple-400">3</span>
          Plazo objetivo
        </h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="flex items-center gap-2 text-gray-300 text-sm md:text-base mb-3">
            <Calendar className="w-4 h-4" />
            ¿En cuántos meses quieres ser libre de deudas?
          </label>
          <input
            type="number"
            value={targetMonths}
            onChange={(e) => setTargetMonths(e.target.value)}
            placeholder="Opcional. Dejar vacío para automático."
            min="1"
            max="120"
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
          <p className="text-gray-500 text-xs md:text-sm mt-2">
            💡 Si defines un plazo, el sistema calculará el pago mensual necesario para cumplirlo.
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3 md:gap-4 pt-4 border-t border-white/10 sticky bottom-0 bg-gray-900 pb-4 md:pb-0 z-10">
        <button
          onClick={onCompare}
          disabled={selectedDebts.length === 0}
          className="flex-1 bg-white/5 text-white py-3.5 rounded-xl font-bold hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 border border-white/5"
        >
          <TrendingDown className="w-5 h-5" /> Comparar
        </button>
        <button
          onClick={onGenerate}
          disabled={selectedDebts.length === 0}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" /> Generar Plan
        </button>
      </div>
    </div>
  );
}

function CompareWizard({ comparison, onSelectStrategy, onBack }) {
  if (!comparison || comparison.length === 0) {
    return <div className="text-center py-10 text-gray-400">Error al cargar comparación</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4">
      <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition">
        <X className="w-4 h-4" /> Volver
      </button>
      <h3 className="text-white font-bold text-2xl md:text-3xl mb-6">Comparación de Estrategias</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {comparison.map(strat => {
          const isRecommended = strat.recommended;
          return (
            <div 
              key={strat.strategy} 
              className={`bg-white/5 rounded-2xl p-5 md:p-6 border-2 transition-all hover:scale-105 ${
                isRecommended ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-purple-500/50'
              }`}
            >
              <div className="text-center mb-4">
                {strat.strategy === 'avalancha' ? '🏔️' : strat.strategy === 'bola_nieve' ? '⛄' : '⚖️'}
              </div>
              <h4 className="text-white font-bold text-lg md:text-xl text-center mb-4">{strat.name}</h4>
              
              <div className="space-y-3 text-sm md:text-base">
                <div className="flex justify-between text-gray-400">
                  <span>Tiempo:</span>
                  <span className="text-white font-bold">{strat.monthsToPayoff} meses</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Pago Mensual:</span>
                  <span className="text-white font-bold">${strat.monthlyPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Intereses Totales:</span>
                  <span className="text-white font-bold">${strat.totalInterest.toLocaleString()}</span>
                </div>
              </div>

              {isRecommended && (
                <div className="mt-4 text-center text-green-400 text-xs font-bold bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                  ✓ Recomendada Matemáticamente
                </div>
              )}

              <button
                onClick={() => onSelectStrategy(strat.strategy)}
                className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-900/20 transition-all"
              >
                Usar esta
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanResult({ plan, onBack, onGuardar }) {
  if (!plan || plan.error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-white text-lg">{plan?.message || 'Error al generar el plan'}</p>
        <button onClick={onBack} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Volver</button>
      </div>
    );
  }

  const { strategy, summary = {}, recommendations = [] } = plan;
  const totalDebt = Number(summary.totalDebt) || 0;
  const monthsToPayoff = Number(summary.monthsToPayoff) || 0;
  const monthlyPayment = Number(summary.monthlyPayment) || 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition">
        <X className="w-4 h-4" /> Volver
      </button>
      
      {/* Header Strategy */}
      {strategy && (
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-2xl p-6 md:p-8 text-center">
           <h3 className="text-white font-bold text-xl md:text-2xl mb-4 flex items-center justify-center gap-4">
             <span className="text-3xl md:text-4xl">{strategy.emoji}</span>
             Tu Personalizado
           </h3>
          <p className="text-purple-200 text-sm md:text-base">{strategy.description}</p>
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-2">Estrategia</div>
          <p className="text-white font-bold capitalize text-sm md:text-base">{strategy?.name || 'N/A'}</p>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-2">Tiempo</div>
          <div className="text-white font-bold text-xl md:text-2xl">{monthsToPayoff}</div>
          <div className="text-gray-500 text-[10px] md:text-xs mt-1">{(monthsToPayoff/12).toFixed(1)} años</div>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-2">Pago Mensual</div>
          <div className="text-green-400 font-bold text-xl md:text-2xl">${monthlyPayment.toLocaleString()}</div>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-center">
          <div className="text-gray-400 text-[10px] md:text-xs uppercase font-bold mb-2">Objetivo</div>
          <div className="text-white font-bold text-base md:text-lg">{totalDebt.toLocaleString()}</div>
        </div>
      </div>

      {/* Recomendaciones */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-base md:text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Recomendaciones Inteligentes
          </h4>
          {recommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                rec.priority === 'critical' ? 'bg-red-500/10 border-red-500/20' : 
                rec.priority === 'high' ? 'bg-orange-500/10 border-orange-500/20' :
                rec.priority === 'success' ? 'bg-green-500/10 border-green-500/20' :
                'bg-white/5 border-white/10'
              }`}
            >
              <span className="text-2xl">{rec.icon}</span>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm md:text-base">{rec.title}</div>
                <div className="text-gray-300 text-sm md:text-base mt-1">{rec.message}</div>
                {rec.action && (
                  <div className="text-purple-300 text-xs md:text-sm mt-2 font-medium">→ {rec.action}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Botón Guardar */}
      <button
        onClick={onGuardar}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-3 border border-emerald-500/20"
      >
        <CheckCircle2 className="w-6 h-6" /> Guardar Plan de Libertad
      </button>
    </div>
  );
}

function ConfirmModal({ plan, tipo, onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre para tu plan');
      return;
    }
    setGuardando(true);
    await onConfirmar(nombre);
    setGuardando(false);
  };

  const getTipoInfo = () => {
    switch(tipo) {
      case 'ahorro': return { emoji: '💰', color: 'from-green-600 to-emerald-600', label: 'Ahorro' };
      case 'deudas': return { emoji: '💳', color: 'from-red-600 to-pink-600', label: 'Deudas' };
      case 'gastos': return { emoji: '💸', color: 'from-orange-600 to-yellow-600', label: 'Gastos' };
      default: return { emoji: '📋', color: 'from-blue-600 to-purple-600', label: 'Plan' };
    }
  };

  const { emoji, color, label } = getTipoInfo();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className={`bg-gradient-to-br ${color} rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/20`}>
        {/* Botón Cerrar Absoluto */}
        <button 
          onClick={onCancelar}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full border border-white/30 mb-4">
            <span className="text-4xl">{emoji}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white">Guardar Plan de {label}</h3>
          <div className="h-1 w-20 bg-white/30 rounded-full mb-6"></div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              Este plan se guardará en tu lista de planes activos. Podrás verlo, editarlo y seguir tu progreso en el Dashboard.
            </p>
          </div>

          <div className="mb-6 text-left">
             <label className="block text-white/80 text-sm md:text-base mb-3 font-bold">
              Nombre del plan
             </label>
             <input 
               type="text" 
               value={nombre}
               onChange={(e) => setNombre(e.target.value)}
               placeholder={`Ej: Plan de ${label} ${new Date().getFullYear()}`}
               className="w-full bg-white/10 border border-white/20 rounded-xl px-4 md:px-5 py-4 text-white placeholder-white/50 focus:outline-none focus:border-white/40 backdrop-blur text-base md:text-lg font-medium"
               autoFocus
             />
          </div>

          <div className="flex gap-3 md:gap-4">
             <button
               onClick={onCancelar}
               className="flex-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white py-3.5 rounded-xl font-bold transition backdrop-blur disabled:opacity-50"
               disabled={guardando}
             >
               Cancelar
             </button>
             <button
               onClick={handleGuardar}
               disabled={guardando}
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