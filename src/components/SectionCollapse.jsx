import { useState, Suspense } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

function SectionSkeleton() {
  return (
    <div className="space-y-2 py-1">
      {[1, 2].map(i => (
        <div key={i} className="h-14 rounded-2xl bg-canvas-elevated animate-pulse" />
      ))}
    </div>
  )
}

export default function SectionCollapse({ title, icon, defaultOpen = false, badge, children, className = '', id }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className={`max-w-7xl mx-auto px-4 md:px-5 mt-6 ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-canvas-surface hover:bg-canvas-elevated active:bg-canvas-elevated border border-canvas-border rounded-card shadow-card transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="w-8 h-8 rounded-xl bg-canvas-elevated border border-canvas-border flex items-center justify-center text-base shrink-0">
              {icon}
            </span>
          )}
          <span className="text-sm font-black text-ink text-left tracking-wide">{title}</span>
          {badge != null && (
            <span className="ml-1 px-2 py-0.5 bg-accent-info/10 border border-accent-info/30 rounded-full text-accent-info text-[10px] font-black">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-accent-positive shrink-0" />
          : <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />
        }
      </button>
      {open && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <ErrorBoundary label={title}>
            <Suspense fallback={<SectionSkeleton />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  )
}
