'use client';

import MiniCalendar from '../MiniCalendar';
import ProfesionalFilterList from './ProfesionalFilterList';
import { AgendaEvent } from '../agendaHelpers';

interface Profesional {
  id: string;
  nombre: string;
  apellidos: string;
  color?: string;
}

interface AgendaSidebarProps {
  // MiniCalendar
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  events: AgendaEvent[];

  // Profesionales
  profesionales: Profesional[];
  selectedProfesionales: string[];
  onProfesionalesChange: (ids: string[]) => void;
}

export default function AgendaSidebar({
  // MiniCalendar
  currentDate,
  onDateSelect,
  onMonthChange,
  events,

  // Profesionales
  profesionales,
  selectedProfesionales,
  onProfesionalesChange,
}: AgendaSidebarProps) {
  return (
    <aside className="w-[280px] h-full flex-shrink-0 border-r border-border bg-card overflow-y-auto lg:sticky lg:top-0">
      <div className="p-3 space-y-3">

        {/* Mini Calendar */}
        <div>
          <MiniCalendar
            currentDate={currentDate}
            onDateSelect={onDateSelect}
            onMonthChange={onMonthChange}
            events={events}
          />
        </div>

        {/* Profesionales */}
        <div>
          <ProfesionalFilterList
            profesionales={profesionales}
            selectedIds={selectedProfesionales}
            onChange={onProfesionalesChange}
            maxVisible={8}
          />
        </div>
      </div>
    </aside>
  );
}
