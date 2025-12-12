import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import { HISTORIAL_BADGE_COLORS } from './pacientesConstants';
import type { RegistroHistorialPaciente } from '@/types';

interface PatientHistorialListItemProps {
  registro: RegistroHistorialPaciente;
}

export default function PatientHistorialListItem({ registro }: PatientHistorialListItemProps) {
  return (
    <article className="panel-block shadow-sm">
      <header className="flex flex-col gap-2 border-b border-border/70 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-text-muted">
            {registro.fecha.toLocaleString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-pill px-2 py-1 text-xs font-semibold ${
                HISTORIAL_BADGE_COLORS[registro.tipo as keyof typeof HISTORIAL_BADGE_COLORS] ?? 'bg-cardHover text-text-muted'
              }`}
            >
              {registro.tipo.toUpperCase()}
            </span>
            <p className="text-sm text-text-muted">
              Registrado por {registro.creadoPor ?? 'sistema'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-text-muted">
            {registro.profesionalNombre ?? 'Profesional no asignado'}
          </div>
          {registro.eventoAgendaId && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/agenda?event=${registro.eventoAgendaId}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Ver cita
              </Link>
            </Button>
          )}
        </div>
      </header>
      <div className="space-y-3 px-6 py-4 text-sm text-text">
        <p>{registro.descripcion}</p>
        {registro.resultado && (
          <p className="rounded-2xl bg-success-bg px-3 py-2 text-success">
            <span className="font-medium">Resultado: </span>
            {registro.resultado}
          </p>
        )}
        {registro.planesSeguimiento && (
          <p className="rounded-2xl bg-brand-subtle px-3 py-2 text-brand">
            <span className="font-medium">Seguimiento: </span>
            {registro.planesSeguimiento}
          </p>
        )}
      </div>
    </article>
  );
}
