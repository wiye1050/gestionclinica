'use client';

import { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Circle,
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react';
import {
  AgendaEvent,
  EVENT_TYPE_COLORS,
  EVENT_STATE_STYLES,
  formatTimeRange,
  formatDuration,
} from './agendaHelpers';

interface AgendaEventCardProps {
  event: AgendaEvent;
  index: number;
  style?: React.CSSProperties;
  isResizable?: boolean;
  onResize?: (eventId: string, newDuration: number) => void;
  onClick?: (event: AgendaEvent) => void;
  onQuickAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => void;
  onEdit?: (event: AgendaEvent) => void;
  onDelete?: (event: AgendaEvent) => void;
  isDragging?: boolean;
  hasConflict?: boolean;
}

export default function AgendaEventCard({
  event,
  index,
  style,
  isResizable = true,
  onResize,
  onClick,
  onQuickAction,
  onEdit,
  onDelete,
  isDragging = false,
  hasConflict = false,
}: AgendaEventCardProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const initialHeight = useRef(0);
  const initialMouseY = useRef(0);

  const typeColors = EVENT_TYPE_COLORS[event.tipo] || EVENT_TYPE_COLORS.consulta;
  const stateStyle = EVENT_STATE_STYLES[event.estado];

  // Iconos por estado
  const estadoIcon = {
    programada: <Circle className="w-3 h-3" />,
    confirmada: <CheckCircle className="w-3 h-3" />,
    realizada: <CheckCircle className="w-3 h-3 fill-current" />,
    cancelada: <XCircle className="w-3 h-3" />,
  }[event.estado];

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    initialMouseY.current = e.clientY;
    if (cardRef.current) {
      initialHeight.current = cardRef.current.offsetHeight;
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - initialMouseY.current;
      const newHeight = Math.max(40, initialHeight.current + deltaY);
      
      if (cardRef.current) {
        cardRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (cardRef.current && onResize) {
        const newHeight = cardRef.current.offsetHeight;
        const pixelsPerMinute = 80 / 60; // TIMELINE_HEIGHT_PER_HOUR / 60
        const newDurationMinutes = Math.round(newHeight / pixelsPerMinute);
        onResize(event.id, newDurationMinutes);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isResizing && onClick) {
      onClick(event);
    }
  };

  const quickActions = [
    {
      key: 'confirm' as const,
      label: 'Confirmar',
      show: event.estado === 'programada',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    {
      key: 'complete' as const,
      label: 'Completar',
      show: event.estado === 'confirmada',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    {
      key: 'cancel' as const,
      label: 'Cancelar',
      show: event.estado !== 'cancelada' && event.estado !== 'realizada',
      icon: <XCircle className="w-3 h-3" />,
    },
  ].filter(a => a.show);

  return (
    <Draggable draggableId={event.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={(node) => {
            provided.innerRef(node);
            if (node) cardRef.current = node;
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            absolute w-full px-1 transition-all
            ${snapshot.isDragging ? 'z-50 opacity-90' : 'z-10'}
            ${isResizing ? 'cursor-ns-resize' : 'cursor-pointer'}
          `}
          style={{
            ...style,
            ...provided.draggableProps.style,
          }}
          onClick={handleClick}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div
            className={`
              h-full rounded-lg shadow-sm
              ${typeColors.bg} ${typeColors.border} border-l-4
              ${stateStyle}
              ${hasConflict ? 'ring-2 ring-red-400' : ''}
              hover:shadow-md transition-shadow
              relative overflow-hidden
            `}
          >
            {/* Contenido */}
            <div className="p-2 h-full flex flex-col text-xs">
              {/* Header */}
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    {estadoIcon}
                    <span className={`font-semibold truncate ${typeColors.text}`}>
                      {event.titulo}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs text-gray-900">
                      {formatTimeRange(event.fechaInicio, event.fechaFin)}
                    </span>
                    <span className="text-xs text-gray-700">
                      ({formatDuration(event.fechaInicio, event.fechaFin)})
                    </span>
                  </div>
                </div>

                {/* Prioridad */}
                {event.prioridad === 'alta' && (
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-0.5 text-gray-900 min-h-0">
                {event.pacienteNombre && (
                  <div className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{event.pacienteNombre}</span>
                  </div>
                )}
                {event.salaNombre && (
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{event.salaNombre}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {showActions && (onQuickAction || onEdit || onDelete) && (
                <div className="flex items-center gap-1 mt-1 pt-1 border-t border-gray-300">
                  {quickActions.map((action) => (
                    <button
                      key={action.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAction?.(event, action.key);
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-900 hover:bg-gray-50 transition-colors"
                      title={action.label}
                    >
                      {action.icon}
                      <span className="hidden sm:inline">{action.label}</span>
                    </button>
                  ))}
                  
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(event);
                      }}
                      className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(event);
                      }}
                      className="p-1 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Resize handle */}
            {isResizable && event.estado !== 'realizada' && event.estado !== 'cancelada' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-gray-400 hover:bg-opacity-50 transition-colors"
                onMouseDown={handleResizeStart}
              />
            )}

            {/* Conflicto indicator */}
            {hasConflict && (
              <div className="absolute top-1 right-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
