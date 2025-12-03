import { CheckSquare, Square, Trash2 } from 'lucide-react';
import type { ServicioAsignado, Profesional } from '@/types';

type TiquetValue = 'SI' | 'NO' | 'CORD' | 'ESPACH';

interface ServiciosTableProps {
  servicios: ServicioAsignado[];
  profesionales: Profesional[];
  onToggleActual: (servicioId: string, valorActual: boolean) => void;
  onUpdateTiquet: (servicioId: string, nuevoTiquet: string) => void;
  onUpdateProfesional: (servicioId: string, campo: string, profesionalId: string) => void;
  onDelete: (servicioId: string) => void;
}

const getColorTiquet = (tiquet: string) => {
  switch (tiquet) {
    case 'SI':
      return 'bg-success-bg text-success';
    case 'NO':
      return 'bg-danger-bg text-danger';
    case 'CORD':
      return 'bg-warn-bg text-warn';
    case 'ESPACH':
      return 'bg-brand-subtle text-brand';
    default:
      return 'bg-cardHover text-text-muted';
  }
};

export default function ServiciosTable({
  servicios,
  profesionales,
  onToggleActual,
  onUpdateTiquet,
  onUpdateProfesional,
  onDelete,
}: ServiciosTableProps) {
  if (servicios.length === 0) {
    return (
      <div className="overflow-hidden panel-block shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-cardHover">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Actual
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Servicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Grupo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Tiquet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Citar con
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  2ª Opción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  3ª Opción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Apoyo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Sala
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Tiempo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-text-muted">
                  No hay servicios asignados. Usa el boton &quot;Asignar Servicio&quot;
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden panel-block shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-cardHover">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Actual
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Servicio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Grupo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Tiquet
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Citar con
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                2ª Opción
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                3ª Opción
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Apoyo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Sala
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Tiempo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {servicios.map((servicio) => (
              <tr key={servicio.id} className="hover:bg-cardHover">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleActual(servicio.id, servicio.esActual)}
                    className="text-text-muted hover:text-brand"
                  >
                    {servicio.esActual ? (
                      <CheckSquare className="h-5 w-5 text-brand" />
                    ) : (
                      <Square className="h-5 w-5 text-text-muted" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-text">
                  {servicio.catalogoServicioNombre}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">{servicio.grupoNombre}</td>
                <td className="px-4 py-3">
                  <select
                    value={servicio.tiquet}
                    onChange={(e) => onUpdateTiquet(servicio.id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-medium ${getColorTiquet(
                      servicio.tiquet
                    )}`}
                  >
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                    <option value="CORD">CORD</option>
                    <option value="ESPACH">ESPACH</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={servicio.profesionalPrincipalId}
                    onChange={(e) =>
                      onUpdateProfesional(servicio.id, 'profesionalPrincipalId', e.target.value)
                    }
                    className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-text focus-visible:focus-ring"
                  >
                    <option value="">Seleccionar...</option>
                    {profesionales.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nombre} {prof.apellidos}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={servicio.profesionalSegundaOpcionId || ''}
                    onChange={(e) =>
                      onUpdateProfesional(
                        servicio.id,
                        'profesionalSegundaOpcionId',
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-text focus-visible:focus-ring"
                  >
                    <option value="">-</option>
                    {profesionales.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nombre} {prof.apellidos}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={servicio.profesionalTerceraOpcionId || ''}
                    onChange={(e) =>
                      onUpdateProfesional(
                        servicio.id,
                        'profesionalTerceraOpcionId',
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-text focus-visible:focus-ring"
                  >
                    <option value="">-</option>
                    {profesionales.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nombre} {prof.apellidos}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  {servicio.requiereApoyo && <span className="text-warn">✓</span>}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">{servicio.sala || '-'}</td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {servicio.tiempoReal ? `${servicio.tiempoReal}min` : '-'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(servicio.id)}
                    className="text-danger transition-colors hover:text-danger/80"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
