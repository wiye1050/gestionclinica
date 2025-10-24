'use client';

import Link from 'next/link';
import { Paciente, Profesional } from '@/types';
import { useMemo } from 'react';

interface PacientesTableProps {
  pacientes: Paciente[];
  profesionales: Profesional[];
  pacientesSeguimiento: Set<string>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  estadoFilter: string;
  onEstadoFilterChange: (value: string) => void;
  riesgoFilter: string;
  onRiesgoFilterChange: (value: string) => void;
  followUpOnly: boolean;
  onFollowUpOnlyChange: (value: boolean) => void;
  profesionalFilter: string;
  onProfesionalFilterChange: (value: string) => void;
  loading: boolean;
  error?: string | null;
}

const estadoLabels: Record<string, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  egresado: 'Egresado'
};

const riesgoColors: Record<string, string> = {
  alto: 'bg-red-100 text-red-700',
  medio: 'bg-yellow-100 text-yellow-700',
  bajo: 'bg-green-100 text-green-700'
};

export function PacientesTable({
  pacientes,
  profesionales,
  pacientesSeguimiento,
  searchTerm,
  onSearchChange,
  estadoFilter,
  onEstadoFilterChange,
  riesgoFilter,
  onRiesgoFilterChange,
  followUpOnly,
  onFollowUpOnlyChange,
  profesionalFilter,
  onProfesionalFilterChange,
  loading,
  error
}: PacientesTableProps) {
  const profesionalesMap = useMemo(
    () =>
      profesionales.reduce<Record<string, string>>((acc, profesional) => {
        acc[profesional.id] = `${profesional.nombre} ${profesional.apellidos}`;
        return acc;
      }, {}),
    [profesionales]
  );

  const filteredPacientes = useMemo(() => {
    return pacientes.filter((paciente) => {
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        `${paciente.nombre} ${paciente.apellidos}`
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

      const matchesEstado = estadoFilter === 'todos' || paciente.estado === estadoFilter;
      const matchesRiesgo =
        riesgoFilter === 'todos' ||
        paciente.riesgo?.toLowerCase() === riesgoFilter.toLowerCase();
      const matchesFollowUp = !followUpOnly || pacientesSeguimiento.has(paciente.id);
      const matchesProfesional =
        profesionalFilter === 'todos' ||
        paciente.profesionalReferenteId === profesionalFilter;

      return (
        matchesSearch &&
        matchesEstado &&
        matchesRiesgo &&
        matchesFollowUp &&
        matchesProfesional
      );
    });
  }, [
    pacientes,
    searchTerm,
    estadoFilter,
    riesgoFilter,
    followUpOnly,
    pacientesSeguimiento,
    profesionalFilter
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o apellidos"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
        />
        <select
          value={estadoFilter}
          onChange={(e) => onEstadoFilterChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="todos">Estado: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="egresado">Egresados</option>
        </select>
        <select
          value={riesgoFilter}
          onChange={(e) => onRiesgoFilterChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="todos">Riesgo: todos</option>
          <option value="alto">Alto</option>
          <option value="medio">Medio</option>
          <option value="bajo">Bajo</option>
        </select>
        <select
          value={profesionalFilter}
          onChange={(e) => onProfesionalFilterChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="todos">Profesional: todos</option>
          {profesionales.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.nombre} {prof.apellidos}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={followUpOnly}
            onChange={(e) => onFollowUpOnlyChange(e.target.checked)}
            className="h-4 w-4 text-blue-600"
          />
          Mostrar solo pacientes con seguimiento pendiente
        </label>
        <span className="text-xs text-gray-400">
          ({pacientesSeguimiento.size} paciente{pacientesSeguimiento.size === 1 ? '' : 's'} con seguimiento)
        </span>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
          Cargando pacientes...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredPacientes.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
          No se encontraron pacientes con los criterios seleccionados.
        </div>
      )}

      {!loading && !error && filteredPacientes.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Riesgo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Profesional referente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPacientes.map((paciente) => {
                const riesgoClass =
                  riesgoColors[paciente.riesgo ?? ''] ?? 'bg-gray-100 text-gray-700';
                const requiereSeguimiento = pacientesSeguimiento.has(paciente.id);
                return (
                  <tr key={paciente.id}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {paciente.nombre} {paciente.apellidos}
                        </span>
                        {requiereSeguimiento && (
                          <span className="mt-1 inline-flex w-fit rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                            Seguimiento pendiente
                          </span>
                        )}
                        {paciente.telefono && (
                          <span className="text-sm text-gray-500">{paciente.telefono}</span>
                        )}
                        {paciente.email && (
                          <span className="text-sm text-gray-500">{paciente.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${riesgoClass}`}>
                        {paciente.riesgo ? paciente.riesgo.toUpperCase() : 'Sin asignar'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {paciente.profesionalReferenteId
                          ? profesionalesMap[paciente.profesionalReferenteId] ?? 'Asignación pendiente'
                          : 'No asignado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {estadoLabels[paciente.estado] ?? 'Sin estado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/pacientes/${paciente.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
