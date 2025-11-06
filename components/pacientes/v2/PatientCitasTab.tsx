// components/pacientes/v2/PatientCitasTab.tsx
// Tab de gestión de citas

import { Cita } from '@/types/paciente-v2';
import { Calendar, Clock, User, MapPin, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientCitasTabProps {
  citas: Cita[];
  onVerDetalle: (citaId: string) => void;
  onNuevaCita: () => void;
}

export default function PatientCitasTab({ citas, onVerDetalle, onNuevaCita }: PatientCitasTabProps) {
  const citasOrdenadas = [...citas].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada':
        return 'bg-blue-100 text-blue-700';
      case 'confirmada':
        return 'bg-green-100 text-green-700';
      case 'realizada':
        return 'bg-gray-100 text-gray-700';
      case 'cancelada':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de nueva cita */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Historial de Citas</h3>
            <p className="text-sm text-gray-500 mt-1">Total: {citas.length} citas</p>
          </div>
          <button
            onClick={onNuevaCita}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="space-y-4">
        {citasOrdenadas.length > 0 ? (
          citasOrdenadas.map((cita) => (
            <div
              key={cita.id}
              onClick={() => onVerDetalle(cita.id)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                        cita.estado
                      )}`}
                    >
                      {cita.estado}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                      {cita.tipo}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{format(cita.fecha, "EEEE, d 'de' MMMM yyyy", { locale: es })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {cita.horaInicio} - {cita.horaFin}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{cita.profesionalNombre}</span>
                    </div>

                    {cita.sala && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{cita.sala}</span>
                      </div>
                    )}
                  </div>

                  {cita.servicioNombre && (
                    <p className="text-sm font-medium text-gray-900 mt-2">{cita.servicioNombre}</p>
                  )}

                  {cita.observaciones && (
                    <p className="text-sm text-gray-600 mt-2">{cita.observaciones}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay citas registradas</p>
            <button
              onClick={onNuevaCita}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Programar primera cita
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
