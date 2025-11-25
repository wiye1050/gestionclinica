/**
 * Skeleton loaders específicos para cada tipo de widget del dashboard
 * Imitan la estructura real de cada widget para mejor UX durante la carga
 */

// Skeleton genérico (usado como fallback)
export function WidgetSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
          <div>
            <div className="mb-1 h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

// Skeleton para AppointmentsWidget
export function AppointmentsSkeleton() {
  return (
    <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-blue-200" />
          <div>
            <div className="mb-1 h-3 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-7 w-8 animate-pulse rounded-lg bg-blue-100" />
      </div>
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="h-2 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-2 w-8 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="space-y-1.5">
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

// Skeleton para TasksWidget
export function TasksSkeleton() {
  return (
    <div className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-violet-200" />
          <div>
            <div className="mb-1 h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-7 w-8 animate-pulse rounded-lg bg-violet-100" />
      </div>
      <div className="space-y-1.5">
        <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

// Skeleton compacto para widgets pequeños (Seguimientos, Proyectos, etc.)
export function CompactWidgetSkeleton({ borderColor = 'border-slate-200', iconBg = 'bg-slate-200' }: { borderColor?: string; iconBg?: string }) {
  return (
    <div className={`rounded-lg border ${borderColor} bg-white p-3 shadow-sm`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`h-7 w-7 animate-pulse rounded-lg ${iconBg}`} />
          <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-6 w-6 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="space-y-1">
        <div className="h-8 animate-pulse rounded bg-slate-100" />
        <div className="h-8 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

// Skeleton para FinanceWidget
export function FinanceSkeleton() {
  return (
    <div className="rounded-lg border border-purple-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-purple-200" />
          <div>
            <div className="mb-1 h-3 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-12 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-4 w-4 animate-pulse rounded bg-purple-100" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-2 w-12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
        <div className="mb-1 flex items-center justify-between">
          <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
          <div className="h-2 w-8 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-1 w-full animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

// Skeleton para MetricsWidget
export function MetricsSkeleton() {
  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-indigo-200" />
        <div>
          <div className="mb-1 h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-2 w-20 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="mb-1 h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="mx-auto h-2 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para EvaluationsWidget
export function EvaluationsSkeleton() {
  return (
    <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-teal-200" />
          <div>
            <div className="mb-1 h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-8 w-12 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

// Skeleton para ActivityWidget
export function ActivitySkeleton() {
  return (
    <div className="rounded-lg border border-cyan-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-7 w-7 animate-pulse rounded-lg bg-cyan-200" />
        <div>
          <div className="mb-1 h-3 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-2 w-12 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
