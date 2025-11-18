'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { AGENDA_CONFIG, generateTimeSlots, getCurrentTimePosition } from './agendaHelpers';

interface AgendaTimelineProps {
  showNowIndicator?: boolean;
  onSlotClick?: (hour: number, minute: number) => void;
  children?: React.ReactNode;
  hourHeight?: number;
}

export default function AgendaTimeline({ 
  showNowIndicator = true, 
  onSlotClick,
  children,
  hourHeight = AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR,
}: AgendaTimelineProps) {
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nowPosition, setNowPosition] = useState(() => getCurrentTimePosition(hourHeight));

  // Actualizar posición del indicador "ahora" cada minuto
  useEffect(() => {
    if (!showNowIndicator) return;

    const updateNowPosition = () => {
      setNowPosition(getCurrentTimePosition(hourHeight));
    };

    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000);
    return () => clearInterval(interval);
  }, [showNowIndicator, hourHeight]);

  // Scroll automático a la hora actual al montar
  useEffect(() => {
    if (containerRef.current && showNowIndicator) {
      const scrollPosition = nowPosition - 200;
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [nowPosition, showNowIndicator]);

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const minutesFromStart = Math.max(
      0,
      (offsetY / hourHeight) * 60
    );
    const hour = Math.min(
      AGENDA_CONFIG.END_HOUR - 1,
      AGENDA_CONFIG.START_HOUR + Math.floor(minutesFromStart / 60)
    );
    const minute = Math.max(0, Math.floor(minutesFromStart % 60));

    onSlotClick(hour, minute);
  };

  const now = new Date();

  return (
    <div className="flex h-full overflow-hidden panel-block">
      {/* Columna de horas */}
      <div className="w-20 flex-shrink-0 bg-cardHover border-r border-border">
        <div className="h-12 border-b border-border flex items-center justify-center">
          <span className="text-xs font-semibold text-text-muted uppercase">Hora</span>
        </div>
        <div className="relative" style={{ height: `${hourHeight * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR)}px` }}>
          {timeSlots.filter((_, index) => index % 4 === 0).map((slot) => (
            <div
              key={slot.time}
              className="absolute w-full text-right pr-2"
              style={{
                top: `${((slot.hour - AGENDA_CONFIG.START_HOUR) * 60 + slot.minute) / 60 * hourHeight}px`,
                height: `${hourHeight}px`,
              }}
            >
              <span className="text-xs font-medium text-text-muted">{slot.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Área de contenido con scroll */}
      <div ref={containerRef} className="relative flex-1 overflow-y-auto">
        {/* Header sticky (días de la semana, profesionales, etc.) */}
        <div className="sticky top-0 z-10 h-12 bg-card border-b border-border">
          {/* Este contenido vendrá de las vistas específicas */}
        </div>

        {/* Grid de fondo */}
        <div 
          className="relative"
          style={{ 
            height: `${hourHeight * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR)}px`,
          }}
          onClick={handleTimelineClick}
        >
          {/* Líneas horizontales cada hora */}
          {Array.from({ length: AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR }).map((_, index) => (
            <div
              key={index}
              className="absolute w-full border-t border-border"
              style={{
                top: `${index * hourHeight}px`,
                height: `${hourHeight}px`,
              }}
            >
              {/* Líneas cada 15 minutos */}
              {[1, 2, 3].map((quarter) => (
                <div
                  key={quarter}
                  className="absolute w-full border-t border-border/40"
                  style={{
                    top: `${quarter * (hourHeight / 4)}px`,
                  }}
                />
              ))}
            </div>
          ))}

          {/* Indicador de "ahora" */}
          {showNowIndicator && nowPosition >= 0 && (
            <div
              className="pointer-events-none absolute z-20 w-full"
              style={{ top: `${nowPosition}px` }}
            >
              <div className="flex items-center">
                <div className="-ml-1.5 h-3 w-3 rounded-full bg-danger" />
                <div className="h-0.5 flex-1 bg-danger" />
              </div>
              <div className="absolute -top-2 left-4 rounded bg-danger px-2 py-0.5 text-xs text-white">
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
