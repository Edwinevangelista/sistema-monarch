// src/components/DebtPlannerModal.jsx
import { useState, useEffect } from 'react';
import { X, CreditCard, TrendingDown, Target, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

// ========== FUNCIONES DEL CEREBRO (INLINE) ==========

function generateDebtPaymentPlan(selectedDebts, kpis = {}, strategy = 'avalancha') {
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
  
  const cleanDebts = selectedDebts.map(d => ({
    id: d.id || Math.random().toString(),
    nombre: d.nombre || d.cuenta || 'Deuda sin nombre',
    balance: Number(d.balance) || 0,
    interes: Number(d.interes) || 0,
    pagoMinimo: Number(d.pagoMinimo) || (Number(d.balance) || 0) * 0.03
  })).filter(d => d.balance > 0);

  if (cleanDebts.length === 0) {
    return {
      error: true,
      message: "Las deudas seleccionadas no tienen balances válidos"
    };
  }
  
  const availableForDebt = calculateAvailableForDebt(safeKpis.saldo, safeKpis.totalIngresos, safeKpis.totalGastos);
  const orderedDebts = orderDebtsByStrategy(cleanDebts, strategy);
  const paymentPlan = calculateMonthlyPlan(orderedDebts, availableForDebt);
  
  const summary = {
    totalDebt: cleanDebts.reduce((sum, d) => sum + d.balance, 0),
    monthsToPayoff: paymentPlan.months,
    totalInterestPaid: paymentPlan.totalInterest,
    monthlySavings: paymentPlan.savedInterest
  };
  
  const financialCapacity = analyzeFinancialCapacity(availableForDebt, summary.totalDebt);
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

function compareDebtStrategies(debts, kpis = {}) {
  const strategies = ['avalancha', 'bola_nieve', 'balanceada'];
  
  return strategies.map(strategy => {
    try {
      const plan = generateDebtPaymentPlan(debts, kpis, strategy);
      if (plan.error) return null;
      
      return {
        strategy,
        name: getStrategyInfo(strategy).name,
        monthsToPayoff: plan.summary.monthsToPayoff,
        totalInterest: plan.summary.totalInterestPaid,
        firstVictoryMonth: plan.timeline.milestones[0]?.month || 0,
        recommended: strategy === 'avalancha'
      };
    } catch (error) {
      console.error(`Error comparando estrategia ${strategy}:`, error);
      return null;
    }
  }).filter(s => s !== null);
}

function calculateAvailableForDebt(saldo, ingresos, gastos) {
  const disponible = saldo + (ingresos - gastos);
  const conservador = Math.max(0, disponible * 0.3);
  const recomendado = Math.max(0, disponible * 0.5);
  const agresivo = Math.max(0, disponible * 0.7);
  
  return {
    conservativeMonthly: Math.round(conservador),
    recommendedMonthly: Math.round(recomendado),
    aggressiveMonthly: Math.round(agresivo),
    monthlyAvailable: Math.round(recomendado)
  };
}

function orderDebtsByStrategy(debts, strategy) {
  const debtsCopy = [...debts];
  
  if (strategy === 'avalancha') {
    return debtsCopy.sort((a, b) => b.interes - a.interes);
  } else if (strategy === 'bola_nieve') {
    return debtsCopy.sort((a, b) => a.balance - b.balance);
  } else {
    const avgInterest = debts.reduce((sum, d) => sum + d.interes, 0) / debts.length;
    const avgBalance = debts.reduce((sum, d) => sum + d.balance, 0) / debts.length;
    
    return debtsCopy.sort((a, b) => {
      const scoreA = (a.interes / avgInterest) + (1 - a.balance / avgBalance);
      const scoreB = (b.interes / avgInterest) + (1 - b.balance / avgBalance);
      return scoreB - scoreA;
    });
  }
}

function calculateMonthlyPlan(debts, capacity) {
  const monthlyPayment = capacity.recommendedMonthly;
  const schedule = [];
  let month = 0;
  let totalInterest = 0;
  let remainingDebts = debts.map(d => ({ ...d }));
  
  while (remainingDebts.length > 0 && month < 360) {
    month++;
    let availableThisMonth = monthlyPayment;
    
    remainingDebts.forEach(debt => {
      const monthlyInterest = (debt.balance * (debt.interes / 100)) / 12;
      debt.balance += monthlyInterest;
      totalInterest += monthlyInterest;
    });
    
    for (let i = 0; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      const payment = Math.min(debt.balance, i === 0 ? availableThisMonth : debt.pagoMinimo);
      
      debt.balance -= payment;
      availableThisMonth -= payment;
      
      if (debt.balance <= 0) {
        schedule.push({
          month,
          debtId: debt.id,
          debtName: debt.nombre,
          paidOff: true
        });
      }
      
      if (availableThisMonth <= 0) break;
    }
    
    remainingDebts = remainingDebts.filter(d => d.balance > 0);
  }
  
  return {
    months: month,
    totalInterest: Math.round(totalInterest),
    savedInterest: 0,
    schedule
  };
}

function analyzeFinancialCapacity(capacity, totalDebt) {
  const ratio = (capacity.recommendedMonthly / totalDebt) * 100;
  
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
    recommendedPayment: capacity.recommendedMonthly
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

function generateRecommendations(debts, summary, capacity, kpis) {
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
      icon: '⏰',
      title: 'Plan largo',
      message: `Tomará ${Math.round(summary.monthsToPayoff / 12)} años pagar las deudas`,
      priority: 'high',
      action: 'Busca formas de aumentar el pago mensual'
    });
  }
  
  const highInterestDebts = debts.filter(d => d.interes > 20);
  if (highInterestDebts.length > 0) {
    recommendations.push({
      icon: '📈',
      title: 'Intereses altos detectados',
      message: `Tienes ${highInterestDebts.length} deuda(s) con más de 20% de interés`,
      priority: 'high',
      action: 'Prioriza estas deudas o busca refinanciamiento'
    });
  }
  
  if (capacity.warningLevel === 'good') {
    recommendations.push({
      icon: '✅',
      title: 'Buena capacidad de pago',
      message: 'Estás en buen camino para eliminar tus deudas',
      priority: 'success',
      action: 'Mantén el ritmo y evita nuevas deudas'
    });
  }
  
  return recommendations;
}

function getStrategyInfo(strategy) {
  const strategies = {
    avalancha: {
      name: 'Avalancha',
      description: 'Paga primero las deudas con mayor tasa de interés. Minimiza el interés total pagado.',
      icon: '🏔️'
    },
    bola_nieve: {
      name: 'Bola de Nieve',
      description: 'Paga primero las deudas más pequeñas. Genera victorias rápidas y motivación.',
      icon: '⛄'
    },
    balanceada: {
      name: 'Balanceada',
      description: 'Combina interés alto y balance bajo. Un enfoque equilibrado.',
      icon: '⚖️'
    }
  };
  
  return strategies[strategy] || strategies.avalancha;
}

// ========== COMPONENTE MODAL ==========

export default function DebtPlannerModal({ deudas = [], kpis = {}, onClose }) {
  const [selectedDebts, setSelectedDebts] = useState([]);
  const [strategy, setStrategy] = useState('avalancha');
  const [plan, setPlan] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [view, setView] = useState('select');

  useEffect(() => {
    if (deudas && deudas.length > 0) {
      setSelectedDebts(deudas.map(d => d.id));
    }
  }, [deudas]);

  const normalizeDebt = (deuda) => {
    const balance = Number(deuda.balance || deuda.monto || deuda.amount || deuda.saldo || 0);
    const interes = Number(deuda.interes || deuda.interest || deuda.tasa || deuda.rate || 0);
    const pagoMinimo = Number(deuda.pagoMinimo || deuda.pagoMin || deuda.minPayment || balance * 0.03);
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
      
      const generatedPlan = generateDebtPaymentPlan(selected, kpis, strategy);
      setPlan(generatedPlan);
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
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hay deudas registradas</h3>
            <p className="text-gray-300 mb-4">Primero agrega tus deudas en la sección de Deudas.</p>
            <button onClick={onClose} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl max-w-4xl w-full my-8" onClick={e => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-300" />
            <div>
              <h2 className="text-2xl font-bold text-white">Plan de Pago de Deudas</h2>
              <p className="text-purple-200 text-sm">Elimina tus deudas estratégicamente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {view === 'select' && (
            <SelectDebtsView 
              deudas={deudas}
              selectedDebts={selectedDebts}
              toggleDebt={toggleDebt}
              strategy={strategy}
              setStrategy={setStrategy}
              onGenerate={generatePlan}
              onCompare={compareStrategiesView}
              normalizeDebt={normalizeDebt}
            />
          )}

          {view === 'compare' && comparison && (
            <CompareStrategiesView 
              comparison={comparison}
              onSelectStrategy={(strat) => {
                setStrategy(strat);
                setView('select');
              }}
              onBack={() => setView('select')}
            />
          )}

          {view === 'plan' && plan && (
            <PlanView 
              plan={plan}
              onBack={() => setView('select')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SelectDebtsView({ deudas, selectedDebts, toggleDebt, strategy, setStrategy, onGenerate, onCompare, normalizeDebt }) {
  const strategies = [
    { id: 'avalancha', name: 'Avalancha', icon: '🏔️', desc: 'Paga primero tasas altas (ahorra más)' },
    { id: 'bola_nieve', name: 'Bola de Nieve', icon: '⛄', desc: 'Paga primero deudas pequeñas (motivación)' },
    { id: 'balanceada', name: 'Balanceada', icon: '⚖️', desc: 'Combina ambos métodos' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">1. Selecciona las deudas a pagar</h3>
        <div className="space-y-2">
          {deudas.map(deuda => {
            const normalized = normalizeDebt(deuda);
            const { balance, interes, pagoMinimo, nombre } = normalized;
            
            return (
              <label 
                key={deuda.id}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition ${
                  selectedDebts.includes(deuda.id)
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-2 border-purple-400'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDebts.includes(deuda.id)}
                  onChange={() => toggleDebt(deuda.id)}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <div className="text-white font-semibold">{nombre}</div>
                  <div className="text-gray-300 text-sm">
                    Balance: ${balance > 0 ? balance.toLocaleString() : '0'} • 
                    Interés: {interes}% • 
                    Pago mínimo: ${Math.round(pagoMinimo)}
                  </div>
                </div>
                {selectedDebts.includes(deuda.id) && (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">2. Elige tu estrategia</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {strategies.map(strat => (
            <button
              key={strat.id}
              onClick={() => setStrategy(strat.id)}
              className={`p-4 rounded-xl text-left transition ${
                strategy === strat.id
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 scale-105'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="text-3xl mb-2">{strat.icon}</div>
              <div className="text-white font-semibold mb-1">{strat.name}</div>
              <div className="text-purple-200 text-sm">{strat.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCompare}
          disabled={selectedDebts.length === 0}
          className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <TrendingDown className="w-5 h-5" />
          Comparar Estrategias
        </button>
        <button
          onClick={onGenerate}
          disabled={selectedDebts.length === 0}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Generar Plan
        </button>
      </div>
    </div>
  );
}

function CompareStrategiesView({ comparison, onSelectStrategy, onBack }) {
  if (!comparison || !Array.isArray(comparison) || comparison.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-white">Error al cargar comparación</p>
        <button onClick={onBack} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-purple-300 hover:text-purple-200">← Volver</button>
      <h3 className="text-xl font-bold text-white">Comparación de Estrategias</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.map(strat => (
          <div key={strat.strategy} className="bg-white/10 rounded-xl p-5">
            <div className="text-2xl mb-2">
              {strat.strategy === 'avalancha' ? '🏔️' : strat.strategy === 'bola_nieve' ? '⛄' : '⚖️'}
            </div>
            <h4 className="text-white font-bold text-lg mb-3">{strat.name}</h4>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Tiempo:</span>
                <span className="text-white font-semibold">{strat.monthsToPayoff} meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Intereses:</span>
                <span className="text-white font-semibold">${Math.round(strat.totalInterest).toLocaleString()}</span>
              </div>
            </div>
            {strat.recommended && <div className="bg-green-500/20 text-green-300 text-xs py-1 px-2 rounded mb-3 text-center">✓ Recomendada</div>}
            <button
              onClick={() => onSelectStrategy(strat.strategy)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm"
            >
              Usar esta estrategia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanView({ plan, onBack }) {
  if (!plan || plan.error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-white text-lg">{plan?.message || 'Error al generar el plan'}</p>
        <button onClick={onBack} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg">Volver</button>
      </div>
    );
  }

  const { strategy, summary = {}, financialCapacity = {}, timeline = {}, recommendations = [] } = plan;
  const totalDebt = Number(summary.totalDebt) || 0;
  const monthsToPayoff = Number(summary.monthsToPayoff) || 0;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-purple-300">← Volver</button>
      
      {strategy && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-400/30">
          <h3 className="text-2xl font-bold text-white mb-2">{strategy.name}</h3>
          <p className="text-purple-200">{strategy.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-gray-300 text-sm">Deuda Total</div>
          <div className="text-white text-2xl font-bold">${totalDebt.toLocaleString()}</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-gray-300 text-sm">Tiempo</div>
          <div className="text-white text-2xl font-bold">{monthsToPayoff} meses</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-gray-300 text-sm">Pago Mensual</div>
          <div className="text-white text-2xl font-bold">${financialCapacity.recommendedPayment || 0}</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-gray-300 text-sm">Años</div>
          <div className="text-white text-2xl font-bold">{(monthsToPayoff / 12).toFixed(1)}</div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold">💡 Recomendaciones</h4>
          {recommendations.map((rec, idx) => (
            <div key={idx} className="rounded-xl p-4 bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{rec.icon}</span>
                <div>
                  <div className="text-white font-semibold">{rec.title}</div>
                  <div className="text-gray-300 text-sm">{rec.message}</div>
                  {rec.action && <div className="text-purple-300 text-sm mt-1">→ {rec.action}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}