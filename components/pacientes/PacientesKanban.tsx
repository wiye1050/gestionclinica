'use client';

import { Paciente, Profesional } from '@/types';
import { User, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PacientesKanbanProps {
  pacientes: Paciente[];
  profesionales: Profesional[];
  pacientesSeguimiento: Set<string>;
}

const COLUMNAS = [
  { estado: 'activo', titulo: 'Activos', color: 'bg-green-100 border-green-300' },
  { estado: 'inactivo', titulo: 'Inactivos', color: 'bg-gray-100 border-gray-300' },
  { estado: 'egresado', titulo: 'Egresados', color: 'bg-blue-100 border-blue-300' },
];

const COLORES_RIESGO = {
  alto: 'border-l-4 border-l-red-500',
  medio: 'border-l-4 border-l-yellow-500',
  bajo: 'border-l-4 border-l-green-500',
};

export default function PacientesKanban({ pacientes, profesionales, pacientesSeguimiento }: PacientesKanbanProps) {
  const pacientesPorEstado = (estado: string) =>
    pacientes.filter((p) => p.estado === estado);

  const profesionalesMap = profesionales.reduce<Record<string, string>>((acc, prof) => {
    acc[prof.id] = `${prof.nombre} ${prof.apellidos}`;
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-400px)]">
      {COLUMNAS.map((columna) => {
        const pacientesColumna = pacientesPorEstado(columna.estado);
        
        return (
          <div
            key={columna.estado}
            className="flex-shrink-0 w-80 flex flex-col"
          >
            {/* Header de columna */}
            <div className={`p-3 rounded-t-lg border-2 ${columna.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  {columna.titulo}
                </h3>
                <span className="bg-white px-2 py-1 rounded-full text-xs font-medium">
                  {pacientesColumna.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-lg p-2 space-y-2 overflow-y-auto">
              {pacientesColumna.map((paciente) => {
                const requiereSeguimiento = pacientesSeguimiento.has(paciente.id);
                const riesgoClass = paciente.riesgo ? COLORES_RIESGO[paciente.riesgo] : '';
                
                return (
                  <Link
                    key={paciente.id}
                    href={`/dashboard/pacientes/${paciente.id}`}
                    className={`
                      bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer block
                      ${riesgoClass}
                    `}
                  >
                    {/* Nombre */}
                    <div className="mb-2">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                        {paciente.nombre} {paciente.apellidos}
                      </h4>
                      {paciente.documentoId && (
                        <p className="text-xs text-gray-500">{paciente.documentoId}</p>
                      )}
                    </div>

                    {/* Riesgo */}
                    {paciente.riesgo && (
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded mb-2 ${
                          paciente.riesgo === 'alto' ? 'bg-red-100 text-red-700' :
                          paciente.riesgo === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}
                      >
                        Riesgo {paciente.riesgo}
                      </span>
                    )}

                    {/* Seguimiento */}
                    {requiereSeguimiento && (
                      <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>Seguimiento pendiente</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {paciente.profesionalReferenteId && (
                        <div className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {profesionalesMap[paciente.profesionalReferenteId] || 'Sin asignar'}
                          </span>
                        </div>
                      )}
                      {paciente.telefono && (
                        <span className="text-xs">{paciente.telefono}</span>
                      )}
                    </div>
                  </Link>
                );
              })}

              {pacientesColumna.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay pacientes {columna.titulo.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
