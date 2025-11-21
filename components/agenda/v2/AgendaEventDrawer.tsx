'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import DetailPanel from '@/components/shared/DetailPanel';
import type { AgendaEvent } from './agendaHelpers';
import type { Paciente } from '@/types';
import {
  AlertTriangle,
  Calendar,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
interface AgendaEventDrawerProps {
  event: AgendaEvent | null;
  paciente: Paciente | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => Promise<void> | void;
  onEdit?: (event: AgendaEvent) => void;
  profesionales?: Array<{ id: string; nombre: string }>;
  onReassign?: (event: AgendaEvent, profesionalId: string) => Promise<void> | void;
  onUpdateEvent?: (id: string, updates: Partial<AgendaEvent>) => Promise<void>;
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
  profesionales,
  onReassign,
  onUpdateEvent,
}: AgendaEventDrawerProps) {
  const [selectedProf, setSelectedProf] = useState(event?.profesionalId ?? '');
  const [inlineDate, setInlineDate] = useState(format(event?.fechaInicio ?? new Date(), 'yyyy-MM-dd'));
  const [inlineTime, setInlineTime] = useState(format(event?.fechaInicio ?? new Date(), 'HH:mm'));
  const [inlineDuration, setInlineDuration] = useState(
    Math.max(15, Math.round(((event?.fechaFin ?? new Date()).getTime() - (event?.fechaInicio ?? new Date()).getTime()) / 60000))
  );
  const [updating, setUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState<'confirm' | 'complete' | 'cancel' | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  useEffect(() => {
    setSelectedProf(event?.profesionalId ?? '');
    if (event) {
      setInlineDate(format(event.fechaInicio, 'yyyy-MM-dd'));
      setInlineTime(format(event.fechaInicio, 'HH:mm'));
      setInlineDuration(
        Math.max(15, Math.round((event.fechaFin.getTime() - event.fechaInicio.getTime()) / 60000))
      );
    }
    setPendingAction(null);
    setReassigning(false);
    setInlineError(null);
  }, [event]);

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
      headerColor="from-brand-subtle to-brand-subtle/50"
      headerTextClassName="text-gray-900"
      headerSubtitleClassName="text-gray-600"
      variant="drawer"
      actions={
        onEdit && (
          <button
            onClick={() => onEdit(event)}
            className="rounded-lg p-2 hover:bg-gray-200/60 transition-colors text-gray-700"
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
                  onClick={async () => {
                    if (!onAction) return;
                    try {
                      setPendingAction(action.key);
                      await onAction(event, action.key);
                    } finally {
                      setPendingAction((prev) => (prev === action.key ? null : prev));
                    }
                  }}
                  disabled={pendingAction !== null}
                  className={`${action.tone} text-white rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1`}
                >
                  {pendingAction === action.key ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Procesando
                    </>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-text transition-colors hover:bg-card"
                >
                  Editar cita
                </button>
              )}
            </div>
            {onUpdateEvent && (
              <div className="mt-4 grid gap-3 text-xs text-text">
                <p className="font-semibold uppercase text-text-muted">Cambiar horario</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-text-muted">Fecha</span>
                    <input
                      type="date"
                      value={inlineDate}
                      onChange={(e) => setInlineDate(e.target.value)}
                      className="rounded-lg border border-border px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-text-muted">Hora</span>
                    <input
                      type="time"
                      value={inlineTime}
                      onChange={(e) => setInlineTime(e.target.value)}
                      className="rounded-lg border border-border px-2 py-1"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-muted">Duración (min)</span>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={inlineDuration}
                    onChange={(e) => setInlineDuration(Number(e.target.value) || 15)}
                    className="rounded-lg border border-border px-2 py-1"
                  />
                </label>
                <div className="space-y-1">
                  <button
                    onClick={async () => {
                      if (!event || !onUpdateEvent) return;
                      if (!inlineDate || !inlineTime) {
                        setInlineError('Selecciona una fecha y hora válidas.');
                        return;
                      }
                      const newStart = new Date(`${inlineDate}T${inlineTime}`);
                      if (Number.isNaN(newStart.getTime())) {
                        setInlineError('La combinación de fecha y hora no es válida.');
                        return;
                      }
                      const normalizedDuration = Math.min(12 * 60, Math.max(15, inlineDuration || 15));
                      const newEnd = new Date(newStart.getTime() + normalizedDuration * 60000);
                      setInlineError(null);
                      setUpdating(true);
                      try {
                        await onUpdateEvent(event.id, {
                          fechaInicio: newStart,
                          fechaFin: newEnd,
                        });
                      } catch (error) {
                        console.error('Inline update error', error);
                        setInlineError('No se pudo actualizar el horario. Intenta de nuevo.');
                        throw error;
                      } finally {
                        setUpdating(false);
                      }
                    }}
                    disabled={updating}
                    className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-text hover:bg-brand/90 disabled:opacity-50"
                  >
                    {updating ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando
                      </span>
                    ) : (
                      'Aplicar cambios'
                    )}
                  </button>
                  {inlineError && <p className="text-[11px] text-danger">{inlineError}</p>}
                </div>
              </div>
            )}
            {profesionales && profesionales.length > 0 && onReassign && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text">
                <label className="font-semibold">Reasignar a:</label>
                <select
                  value={selectedProf}
                  onChange={(e) => setSelectedProf(e.target.value)}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs"
                >
                  <option value="">Sin asignar</option>
                  {profesionales.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!onReassign) return;
                    try {
                      setReassigning(true);
                      await onReassign(event, selectedProf);
                    } catch (error) {
                      console.error('Reassign error', error);
                      toast.error('No se pudo reasignar la cita');
                      throw error;
                    } finally {
                      setReassigning(false);
                    }
                  }}
                  className="rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle disabled:opacity-50"
                  disabled={selectedProf === (event.profesionalId ?? '') || reassigning}
                >
                  {reassigning ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando
                    </span>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            )}
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

        {/* Enlaces contextuales */}
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text">
          <p className="text-xs font-semibold uppercase text-text-muted mb-2">
            Accesos directos
          </p>
          <div className="flex flex-wrap gap-2">
            {event.pacienteId && (
              <a
                href={`/dashboard/pacientes/${event.pacienteId}`}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle focus-visible:focus-ring"
              >
                Ver paciente
              </a>
            )}
            {event.profesionalId && (
              <a
                href={`/dashboard/profesionales/${event.profesionalId}`}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle focus-visible:focus-ring"
              >
                Ver profesional
              </a>
            )}
          </div>
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
