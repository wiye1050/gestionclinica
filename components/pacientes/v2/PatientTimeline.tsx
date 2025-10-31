'use client';

import { useMemo } from 'react';
import { 
  Calendar, 
  FileText, 
  Pill, 
  CheckCircle, 
  XCircle,
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
    if (estado === 'error') return 'bg-red-100 text-red-600 border-red-200';
    if (estado === 'warning') return 'bg-yellow-100 text-yellow-600 border-yellow-200';
    if (estado === 'success') return 'bg-green-100 text-green-600 border-green-200';

    switch (tipo) {
      case 'cita':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'documento':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'receta':
        return 'bg-pink-100 text-pink-600 border-pink-200';
      case 'tratamiento':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'factura':
      case 'pago':
        return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No hay actividad reciente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
      
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

        {/* Actividades */}
        <div className="space-y-4">
          {actividadesRecientes.map((actividad, index) => (
            <div key={actividad.id} className="relative flex gap-3 pl-10">
              {/* Icono */}
              <div className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getColor(actividad.tipo, actividad.estado)}`}>
                {getIcon(actividad.tipo)}
              </div>

              {/* Contenido */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {actividad.titulo}
                  </p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {getRelativeTime(actividad.fecha)}
                  </span>
                </div>

                {actividad.descripcion && (
                  <p className="text-sm text-gray-600 mb-1">
                    {actividad.descripcion}
                  </p>
                )}

                {actividad.usuario && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
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
        <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver toda la actividad ({actividades.length})
        </button>
      )}
    </div>
  );
}
