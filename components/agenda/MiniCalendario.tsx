'use client';

import { useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarioProps {
  currentDate: Date;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  eventDates?: Date[]; // Días con eventos
}

export default function MiniCalendario({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  eventDates = []
}: MiniCalendarioProps) {
  // Días del mes a mostrar
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Set de fechas con eventos para búsqueda rápida
  const eventDatesSet = useMemo(() => {
    return new Set(eventDates.map(d => format(d, 'yyyy-MM-dd')));
  }, [eventDates]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange?.(newDate);
  };

  const hasEvents = (date: Date) => {
    return eventDatesSet.has(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h3 className="font-semibold text-gray-900 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
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
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const dayHasEvents = hasEvents(day);

          return (
            <button
              key={i}
              onClick={() => onDateSelect(day)}
              disabled={!isCurrentMonth}
              className={`
                relative aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                ${!isCurrentMonth 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                }
                ${isSelected 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 font-semibold' 
                  : ''
                }
                ${isCurrentDay && !isSelected 
                  ? 'ring-2 ring-blue-600 font-semibold' 
                  : ''
                }
              `}
            >
              {format(day, 'd')}
              
              {/* Indicador de eventos */}
              {dayHasEvents && !isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 ring-2 ring-blue-600 rounded flex items-center justify-center font-semibold">
            {format(new Date(), 'd')}
          </div>
          <span className="text-gray-600">Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center font-semibold">
            15
          </div>
          <span className="text-gray-600">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 border border-gray-300 rounded flex items-center justify-center">
            10
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
          </div>
          <span className="text-gray-600">Con eventos</span>
        </div>
      </div>
    </div>
  );
}
