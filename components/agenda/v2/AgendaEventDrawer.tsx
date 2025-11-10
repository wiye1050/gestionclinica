'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReactNode } from 'react';
import DetailPanel from '@/components/shared/DetailPanel';
import type { AgendaEvent } from './agendaHelpers';
import type { Paciente } from '@/types';
import {
  AlertTriangle,
  Calendar,
  Edit,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
interface AgendaEventDrawerProps {
  event: AgendaEvent | null;
  paciente: Paciente | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => void;
  onEdit?: (event: AgendaEvent) => void;
}

const QUICK_ACTIONS: Array<{
  key: 'confirm' | 'complete' | 'cancel';
  label: string;
  visibleFor: AgendaEvent['estado'][];
  tone: string;
}> = [
  { key: 'confirm', label: 'Confirmar', visibleFor: ['programada'], tone: 'bg-emerald-600' },
  { key: 'complete', label: 'Marcar realizada', visibleFor: ['confirmada'], tone: 'bg-blue-600' },
  {
    key: 'cancel',
    label: 'Cancelar',
    visibleFor: ['programada', 'confirmada'],
    tone: 'bg-rose-600',
  },
];

const PatientInfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | undefined;
  icon: ReactNode;
}) => (
  <div className="flex items-center gap-2 text-sm text-text">
    <span className="text-text-muted">{icon}</span>
    <span className="font-medium">{label}:</span>
    <span className="text-text-muted">{value ?? '—'}</span>
  </div>
);

export default function AgendaEventDrawer({
  event,
  paciente,
  isOpen,
  onClose,
  onAction,
  onEdit,
}: AgendaEventDrawerProps) {
  if (!event) return null;

  const fechaLabel = `${format(event.fechaInicio, "EEEE, d 'de' MMMM", { locale: es })}`;
  const horaLabel = `${format(event.fechaInicio, 'HH:mm')} — ${format(event.fechaFin, 'HH:mm')}`;
  const duracionMin = Math.round((event.fechaFin.getTime() - event.fechaInicio.getTime()) / 60000);

  const availableActions = QUICK_ACTIONS.filter((action) =>
    action.visibleFor.includes(event.estado)
  );

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title={event.titulo || 'Cita sin título'}
      subtitle={fechaLabel}
      headerColor="from-brand to-brand/90"
      variant="drawer"
      actions={
        onEdit && (
          <button
            onClick={() => onEdit(event)}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors"
            title="Editar cita"
          >
            <Edit className="w-5 h-5" />
          </button>
        )
      }
    >
      <div className="space-y-6 text-sm text-text">
        {/* Acciones rápidas */}
        {availableActions.length > 0 && (
          <div className="rounded-2xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase text-text-muted mb-2">
              Acciones rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => onAction?.(event, action.key)}
                  className={`${action.tone} text-white rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-90`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Información de la cita */}
        <div className="rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold uppercase text-text-muted">Detalles</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand" />
              <span className="font-medium">{horaLabel}</span>
              <span className="text-text-muted">({duracionMin} min)</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand" />
              <span>{event.profesionalNombre ?? 'Profesional sin asignar'}</span>
            </div>
            {event.salaNombre && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand" />
                <span>{event.salaNombre}</span>
              </div>
            )}
            {event.prioridad === 'alta' && (
              <div className="flex items-center gap-2 text-rose-600 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Prioridad alta
              </div>
            )}
            {event.notas && (
              <div className="rounded-xl bg-muted/60 p-3 text-xs text-text">
                <p className="font-semibold text-text-muted mb-1">Notas de la cita</p>
                <p className="whitespace-pre-wrap">{event.notas}</p>
              </div>
            )}
          </div>
        </div>

        {/* Paciente */}
        <div className="rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold uppercase text-text-muted">Paciente</p>
          {paciente ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold">{`${paciente.nombre} ${paciente.apellidos}`}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-brand-subtle px-3 py-1 text-brand font-semibold">
                  Riesgo {paciente.riesgo}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-text">
                  Estado {paciente.estado}
                </span>
              </div>
              <div className="space-y-1">
                <PatientInfoRow
                  label="Teléfono"
                  value={paciente.telefono}
                  icon={<Phone className="w-4 h-4" />}
                />
                <PatientInfoRow
                  label="Email"
                  value={paciente.email}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
              {paciente.alertasClinicas?.length ? (
                <div className="rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                  <p className="font-semibold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Alertas clínicas
                  </p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {paciente.alertasClinicas.slice(0, 3).map((alerta) => (
                      <li key={alerta}>{alerta}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {paciente.notasInternas && (
                <div className="rounded-xl bg-cardHover px-3 py-2 text-xs text-text">
                  <p className="font-semibold text-text-muted mb-1">Notas internas</p>
                  <p className="line-clamp-4 whitespace-pre-wrap">{paciente.notasInternas}</p>
                </div>
              )}
              <a
                href={`/dashboard/pacientes/${paciente.id}`}
                className="inline-flex items-center text-sm font-semibold text-brand hover:underline"
              >
                Ver ficha completa →
              </a>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No hay paciente vinculado a esta cita.</p>
          )}
        </div>

        {/* Historial breve */}
        {paciente?.diagnosticosPrincipales?.length ? (
          <div className="rounded-2xl border border-border p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase text-text-muted">
              Diagnósticos principales
            </p>
            <div className="flex flex-wrap gap-2">
              {paciente.diagnosticosPrincipales.slice(0, 4).map((diag) => (
                <span
                  key={diag}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-text"
                >
                  {diag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </DetailPanel>
  );
}
