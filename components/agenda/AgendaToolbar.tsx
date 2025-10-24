'use client';

import { addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Profesional, SalaClinica } from '@/types';

interface AgendaToolbarProps {
  currentWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  profesionales: Profesional[];
  salas: SalaClinica[];
  selectedProfesional: string;
  onProfesionalChange: (value: string) => void;
  selectedSala: string;
  onSalaChange: (value: string) => void;
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short'
  });
  const formatterWithYear = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const startLabel = formatter.format(start);
  const endLabel =
    start.getFullYear() === end.getFullYear()
      ? formatterWithYear.format(end)
      : `${formatterWithYear.format(end)}`;

  return `${startLabel} – ${endLabel}`;
}

export function AgendaToolbar({
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  profesionales,
  salas,
  selectedProfesional,
  onProfesionalChange,
  selectedSala,
  onSalaChange
}: AgendaToolbarProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <span>{formatWeekRange(currentWeekStart)}</span>
          </div>
          <button
            type="button"
            onClick={onNextWeek}
            className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onToday}
          className="rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          Hoy
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedProfesional}
          onChange={(e) => onProfesionalChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-56"
        >
          <option value="todos">Todos los profesionales</option>
          {profesionales.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.nombre} {prof.apellidos} ({prof.especialidad})
            </option>
          ))}
        </select>

        <select
          value={selectedSala}
          onChange={(e) => onSalaChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-48"
        >
          <option value="todas">Todas las salas</option>
          {salas.map((sala) => (
            <option key={sala.id} value={sala.id}>
              {sala.nombre} ({sala.tipo})
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
