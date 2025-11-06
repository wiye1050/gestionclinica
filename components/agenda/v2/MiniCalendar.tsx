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
    <div className="bg-white rounded-lg shadow p-3">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
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
                relative aspect-square p-1 text-xs rounded-lg transition-all
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                ${isSelected ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-100'}
                ${isTodayDate && !isSelected ? 'ring-2 ring-blue-400 font-semibold' : ''}
              `}
            >
              <span className="flex items-center justify-center h-full">
                {format(day, 'd')}
              </span>

              {/* Indicador de eventos */}
              {dayHasEvents && !isSelected && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 ring-2 ring-blue-400 rounded-full" />
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span>Con citas</span>
        </div>
      </div>
    </div>
  );
}
