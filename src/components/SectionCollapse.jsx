import { useState, Suspense } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

function SectionSkeleton() {
  return (
    <div className="space-y-2 py-1">
      {[1, 2].map(i => (
        <div key={i} className="h-14 rounded-2xl bg-white/[0.03] animate-pulse" />
      ))}
    </div>
  )
}

export default function SectionCollapse({ title, icon, defaultOpen = false, badge, children, className = '' }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-5 mt-6 ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.08] border border-white/[0.07] rounded-2xl transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-base shrink-0 opacity-80">{icon}</span>}
          <span className="text-sm font-semibold text-white/70 text-left tracking-wide">{title}</span>
          {badge != null && (
            <span className="ml-1 px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/20 rounded-full text-indigo-300/80 text-[10px] font-semibold">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-white/25 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/25 shrink-0" />
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
