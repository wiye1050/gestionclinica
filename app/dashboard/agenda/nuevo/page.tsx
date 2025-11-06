'use client';

import { AgendaEventForm } from '@/app/dashboard/agenda/evento-form';

export default function NuevoEventoAgendaPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programar evento</h1>
          <p className="text-gray-600 mt-1">
            Crea una nueva cita clínica, reunión o actividad de coordinación.
          </p>
        </div>
      </header>

      <AgendaEventForm />
    </div>
  );
}
