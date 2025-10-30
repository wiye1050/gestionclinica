'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarEvent {
  id: string;
  titulo: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipo: 'clinico' | 'coordinacion' | 'reunion';
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  prioridad?: 'alta' | 'media' | 'baja';
}

interface AgendaMensualProps {
  currentMonth: Date;
  eventos: CalendarEvent[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function AgendaMensual({
  currentMonth,
  eventos,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onEventClick
}: AgendaMensualProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Generar todos los días del mes
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  // Obtener día de la semana del primer día (0 = domingo, ajustamos a lunes = 0)
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7;

  // Días vacíos al inicio
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // Agrupar eventos por día
  const eventosPorDia = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    eventos.forEach(evento => {
      const key = format(evento.fechaInicio, 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(evento);
    });
    return map;
  }, [eventos]);

  const getEventoColor = (tipo: string, estado: string) => {
    if (estado === 'cancelada') return 'bg-gray-300 text-gray-700';
    if (estado === 'realizada') return 'bg-green-500 text-white';
    
    switch (tipo) {
      case 'clinico':
        return 'bg-blue-500 text-white';
      case 'coordinacion':
        return 'bg-purple-500 text-white';
      case 'reunion':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
          <div
            key={dia}
            className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7">
        {/* Días vacíos al inicio */}
        {emptyDays.map((i) => (
          <div key={`empty-${i}`} className="border-b border-r border-gray-100 dark:border-gray-700 min-h-[120px]" />
        ))}

        {/* Días del mes */}
        {daysInMonth.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const eventosDelDia = eventosPorDia.get(dayKey) || [];
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={dayKey}
              onClick={() => onDayClick?.(day)}
              className={`border-b border-r border-gray-100 dark:border-gray-700 min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50' : ''
              }`}
            >
              {/* Número del día */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isCurrentDay
                      ? 'flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white'
                      : !isCurrentMonth
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {eventosDelDia.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {eventosDelDia.length}
                  </span>
                )}
              </div>

              {/* Eventos del día */}
              <div className="space-y-1">
                {eventosDelDia.slice(0, 3).map((evento) => (
                  <div
                    key={evento.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(evento);
                    }}
                    className={`text-xs rounded px-2 py-1 truncate ${getEventoColor(
                      evento.tipo,
                      evento.estado
                    )} hover:opacity-80 transition-opacity`}
                  >
                    {format(evento.fechaInicio, 'HH:mm')} {evento.titulo}
                  </div>
                ))}
                {eventosDelDia.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    +{eventosDelDia.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Clínico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Coordinación</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Reunión</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Realizada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Cancelada</span>
        </div>
      </div>
    </div>
  );
}
