import { useMemo } from 'react';
import { Calendar, TrendingDown, CheckCircle2 } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for today in local time */
function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2:30pm" format from a fecha string like "2025-05-17T14:30:00" or "2025-05-17 14:30:00" */
function formatHora12(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha.includes('T') ? fecha : fecha.replace(' ', 'T'));
  if (isNaN(date.getTime())) return '';
  let h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${min}${ampm}`;
}

/** Progress-bar color based on percentage */
function barColor(pct) {
  if (pct < 60) return 'bg-accent-positive';
  if (pct < 85) return 'bg-accent-warning';
  return 'bg-accent-negative';
}

/** Ring stroke color based on percentage */
function ringColor(pct) {
  if (pct < 60) return '#34D399'; // accent-positive
  if (pct < 85) return '#FBBF24'; // accent-warning
  return '#F87171';               // accent-negative
}

// ─── SVG Ring ───────────────────────────────────────────────────────────────

function BudgetRing({ pct }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  // Cap visual fill at 100%
  const filled = Math.min(pct, 100);
  const strokeDashoffset = circumference - (filled / 100) * circumference;
  const color = ringColor(pct);

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      {/* Track */}
      <circle
        cx="40" cy="40" r={radius}
        fill="none"
        stroke="#262B36"
        strokeWidth="8"
      />
      {/* Progress arc — starts at top (−90°) */}
      <circle
        cx="40" cy="40" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Center label */}
      <text
        x="40" y="44"
        textAnchor="middle"
        fill="#F5F6F8"
        fontSize="13"
        fontWeight="700"
        fontFamily="inherit"
      >
        {Math.round(filled)}%
      </text>
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DailySnapshot({ gastos = [], dailyBudget = 0 }) {
  const today = getTodayString();

  // Filter and sort today's expenses internally
  const gastosHoy = useMemo(() => {
    return gastos
      .filter((g) => {
        if (!g.fecha) return false;
        // Support "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD HH:mm:ss"
        return g.fecha.slice(0, 10) === today;
      })
      .sort((a, b) => {
        // Desc by time (most recent first)
        const dateA = new Date(a.fecha.includes('T') ? a.fecha : a.fecha.replace(' ', 'T'));
        const dateB = new Date(b.fecha.includes('T') ? b.fecha : b.fecha.replace(' ', 'T'));
        return dateB - dateA;
      });
  }, [gastos, today]);

  const totalHoy = useMemo(
    () => gastosHoy.reduce((sum, g) => sum + Math.abs(Number(g.monto) || 0), 0),
    [gastosHoy]
  );

  const pct = dailyBudget > 0 ? Math.round((totalHoy / dailyBudget) * 100) : 0;
  const showRing = dailyBudget > 0;
  const top3 = gastosHoy.slice(0, 3);

  // Header date string: "Hoy, lunes 17 de mayo"
  const headerDate = (() => {
    const now = new Date();
    const diaSemana = now.toLocaleDateString('es-ES', { weekday: 'long' });
    const dia = now.getDate();
    const mes = now.toLocaleDateString('es-ES', { month: 'long' });
    return `${diaSemana} ${dia} de ${mes}`;
  })();

  return (
    <div
      className="rounded-2xl border border-base-border bg-base-surface p-4 space-y-4 shadow-card"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-accent-info shrink-0" />
        <span className="text-sm font-black text-ink capitalize">
          Hoy, {headerDate}
        </span>
      </div>

      {/* ── Budget section (only when dailyBudget > 0) ── */}
      {showRing && (
        <div className="flex items-center gap-4">
          {/* Ring */}
          <BudgetRing pct={pct} />

          {/* Text + progress bar */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-xs text-accent-positive font-black uppercase tracking-wide">
              Gastaste hoy
            </p>
            <p className="text-ink font-black text-lg leading-none">
              ${totalHoy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-ink-muted font-semibold text-sm ml-1">
                / ${dailyBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/día
              </span>
            </p>

            {/* Progress bar */}
            <div className="w-full bg-base-elevated rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${barColor(pct)}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>

            <p className="text-xs text-ink-muted">
              {pct}% del presupuesto diario
            </p>
          </div>
        </div>
      )}

      {/* ── Separator ── */}
      <div className="border-t border-base-border" />

      {/* ── Recent movements ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-ink-muted" />
          <p className="text-xs font-black text-ink-muted uppercase tracking-wide">
            Últimos movimientos hoy
          </p>
        </div>

        {gastosHoy.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <CheckCircle2 className="w-7 h-7 text-accent-positive" />
            <p className="text-sm text-accent-positive font-bold text-center">
              ¡Día en blanco! Sigue así 🎯
            </p>
          </div>
        ) : (
          <>
            {top3.map((g, i) => {
              // Extract emoji + category name from "🍔 Comida" pattern
              const partes = (g.categoria || 'Sin categoría').split(' ');
              const emoji = partes[0] && /\p{Emoji}/u.test(partes[0]) ? partes[0] : '💸';
              const nombre = /\p{Emoji}/u.test(partes[0]) ? partes.slice(1).join(' ') : g.categoria;
              const hora = formatHora12(g.fecha);
              const monto = Math.abs(Number(g.monto) || 0);

              return (
                <div
                  key={g.id ?? i}
                  className="flex items-center gap-3 py-1.5"
                >
                  <span className="text-base leading-none w-5 text-center shrink-0">{emoji}</span>
                  <span className="flex-1 text-sm text-ink-muted truncate">{nombre}</span>
                  <span className="text-sm font-bold text-accent-negative shrink-0">
                    -${monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {hora && (
                    <span className="text-xs text-ink-faint shrink-0 w-14 text-right">{hora}</span>
                  )}
                </div>
              );
            })}

            {/* Divider when fewer than 3 more exist */}
            {gastosHoy.length <= 3 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-base-border" />
                <span className="text-xs text-ink-faint shrink-0">Sin más movimientos hoy</span>
                <div className="flex-1 border-t border-base-border" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
