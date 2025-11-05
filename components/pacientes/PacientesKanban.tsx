'use client';

import { Paciente, Profesional } from '@/types';
import { User, Calendar } from 'lucide-react';
import Link from 'next/link';

interface PacientesKanbanProps {
  pacientes: Paciente[];
  profesionales: Profesional[];
  pacientesSeguimiento: Set<string>;
}

const COLUMNAS = [
  { estado: 'activo', titulo: 'Activos', headerClass: 'border border-success bg-success-bg text-success' },
  { estado: 'inactivo', titulo: 'Inactivos', headerClass: 'border border-border bg-cardHover text-text-muted' },
  { estado: 'egresado', titulo: 'Egresados', headerClass: 'border border-brand bg-brand-subtle text-brand' },
];

const COLORES_RIESGO = {
  alto: 'border-l-4 border-l-danger',
  medio: 'border-l-4 border-l-warn',
  bajo: 'border-l-4 border-l-success',
};

export default function PacientesKanban({ pacientes, profesionales, pacientesSeguimiento }: PacientesKanbanProps) {
  const pacientesPorEstado = (estado: string) =>
    pacientes.filter((p) => p.estado === estado);

  const profesionalesMap = profesionales.reduce<Record<string, string>>((acc, prof) => {
    acc[prof.id] = `${prof.nombre} ${prof.apellidos}`;
    return acc;
  }, {});

  return (
    <div className="flex h-[calc(100vh-400px)] gap-4 overflow-x-auto pb-4">
      {COLUMNAS.map((columna) => {
        const pacientesColumna = pacientesPorEstado(columna.estado);
        
        return (
          <div
            key={columna.estado}
            className="flex-shrink-0 w-80 flex flex-col"
          >
            {/* Header de columna */}
            <div className={`rounded-t-2xl px-3 py-3 ${columna.headerClass}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text">
                  {columna.titulo}
                </h3>
                <span className="rounded-full bg-card px-2 py-1 text-xs font-medium text-text">
                  {pacientesColumna.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto rounded-b-2xl border border-border border-t-0 bg-cardHover p-2">
              {pacientesColumna.map((paciente) => {
                const requiereSeguimiento = pacientesSeguimiento.has(paciente.id);
                const riesgoClass = paciente.riesgo ? COLORES_RIESGO[paciente.riesgo] : '';
                
                return (
                  <Link
                    key={paciente.id}
                    href={`/dashboard/pacientes/${paciente.id}`}
                    className={`block rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md ${riesgoClass}`}
                  >
                    {/* Nombre */}
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-text line-clamp-1">
                        {paciente.nombre} {paciente.apellidos}
                      </h4>
                      {paciente.documentoId && (
                        <p className="text-xs text-text-muted">{paciente.documentoId}</p>
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
                    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-text-muted">
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
                <div className="text-center py-8 text-text-muted text-sm">
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
