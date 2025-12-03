'use client';

import { EstadisticasProyectos } from '@/types/proyectos';
import { TrendingUp, CheckCircle, FolderKanban, AlertCircle, Clock, XCircle } from 'lucide-react';
import { KPIGrid } from '@/components/shared/KPIGrid';

interface KPIsProyectosProps {
  estadisticas: EstadisticasProyectos;
}

export default function KPIsProyectos({ estadisticas }: KPIsProyectosProps) {
  const total =
    estadisticas.porEstado.propuesta +
    estadisticas.porEstado.planificacion +
    estadisticas.porEstado['en-curso'] +
    estadisticas.porEstado.pausado +
    estadisticas.porEstado.completado +
    estadisticas.porEstado.cancelado;

  const porcentajeCompletado = total > 0
    ? Math.round((estadisticas.porEstado.completado / total) * 100)
    : 0;

  const estadoItems = [
    {
      label: 'En Curso',
      value: estadisticas.porEstado['en-curso'],
      icon: TrendingUp,
      accent: 'brand' as const,
      helper: 'Proyectos activos',
    },
    {
      label: 'Completados',
      value: estadisticas.porEstado.completado,
      icon: CheckCircle,
      accent: 'success' as const,
      helper: `${porcentajeCompletado}% del total`,
    },
    {
      label: 'En Planificación',
      value: estadisticas.porEstado.planificacion,
      icon: Clock,
      accent: 'purple' as const,
      helper: 'Próximos a iniciar',
    },
    {
      label: 'Pausados',
      value: estadisticas.porEstado.pausado,
      icon: AlertCircle,
      accent: 'warn' as const,
      helper: 'Requieren atención',
    },
    {
      label: 'Propuestas',
      value: estadisticas.porEstado.propuesta,
      icon: FolderKanban,
      accent: 'gray' as const,
      helper: 'En evaluación',
    },
    {
      label: 'Cancelados',
      value: estadisticas.porEstado.cancelado,
      icon: XCircle,
      accent: 'danger' as const,
      helper: 'Archivados',
    },
  ];

  const tipoItems = [
    { label: 'Desarrollo', value: estadisticas.porTipo.desarrollo, accent: 'brand' as const },
    { label: 'Operacional', value: estadisticas.porTipo.operacional, accent: 'success' as const },
    { label: 'Investigación', value: estadisticas.porTipo.investigacion, accent: 'purple' as const },
    { label: 'Marketing', value: estadisticas.porTipo.marketing, accent: 'warn' as const },
    { label: 'Mejora', value: estadisticas.porTipo.mejora, accent: 'brand' as const },
    { label: 'Infraestructura', value: estadisticas.porTipo.infraestructura, accent: 'gray' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Distribución por Estado
        </h3>
        <KPIGrid items={estadoItems} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Distribución por Tipo
        </h3>
        <KPIGrid items={tipoItems} />
      </div>
    </div>
  );
}
