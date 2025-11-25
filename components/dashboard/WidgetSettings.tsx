'use client';

import { useDashboardPreferences, type WidgetId } from '@/lib/hooks/useDashboardPreferences';
import {
  Calendar,
  CheckSquare,
  Heart,
  Briefcase,
  DollarSign,
  FileText,
  Package,
  Activity,
  TrendingUp,
  Star,
  Eye,
  EyeOff,
  RotateCcw,
  Minimize2,
  Maximize2,
} from 'lucide-react';

// Metadata de widgets
const WIDGET_META: Record<
  WidgetId,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  appointments: {
    label: 'Citas de hoy',
    icon: Calendar,
    description: 'Ver agenda del día',
  },
  tasks: {
    label: 'Tareas',
    icon: CheckSquare,
    description: 'Lista de tareas pendientes',
  },
  followUps: {
    label: 'Seguimientos',
    icon: Heart,
    description: 'Pacientes a seguir',
  },
  projects: {
    label: 'Proyectos',
    icon: Briefcase,
    description: 'Estado de proyectos',
  },
  finance: {
    label: 'Finanzas',
    icon: DollarSign,
    description: 'Resumen financiero',
  },
  reports: {
    label: 'Reportes',
    icon: FileText,
    description: 'Reportes pendientes',
  },
  stock: {
    label: 'Inventario',
    icon: Package,
    description: 'Alertas de stock',
  },
  activity: {
    label: 'Actividad',
    icon: Activity,
    description: 'Actividad reciente',
  },
  metrics: {
    label: 'Métricas',
    icon: TrendingUp,
    description: 'KPIs del sistema',
  },
  evaluations: {
    label: 'Evaluaciones',
    icon: Star,
    description: 'Evaluaciones recientes',
  },
};

interface WidgetSettingsProps {
  onClose?: () => void;
}

export function WidgetSettings({ onClose }: WidgetSettingsProps) {
  const {
    hiddenWidgets,
    compactMode,
    toggleWidget,
    showAllWidgets,
    toggleCompactMode,
    resetPreferences,
    isWidgetHidden,
  } = useDashboardPreferences();

  const allWidgets = Object.keys(WIDGET_META) as WidgetId[];
  const visibleCount = allWidgets.length - hiddenWidgets.length;

  return (
    <div className="surface-card p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Configurar Dashboard</h3>
          <p className="text-xs text-slate-500">
            Personaliza qué widgets quieres ver ({visibleCount}/{allWidgets.length} visibles)
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Modo Compacto */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {compactMode ? (
              <Minimize2 className="h-4 w-4 text-slate-600" />
            ) : (
              <Maximize2 className="h-4 w-4 text-slate-600" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">Modo Compacto</p>
              <p className="text-xs text-slate-500">Reduce el tamaño de los widgets</p>
            </div>
          </div>
          <button
            onClick={toggleCompactMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              compactMode ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                compactMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Lista de widgets */}
      <div className="mb-4 space-y-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Widgets visibles
        </p>
        {allWidgets.map((widgetId) => {
          const meta = WIDGET_META[widgetId];
          const Icon = meta.icon;
          const isHidden = isWidgetHidden(widgetId);

          return (
            <button
              key={widgetId}
              onClick={() => toggleWidget(widgetId)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-slate-300 hover:bg-slate-50 ${
                isHidden
                  ? 'border-slate-200 bg-white opacity-50'
                  : 'border-blue-200 bg-blue-50/50'
              }`}
            >
              {/* Checkbox visual */}
              <div
                className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                  isHidden
                    ? 'border-slate-300 bg-white'
                    : 'border-blue-600 bg-blue-600'
                }`}
              >
                {!isHidden && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Icon */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isHidden ? 'bg-slate-100' : 'bg-blue-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${isHidden ? 'text-slate-400' : 'text-blue-600'}`} />
              </div>

              {/* Info */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${isHidden ? 'text-slate-500' : 'text-slate-900'}`}
                >
                  {meta.label}
                </p>
                <p className="text-xs text-slate-400">{meta.description}</p>
              </div>

              {/* Eye icon */}
              {isHidden ? (
                <EyeOff className="h-4 w-4 text-slate-400" />
              ) : (
                <Eye className="h-4 w-4 text-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={showAllWidgets}
          disabled={hiddenWidgets.length === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="h-4 w-4" />
          Mostrar todos
        </button>
        <button
          onClick={resetPreferences}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Resetear
        </button>
      </div>
    </div>
  );
}
