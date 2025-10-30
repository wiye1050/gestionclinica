'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { AGENDA_CONFIG, generateTimeSlots, getCurrentTimePosition } from './agendaHelpers';

interface AgendaTimelineProps {
  showNowIndicator?: boolean;
  onSlotClick?: (hour: number, minute: number) => void;
  children?: React.ReactNode;
}

export default function AgendaTimeline({ 
  showNowIndicator = true, 
  onSlotClick,
  children 
}: AgendaTimelineProps) {
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nowPosition, setNowPosition] = useState(getCurrentTimePosition());

  // Actualizar posición del indicador "ahora" cada minuto
  useEffect(() => {
    if (!showNowIndicator) return;

    const updateNowPosition = () => {
      setNowPosition(getCurrentTimePosition());
    };

    const interval = setInterval(updateNowPosition, 60000); // cada minuto
    return () => clearInterval(interval);
  }, [showNowIndicator]);

  // Scroll automático a la hora actual al montar
  useEffect(() => {
    if (containerRef.current && showNowIndicator) {
      const scrollPosition = nowPosition - 200; // Centrar aprox
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const handleSlotClick = (hour: number, minute: number) => {
    if (onSlotClick) {
      onSlotClick(hour, minute);
    }
  };

  const now = new Date();
  const isToday = true; // Esto debería venir de props si estamos viendo otro día

  return (
    <div className="flex h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Columna de horas */}
      <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200">
        <div className="h-12 border-b border-gray-200 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-500 uppercase">Hora</span>
        </div>
        <div className="relative" style={{ height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR)}px` }}>
          {timeSlots.filter((_, index) => index % 4 === 0).map((slot) => (
            <div
              key={slot.time}
              className="absolute w-full text-right pr-2"
              style={{
                top: `${((slot.hour - AGENDA_CONFIG.START_HOUR) * 60 + slot.minute) / 60 * AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
                height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
              }}
            >
              <span className="text-xs font-medium text-gray-600">{slot.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Área de contenido con scroll */}
      <div ref={containerRef} className="flex-1 overflow-y-auto relative">
        {/* Header sticky (días de la semana, profesionales, etc.) */}
        <div className="sticky top-0 z-10 h-12 bg-white border-b border-gray-200">
          {/* Este contenido vendrá de las vistas específicas */}
        </div>

        {/* Grid de fondo */}
        <div 
          className="relative"
          style={{ 
            height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR)}px`,
          }}
        >
          {/* Líneas horizontales cada hora */}
          {Array.from({ length: AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR }).map((_, index) => (
            <div
              key={index}
              className="absolute w-full border-t border-gray-200"
              style={{
                top: `${index * AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
                height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
              }}
            >
              {/* Líneas cada 15 minutos */}
              {[1, 2, 3].map((quarter) => (
                <div
                  key={quarter}
                  className="absolute w-full border-t border-gray-100"
                  style={{
                    top: `${quarter * (AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR / 4)}px`,
                  }}
                />
              ))}
            </div>
          ))}

          {/* Indicador de "ahora" */}
          {showNowIndicator && isToday && nowPosition >= 0 && (
            <div
              className="absolute w-full z-20 pointer-events-none"
              style={{ top: `${nowPosition}px` }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
              <div className="absolute left-4 -top-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          {/* Contenido (eventos, etc.) */}
          {children}
        </div>
      </div>
    </div>
  );
}
