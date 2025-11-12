'use client';

import Link from 'next/link';
import { Paciente, Profesional } from '@/types';
import { useMemo, useState } from 'react';
import CompactFilters from '@/components/shared/CompactFilters';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Eye, AlertCircle } from 'lucide-react';

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

const riesgoColors: Record<string, string> = {
  alto: 'bg-red-100 text-red-700',
  medio: 'bg-yellow-100 text-yellow-700',
  bajo: 'bg-green-100 text-green-700'
};

const estadoColors: Record<string, string> = {
  activo: 'bg-green-100 text-green-700',
  inactivo: 'bg-gray-100 text-gray-700',
  egresado: 'bg-blue-100 text-blue-700'
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
  const [sortKey, setSortKey] = useState<string>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const profesionalesMap = useMemo(
    () =>
      profesionales.reduce<Record<string, string>>((acc, profesional) => {
        acc[profesional.id] = `${profesional.nombre} ${profesional.apellidos}`;
        return acc;
      }, {}),
    [profesionales]
  );

  const filteredPacientes = useMemo(() => {
    const filtered = pacientes.filter((paciente) => {
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

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortKey === 'nombre') {
        aVal = `${a.nombre} ${a.apellidos}`.toLowerCase();
        bVal = `${b.nombre} ${b.apellidos}`.toLowerCase();
      } else if (sortKey === 'riesgo') {
        const riesgoOrder = { alto: 3, medio: 2, bajo: 1 };
        aVal = riesgoOrder[a.riesgo as keyof typeof riesgoOrder] || 0;
        bVal = riesgoOrder[b.riesgo as keyof typeof riesgoOrder] || 0;
      } else if (sortKey === 'estado') {
        aVal = a.estado;
        bVal = b.estado;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [
    pacientes,
    searchTerm,
    estadoFilter,
    riesgoFilter,
    followUpOnly,
    pacientesSeguimiento,
    profesionalFilter,
    sortKey,
    sortDirection
  ]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const activeFiltersCount = [
    estadoFilter !== 'todos',
    riesgoFilter !== 'todos',
    profesionalFilter !== 'todos',
    followUpOnly
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onEstadoFilterChange('todos');
    onRiesgoFilterChange('todos');
    onProfesionalFilterChange('todos');
    onFollowUpOnlyChange(false);
  };

  const columns: Column<Paciente>[] = [
    {
      key: 'nombre',
      label: 'Paciente',
      sortable: true,
      render: (paciente) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900">
            {paciente.nombre} {paciente.apellidos}
          </span>
          {pacientesSeguimiento.has(paciente.id) && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              <AlertCircle className="h-3 w-3" />
              Seguimiento pendiente
            </span>
          )}
          {paciente.telefono && (
            <span className="text-xs text-gray-500">{paciente.telefono}</span>
          )}
        </div>
      )
    },
    {
      key: 'riesgo',
      label: 'Riesgo',
      sortable: true,
      render: (paciente) => {
        const riesgoClass = riesgoColors[paciente.riesgo ?? ''] ?? 'bg-gray-100 text-gray-700';
        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riesgoClass}`}>
            {paciente.riesgo ? paciente.riesgo.toUpperCase() : 'Sin asignar'}
          </span>
        );
      }
    },
    {
      key: 'profesional',
      label: 'Profesional',
      render: (paciente) => (
        <span className="text-sm text-gray-700">
          {paciente.profesionalReferenteId
            ? profesionalesMap[paciente.profesionalReferenteId] ?? 'Asignación pendiente'
            : 'No asignado'}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (paciente) => {
        const estadoClass = estadoColors[paciente.estado] ?? 'bg-gray-100 text-gray-700';
        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClass}`}>
            {paciente.estado.charAt(0).toUpperCase() + paciente.estado.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (paciente) => (
        <Link
          href={`/dashboard/pacientes/${paciente.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          <Eye className="h-4 w-4" />
          Ver ficha
        </Link>
      )
    }
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CompactFilters
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por nombre o apellidos..."
        filters={[
          {
            label: 'Estado',
            value: estadoFilter,
            options: [
              { label: 'Activos', value: 'activo' },
              { label: 'Inactivos', value: 'inactivo' },
              { label: 'Egresados', value: 'egresado' }
            ],
            onChange: onEstadoFilterChange
          },
          {
            label: 'Riesgo',
            value: riesgoFilter,
            options: [
              { label: 'Alto', value: 'alto' },
              { label: 'Medio', value: 'medio' },
              { label: 'Bajo', value: 'bajo' }
            ],
            onChange: onRiesgoFilterChange
          },
          {
            label: 'Profesional',
            value: profesionalFilter,
            options: profesionales.map(p => ({
              label: `${p.nombre} ${p.apellidos}`,
              value: p.id
            })),
            onChange: onProfesionalFilterChange
          }
        ]}
        activeFiltersCount={activeFiltersCount}
        onClearAll={handleClearFilters}
      >
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={followUpOnly}
            onChange={(e) => onFollowUpOnlyChange(e.target.checked)}
            className="h-4 w-4 text-blue-600"
          />
          <span className="text-gray-700">Solo con seguimiento</span>
          <span className="text-xs text-gray-400">({pacientesSeguimiento.size})</span>
        </label>
      </CompactFilters>

      <DataTable
        columns={columns}
        data={filteredPacientes}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => window.location.href = `/dashboard/pacientes/${p.id}`}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        loading={loading}
        emptyMessage="No se encontraron pacientes con los criterios seleccionados"
      />
    </div>
  );
}
