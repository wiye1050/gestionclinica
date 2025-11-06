'use client';

import { useMemo } from 'react';
import { 
  Calendar, 
  FileText, 
  Pill, 
  CheckCircle,
  Clock,
  User,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type ActivityType = 
  | 'cita'
  | 'documento'
  | 'receta'
  | 'tratamiento'
  | 'nota'
  | 'factura'
  | 'pago';

export interface Activity {
  id: string;
  tipo: ActivityType;
  titulo: string;
  descripcion?: string;
  fecha: Date;
  usuario?: string;
  estado?: 'success' | 'warning' | 'error' | 'info';
}

interface PatientTimelineProps {
  actividades: Activity[];
  maxItems?: number;
}

export default function PatientTimeline({ actividades, maxItems = 10 }: PatientTimelineProps) {
  const actividadesRecientes = useMemo(() => {
    return actividades
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, maxItems);
  }, [actividades, maxItems]);

  const getIcon = (tipo: ActivityType) => {
    switch (tipo) {
      case 'cita':
        return <Calendar className="w-4 h-4" />;
      case 'documento':
        return <FileText className="w-4 h-4" />;
      case 'receta':
        return <Pill className="w-4 h-4" />;
      case 'tratamiento':
        return <CheckCircle className="w-4 h-4" />;
      case 'nota':
        return <FileText className="w-4 h-4" />;
      case 'factura':
        return <DollarSign className="w-4 h-4" />;
      case 'pago':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getColor = (tipo: ActivityType, estado?: Activity['estado']) => {
    if (estado === 'error') return 'bg-danger-bg text-danger border-danger';
    if (estado === 'warning') return 'bg-warn-bg text-warn border-warn';
    if (estado === 'success') return 'bg-success-bg text-success border-success';

    switch (tipo) {
      case 'cita':
        return 'bg-brand-subtle text-brand border-brand/50';
      case 'documento':
        return 'bg-muted text-text border-border';
      case 'receta':
        return 'bg-success-bg text-success border-success/50';
      case 'tratamiento':
        return 'bg-brand-subtle text-brand border-brand/40';
      case 'factura':
      case 'pago':
        return 'bg-success-bg text-success border-success/40';
      default:
        return 'bg-muted text-text-muted border-border';
    }
  };

  const getRelativeTime = (fecha: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - fecha.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return format(fecha, 'd MMM', { locale: es });
  };

  if (actividadesRecientes.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="mb-4 text-lg font-semibold text-text">Actividad reciente</h3>
        <div className="py-8 text-center text-sm text-text-muted">
          <Clock className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          No hay actividad reciente
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-lg font-semibold text-text">Actividad reciente</h3>
      
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {/* Actividades */}
        <div className="space-y-4">
          {actividadesRecientes.map((actividad) => (
            <div key={actividad.id} className="relative flex gap-3 pl-10">
              {/* Icono */}
              <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border ${getColor(actividad.tipo, actividad.estado)}`}>
                {getIcon(actividad.tipo)}
              </div>

              {/* Contenido */}
              <div className="flex-1 pb-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-text">
                    {actividad.titulo}
                  </p>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {getRelativeTime(actividad.fecha)}
                  </span>
                </div>

                {actividad.descripcion && (
                  <p className="mb-1 text-sm text-text-muted">
                    {actividad.descripcion}
                  </p>
                )}

                {actividad.usuario && (
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <User className="w-3 h-3" />
                    <span>{actividad.usuario}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {actividades.length > maxItems && (
        <button className="mt-4 w-full text-sm font-semibold text-brand hover:underline">
          Ver toda la actividad ({actividades.length})
        </button>
      )}
    </div>
  );
}
