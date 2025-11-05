// components/pacientes/v2/PatientTimeline.tsx
// Línea de tiempo de actividades recientes

import { Actividad } from '@/types/paciente-v2';
import { Calendar, Activity, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientTimelineProps {
  actividades: Actividad[];
  maxItems?: number;
}

export default function PatientTimeline({ actividades, maxItems = 5 }: PatientTimelineProps) {
  const actividadesRecientes = actividades.slice(0, maxItems);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar':
        return <Calendar className="w-4 h-4" />;
      case 'Activity':
        return <Activity className="w-4 h-4" />;
      case 'MessageSquare':
        return <MessageSquare className="w-4 h-4" />;
      case 'AlertCircle':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (actividadesRecientes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        <p className="text-sm text-gray-500 text-center py-8">No hay actividades registradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h3>

      <div className="space-y-4">
        {actividadesRecientes.map((actividad, index) => (
          <div key={actividad.id} className="flex gap-3">
            {/* Línea vertical */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColorClasses(actividad.color)}`}>
                {getIcon(actividad.icono)}
              </div>
              {index < actividadesRecientes.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 pb-4">
              <p className="text-sm text-gray-900">{actividad.descripcion}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{format(actividad.fecha, "d 'de' MMMM, yyyy", { locale: es })}</span>
                <span>•</span>
                <span>{formatDistanceToNow(actividad.fecha, { addSuffix: true, locale: es })}</span>
                {actividad.profesionalNombre && (
                  <>
                    <span>•</span>
                    <span>{actividad.profesionalNombre}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {actividades.length > maxItems && (
        <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas las actividades ({actividades.length})
        </button>
      )}
    </div>
  );
}
