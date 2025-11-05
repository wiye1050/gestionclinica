export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`} />
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse">
      <div className="mb-4 h-4 w-1/4 rounded-xl bg-cardHover" />
      <div className="space-y-3">
        <div className="h-3 rounded-xl bg-cardHover" />
        <div className="h-3 w-5/6 rounded-xl bg-cardHover" />
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm animate-pulse">
      <div className="h-12 border-b border-border bg-cardHover" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex h-16 items-center gap-4 border-b border-border px-6">
          <div className="h-8 w-1/4 rounded-xl bg-cardHover" />
          <div className="h-8 w-1/3 rounded-xl bg-cardHover" />
          <div className="h-8 w-1/6 rounded-xl bg-cardHover" />
        </div>
      ))}
    </div>
  );
}

export function LoadingOverlay({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-5 shadow-lg">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-text">{message}</p>
      </div>
    </div>
  );
}

// Componente por defecto para imports simples
export default function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-text-muted">Cargando...</p>
      </div>
    </div>
  );
}
