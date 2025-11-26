'use client';

import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  format 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AgendaEvent, getEventsForDay } from './agendaHelpers';

interface MiniCalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  events: AgendaEvent[];
}

export default function MiniCalendar({
  currentDate,
  onDateSelect,
  onMonthChange,
  events,
}: MiniCalendarProps) {
  // Calcular días del mes
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const daysArray = [];
    let day = startDate;

    while (day <= endDate) {
      daysArray.push(day);
      day = addDays(day, 1);
    }

    return daysArray;
  }, [currentDate]);

  // Verificar si un día tiene eventos
  const hasEvents = (day: Date) => {
    return getEventsForDay(events, day).length > 0;
  };

  // Navegar mes anterior
  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    onMonthChange(newDate);
  };

  // Navegar mes siguiente
  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    onMonthChange(newDate);
  };

  // Click en día
  const handleDayClick = (day: Date) => {
    onDateSelect(day);
  };

  return (
    <div className="panel-block p-2 transition-all duration-150 hover:shadow-md">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-cardHover rounded transition-all duration-150"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-text-muted" />
        </button>

        <h3 className="text-xs font-semibold text-text capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-cardHover rounded transition-all duration-150"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-medium text-text-muted py-0.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, currentDate);
          const isTodayDate = isToday(day);
          const dayHasEvents = hasEvents(day);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              className={`
                relative aspect-square p-0.5 text-[9px] rounded-lg transition-all duration-150
                ${!isCurrentMonth ? 'text-text-muted' : 'text-text'}
                ${isSelected ? 'bg-brand text-white font-semibold' : 'hover:bg-cardHover'}
                ${isTodayDate && !isSelected ? 'ring-2 ring-brand/50 font-semibold' : ''}
              `}
            >
              <span className="flex items-center justify-center h-full">
                {format(day, 'd')}
              </span>

              {/* Indicador de eventos */}
              {dayHasEvents && !isSelected && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-brand rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border text-[9px] text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 ring-2 ring-brand/50 rounded-full" />
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-brand rounded-full" />
          <span>Con citas</span>
        </div>
      </div>
    </div>
  );
}
