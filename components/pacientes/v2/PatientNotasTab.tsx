// components/pacientes/v2/PatientNotasTab.tsx
// Tab de gestión de notas

import { Nota } from '@/types/paciente-v2';
import { MessageSquare, Plus, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientNotasTabProps {
  notas: Nota[];
  onNuevaNota: () => void;
  onEditarNota: (notaId: string) => void;
}

export default function PatientNotasTab({ notas, onNuevaNota, onEditarNota }: PatientNotasTabProps) {
  const notasOrdenadas = [...notas].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'clinica':
        return 'bg-blue-100 text-blue-700';
      case 'administrativa':
        return 'bg-purple-100 text-purple-700';
      case 'seguimiento':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Notas del Paciente</h3>
            <p className="text-sm text-gray-500 mt-1">Total: {notas.length} notas</p>
          </div>
          <button
            onClick={onNuevaNota}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Nota
          </button>
        </div>
      </div>

      {/* Lista de notas */}
      <div className="space-y-4">
        {notasOrdenadas.length > 0 ? (
          notasOrdenadas.map((nota) => (
            <div
              key={nota.id}
              onClick={() => onEditarNota(nota.id)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(nota.tipo)}`}>
                    {nota.tipo}
                  </span>
                  {nota.importante && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-xs font-medium">Importante</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {format(nota.fecha, "d 'de' MMM yyyy, HH:mm", { locale: es })}
                </div>
              </div>

              <h4 className="font-medium text-gray-900 mb-2">{nota.titulo}</h4>

              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{nota.contenido}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MessageSquare className="w-3 h-3" />
                <span>Por: {nota.profesionalNombre}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay notas registradas</p>
            <button
              onClick={onNuevaNota}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Crear primera nota
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
