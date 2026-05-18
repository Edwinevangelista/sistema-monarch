import { Component } from 'react'

// ──────────────────────────────────────────────────────────────
// ErrorBoundary — captura errores de JS en cualquier componente
// hijo y muestra un mensaje amigable en lugar de pantalla blanca.
//
// Uso:
//   <ErrorBoundary label="Análisis">
//     <SpendingInsights ... />
//   </ErrorBoundary>
// ──────────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Error desconocido' }
  }

  componentDidCatch(error, info) {
    // Silencioso en producción — no crashea el resto de la app
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', this.props.label, error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-2 py-6 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-semibold text-white/60 text-center">
            {this.props.label
              ? `${this.props.label} no pudo cargar`
              : 'Esta sección no pudo cargar'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            className="mt-1 px-4 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-white/80 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
