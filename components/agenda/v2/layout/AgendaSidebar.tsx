'use client';

import MiniCalendar from '../MiniCalendar';
import ProfesionalFilterList from './ProfesionalFilterList';
import BasicFilters from './BasicFilters';
import { AgendaEvent } from '../agendaHelpers';

interface Profesional {
  id: string;
  nombre: string;
  apellidos: string;
  color?: string;
}

interface Sala {
  id: string;
  nombre: string;
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

  // Filtros básicos
  estadoFilter: string;
  onEstadoChange: (estado: string) => void;
  tipoFilter: string;
  onTipoChange: (tipo: string) => void;
  selectedSala: string;
  salas: Sala[];
  onSalaChange: (sala: string) => void;
  onClearBasicFilters?: () => void;
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

  // Filtros básicos
  estadoFilter,
  onEstadoChange,
  tipoFilter,
  onTipoChange,
  selectedSala,
  salas,
  onSalaChange,
  onClearBasicFilters,
}: AgendaSidebarProps) {
  return (
    <aside className="w-[280px] h-full flex-shrink-0 border-r border-border bg-card overflow-y-auto">
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

        {/* Filtros Básicos */}
        <div>
          <BasicFilters
            estadoFilter={estadoFilter}
            onEstadoChange={onEstadoChange}
            tipoFilter={tipoFilter}
            onTipoChange={onTipoChange}
            selectedSala={selectedSala}
            salas={salas}
            onSalaChange={onSalaChange}
            onClearAll={onClearBasicFilters}
          />
        </div>
      </div>
    </aside>
  );
}
