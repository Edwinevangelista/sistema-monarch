// ============================================================
// QUICK ADD BAR
// Barra de acceso rápido para registrar gastos e ingresos
// en 2 taps, sin abrir modal completo.
// Props: onAddGasto({ monto, categoria, fecha, descripcion })
//        onAddIngreso({ monto, descripcion, fecha })
// ============================================================
import { useState, useRef, useEffect } from 'react';

const CATEGORIAS_GASTO = [
  { emoji: '🍔', label: 'Comida' },
  { emoji: '🚗', label: 'Transporte' },
  { emoji: '🛒', label: 'Super' },
  { emoji: '⚡', label: 'Servicios' },
  { emoji: '🎬', label: 'Ocio' },
  { emoji: '📦', label: 'Otro' },
];

// Extrae el número puro del string formateado
function parseMonto(display) {
  return parseFloat(display.replace(/[^0-9.]/g, '')) || 0;
}

function fechaLocalISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

function createIdempotencyKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `quick-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function QuickAddBar({ onAddGasto, onAddIngreso }) {
  // 'none' | 'gasto' | 'ingreso'
  const [modo, setModo] = useState('none');
  const [montoDisplay, setMontoDisplay] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const montoRef = useRef(null);
  const saving = useRef(false); // guard contra doble-submit
  const idempotencyKeyRef = useRef(createIdempotencyKey());

  // Autofocus al monto cuando se expande el form
  useEffect(() => {
    if (modo !== 'none') {
      setTimeout(() => montoRef.current?.focus(), 80);
    }
  }, [modo]);

  // Resetear estado interno al cerrar
  function cerrar() {
    setModo('none');
    setMontoDisplay('');
    setCategoriaSeleccionada(null);
    setDescripcion('');
    setGuardando(false);
    saving.current = false;
    idempotencyKeyRef.current = createIdempotencyKey();
  }

  function abrirModo(nuevoModo) {
    if (modo === nuevoModo) {
      cerrar();
      return;
    }
    // Si cambia de modo: resetea sin animación de cierre
    setMontoDisplay('');
    setCategoriaSeleccionada(null);
    setDescripcion('');
    setGuardando(false);
    saving.current = false;
    idempotencyKeyRef.current = createIdempotencyKey();
    setModo(nuevoModo);
  }

  function handleMontoChange(e) {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    // Evitar múltiples puntos decimales
    const parts = raw.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
    setMontoDisplay(sanitized ? `$${sanitized}` : '');
  }

  async function handleGuardarGasto() {
    if (saving.current) return;
    const monto = parseMonto(montoDisplay);
    if (!monto || monto <= 0) {
      montoRef.current?.focus();
      return;
    }
    const categoria = categoriaSeleccionada
      ? `${categoriaSeleccionada.emoji} ${categoriaSeleccionada.label}`
      : '📦 Otro';

    saving.current = true;
    setGuardando(true);
    try {
      await onAddGasto?.({
        monto: Number(monto.toFixed(2)),
        categoria,
        fecha: fechaLocalISO(),
        descripcion: categoria,
        idempotency_key: idempotencyKeyRef.current,
      });
      cerrar();
    } catch {
      saving.current = false;
      setGuardando(false);
    }
  }

  async function handleGuardarIngreso() {
    if (saving.current) return;
    const monto = parseMonto(montoDisplay);
    if (!monto || monto <= 0) {
      montoRef.current?.focus();
      return;
    }

    saving.current = true;
    setGuardando(true);
    try {
      await onAddIngreso?.({
        monto: Number(monto.toFixed(2)),
        descripcion: descripcion.trim() || 'Ingreso',
        fecha: fechaLocalISO(),
      });
      cerrar();
    } catch {
      saving.current = false;
      setGuardando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (modo === 'gasto') handleGuardarGasto();
      else if (modo === 'ingreso') handleGuardarIngreso();
    }
    if (e.key === 'Escape') cerrar();
  }

  const expandido = modo !== 'none';

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: '#12151C',
        border: '1px solid #262B36',
        boxShadow: '0 14px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Fila de botones principales ── */}
      <div className="grid grid-cols-2 gap-0">
        <button
          onClick={() => abrirModo('gasto')}
          className={`flex items-center justify-center gap-2 font-bold text-base transition-all duration-200 select-none
            ${modo === 'gasto'
              ? 'bg-accent-negative text-canvas'
              : 'text-accent-negative hover:bg-accent-negative/10 active:bg-accent-negative/15'
            }`}
          style={{ minHeight: '52px' }}
          aria-expanded={modo === 'gasto'}
          aria-label="Agregar gasto rápido"
        >
          <span className="text-xl leading-none">＋</span>
          <span>Gasto</span>
        </button>

        <button
          onClick={() => abrirModo('ingreso')}
          className={`flex items-center justify-center gap-2 font-bold text-base transition-all duration-200 select-none
            border-l border-canvas-border
            ${modo === 'ingreso'
              ? 'bg-accent-positive text-canvas'
              : 'text-accent-positive hover:bg-accent-positive/10 active:bg-accent-positive/15'
            }`}
          style={{ minHeight: '52px' }}
          aria-expanded={modo === 'ingreso'}
          aria-label="Agregar ingreso rápido"
        >
          <span className="text-xl leading-none">＋</span>
          <span>Ingreso</span>
        </button>
      </div>

      {/* ── Form expandible ── */}
      <div
        style={{
          maxHeight: expandido ? '420px' : '0px',
          opacity: expandido ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
          overflow: 'hidden',
        }}
        aria-hidden={!expandido}
      >
        <div
          className="border-t"
          style={{ borderColor: '#262B36' }}
        >
          <div className="p-4 space-y-3">

            {/* Header del form con botón X */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold uppercase tracking-wide ${modo === 'gasto' ? 'text-accent-negative' : 'text-accent-positive'}`}>
                {modo === 'gasto' ? 'Registrar gasto' : 'Registrar ingreso'}
              </span>
              <button
                onClick={cerrar}
                className="w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-canvas-elevated transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Input de monto */}
            <div className="relative">
              <input
                ref={montoRef}
                type="text"
                inputMode="decimal"
                value={montoDisplay}
                onChange={handleMontoChange}
                onKeyDown={handleKeyDown}
                placeholder="$0.00"
                disabled={guardando}
                className={`w-full bg-canvas-elevated border rounded-xl px-4 py-3 text-ink text-2xl font-bold
                  placeholder-ink-faint outline-none transition-colors
                  ${modo === 'gasto'
                  ? 'border-accent-negative/40 focus:border-accent-negative focus:ring-2 focus:ring-accent-negative/15'
                    : 'border-accent-positive/40 focus:border-accent-positive focus:ring-2 focus:ring-accent-positive/15'
                  }
                  disabled:opacity-50`}
                aria-label="Monto"
              />
            </div>

            {/* Categorías rápidas — solo para gastos */}
            {modo === 'gasto' && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIAS_GASTO.map((cat) => {
                  const activa = categoriaSeleccionada?.label === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setCategoriaSeleccionada(activa ? null : cat)}
                      disabled={guardando}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium
                        transition-all duration-150 select-none
                        ${activa
                          ? 'bg-accent-negative text-canvas'
                          : 'bg-canvas-elevated text-ink-muted hover:bg-canvas-border active:bg-canvas-border'
                        }
                        disabled:opacity-50`}
                      style={{ minWidth: '56px', minHeight: '48px' }}
                      aria-pressed={activa}
                      aria-label={cat.label}
                    >
                      <span className="text-lg leading-none">{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Descripción — solo para ingresos */}
            {modo === 'ingreso' && (
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descripción (ej. Sueldo, Freelance…)"
                disabled={guardando}
                className="w-full bg-canvas-elevated border border-accent-positive/40 focus:border-accent-positive
                  rounded-xl px-4 py-3 text-ink text-sm placeholder-ink-faint
                  outline-none transition-colors disabled:opacity-50"
                aria-label="Descripción del ingreso"
              />
            )}

            {/* Botón Guardar */}
            <button
              onClick={modo === 'gasto' ? handleGuardarGasto : handleGuardarIngreso}
              disabled={guardando || !parseMonto(montoDisplay)}
              className={`w-full py-3 rounded-xl font-bold text-base text-white transition-all duration-150
                flex items-center justify-center gap-2 select-none
                ${modo === 'gasto'
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-300'
                }
                disabled:cursor-not-allowed`}
              style={{ minHeight: '48px' }}
            >
              {guardando ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
                  </svg>
                  Guardando…
                </>
              ) : (
                <>
                  ✓ Guardar {modo === 'gasto' ? 'gasto' : 'ingreso'}
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
