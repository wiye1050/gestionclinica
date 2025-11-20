'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import type { AgendaLinkBuilder } from './types';
import { Calendar, AlertCircle } from 'lucide-react';

interface AvailabilitySlot {
  start: string;
  end: string;
  durationMinutes: number;
}

interface PatientAvailabilityCardProps {
  profesionalId?: string | null;
  agendaLinkBuilder?: AgendaLinkBuilder;
}

export default function PatientAvailabilityCard({
  profesionalId,
  agendaLinkBuilder,
}: PatientAvailabilityCardProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      if (!profesionalId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/agenda/disponibilidad?profesionalId=${profesionalId}&days=4`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error('No disponible');
        }
        const data = (await res.json()) as { slots: AvailabilitySlot[] };
        if (isMounted) {
          setSlots(data.slots ?? []);
        }
      } catch (err) {
        console.error('availability', err);
        if (isMounted) {
          setError('No se pudo obtener la disponibilidad.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [profesionalId]);

  if (!profesionalId) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-brand" />
        <h2 className="text-lg font-semibold text-text">Próximos huecos del profesional</h2>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Buscando disponibilidad...</p>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-warning/40 bg-warning-bg/30 px-3 py-2 text-sm text-warning">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm text-text-muted">No hay huecos libres en los próximos días.</p>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const startDate = new Date(slot.start);
            const endDate = new Date(slot.end);
            const agendaHref = agendaLinkBuilder?.({
              date: startDate,
              profesionalId,
              newEvent: true,
            });
            return (
              <div
                key={slot.start}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-text">
                    {format(startDate, "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-text-muted">
                    {format(startDate, 'HH:mm')}h – {format(endDate, 'HH:mm')}h ·{' '}
                    {slot.durationMinutes} min
                  </p>
                </div>
                {agendaHref && (
                  <Link
                    href={agendaHref}
                    className="rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle"
                  >
                    Agendar
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

