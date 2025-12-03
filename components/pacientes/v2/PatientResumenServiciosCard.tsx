import Link from 'next/link';
import type { ServicioAsignado } from '@/types';

interface PatientResumenServiciosCardProps {
  servicios: ServicioAsignado[];
}

export default function PatientResumenServiciosCard({ servicios }: PatientResumenServiciosCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">
            Tratamientos y servicios
          </p>
          <p className="text-lg font-semibold text-text">Seguimiento en curso</p>
        </div>
        <Link
          href="/dashboard/servicios"
          className="text-xs font-semibold text-brand hover:underline"
        >
          Ver servicios
        </Link>
      </div>
      {servicios.length === 0 ? (
        <p className="text-sm text-text-muted">No hay servicios activos para este paciente.</p>
      ) : (
        <div className="space-y-3">
          {servicios.slice(0, 3).map((servicio) => (
            <div key={servicio.id} className="rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold text-text">
                {servicio.catalogoServicioNombre ?? 'Servicio'}
              </p>
              <p className="text-xs text-text-muted">
                {servicio.profesionalPrincipalNombre ?? 'Sin profesional'} ·{' '}
                {servicio.esActual ? 'En progreso' : 'Planificado'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
