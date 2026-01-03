// src/components/DebtPlannerModal.jsx
import { useState, useEffect } from 'react';
import {
  CreditCard,
  X,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Zap
} from "lucide-react";

// ========== FUNCIONES DEL CEREBRO (INLINE) ==========

function generateDebtPaymentPlan(selectedDebts, kpis = {}, strategy = 'avalancha') {
  if (!selectedDebts || !Array.isArray(selectedDebts) || selectedDebts.length === 0) {
    return { error: true, message: "Selecciona al menos una deuda para generar un plan" };
  }

  const safeKpis = {
    saldo: Number(kpis.saldo) || 0,
    totalIngresos: Number(kpis.totalIngresos) || 1000,
    totalGastos: Number(kpis.totalGastos) || 0
  };

  const cleanDebts = selectedDebts.map(d => ({
    id: d.id,
    nombre: d.nombre || d.cuenta || 'Deuda sin nombre',
    balance: Number(d.balance) || 0,
    interes: Number(d.interes) || 0,
    pagoMinimo: Number(d.pagoMinimo) || Math.max(25, (Number(d.balance) || 0) * 0.03)
  })).filter(d => d.balance > 0);

  if (cleanDebts.length === 0) {
    return { error: true, message: "Las deudas seleccionadas no tienen balances válidos" };
  }

  const availableForDebt = calculateAvailableForDebt(
    safeKpis.saldo,
    safeKpis.totalIngresos,
    safeKpis.totalGastos
  );

  const orderedDebts = orderDebtsByStrategy(cleanDebts, strategy);
  const paymentPlan = calculateMonthlyPlan(orderedDebts, availableForDebt);

  const summary = {
    totalDebt: cleanDebts.reduce((s, d) => s + d.balance, 0),
    monthsToPayoff: paymentPlan.months,
    totalInterestPaid: paymentPlan.totalInterest
  };

  return {
    strategy: getStrategyInfo(strategy),
    summary,
    financialCapacity: analyzeFinancialCapacity(availableForDebt, summary.totalDebt),
    timeline: buildTimeline(paymentPlan.schedule),
    recommendations: generateRecommendations(cleanDebts, summary, availableForDebt),
    paymentPlan
  };
}

function calculateAvailableForDebt(saldo, ingresos, gastos) {
  const disponible = Math.max(0, saldo + (ingresos - gastos));
  return {
    conservativeMonthly: Math.round(Math.max(50, disponible * 0.3)),
    recommendedMonthly: Math.round(Math.max(100, disponible * 0.5)),
    aggressiveMonthly: Math.round(Math.max(150, disponible * 0.7))
  };
}

function orderDebtsByStrategy(debts, strategy) {
  const copy = [...debts];
  if (strategy === 'avalancha') return copy.sort((a, b) => b.interes - a.interes);
  if (strategy === 'bola_nieve') return copy.sort((a, b) => a.balance - b.balance);
  return copy;
}

function calculateMonthlyPlan(debts, capacity) {
  const monthlyPayment = capacity.recommendedMonthly;
  let month = 0;
  let totalInterest = 0;
  let remaining = debts.map(d => ({ ...d }));
  const schedule = [];

  while (remaining.length && month < 120) {
    month++;

    remaining.forEach(d => {
      const interest = (d.balance * d.interes) / 100 / 12;
      d.balance += interest;
      totalInterest += interest;
    });

    let available = monthlyPayment;

    for (let i = 0; i < remaining.length; i++) {
      const d = remaining[i];
      const pay = Math.min(d.balance, i === 0 ? available : d.pagoMinimo);
      d.balance -= pay;
      available -= pay;

      if (d.balance <= 0.01) {
        schedule.push({ month, debtId: d.id, debtName: d.nombre, paidOff: true });
      }

      if (available <= 0) break;
    }

    remaining = remaining.filter(d => d.balance > 0.01);
  }

  return {
    months: month,
    totalInterest: Math.round(totalInterest),
    schedule
  };
}

function analyzeFinancialCapacity(capacity, totalDebt) {
  const ratio = (capacity.recommendedMonthly / totalDebt) * 100;
  return {
    ...capacity,
    warningLevel: ratio > 10 ? 'good' : ratio > 5 ? 'warning' : 'critical',
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

function generateRecommendations(debts, summary, capacity) {
  const recs = [];
  if (summary.monthsToPayoff > 36) {
    recs.push({
      icon: '⏰',
      title: 'Plan largo',
      message: `Tomará ${Math.round(summary.monthsToPayoff / 12)} años`
    });
  }
  if (capacity.warningLevel === 'good') {
    recs.push({
      icon: '✅',
      title: 'Buen progreso',
      message: 'Vas por excelente camino'
    });
  }
  return recs;
}

function getStrategyInfo(strategy) {
  return {
    avalancha: { name: 'Avalancha', description: 'Menos interés total' },
    bola_nieve: { name: 'Bola de Nieve', description: 'Victorias rápidas' },
    balanceada: { name: 'Balanceada', description: 'Equilibrada' }
  }[strategy];
}

// ========== COMPONENTE ==========

export default function DebtPlannerModal({ deudas = [], kpis = {}, onClose }) {
  const [selectedDebts, setSelectedDebts] = useState([]);
  const [strategy, setStrategy] = useState('avalancha');
  const [plan, setPlan] = useState(null);
  const [view, setView] = useState('select');

  useEffect(() => {
    setSelectedDebts(deudas.map(d => d.id));
  }, [deudas]);

  const generatePlan = () => {
    const selected = deudas.filter(d => selectedDebts.includes(d.id));
    const p = generateDebtPaymentPlan(selected, kpis, strategy);
    setPlan(p);
    setView('plan');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-3xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <CreditCard /> Plan de Deudas
          </h2>
          <button onClick={onClose}><X className="text-white" /></button>
        </div>

        <div className="p-6">
          {view === 'select' && (
            <button
              onClick={generatePlan}
              className="w-full bg-green-600 text-white py-3 rounded-xl flex justify-center gap-2"
            >
              <Zap /> Generar Plan
            </button>
          )}

          {view === 'plan' && plan && (
            <div className="text-white space-y-4">
              <div>Total deuda: ${plan.summary.totalDebt.toLocaleString()}</div>
              <div>Meses: {plan.summary.monthsToPayoff}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
