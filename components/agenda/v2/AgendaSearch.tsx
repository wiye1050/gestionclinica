'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AgendaEvent, EVENT_TYPE_COLORS } from './agendaHelpers';

interface AgendaSearchProps {
  events: AgendaEvent[];
  onEventSelect: (event: AgendaEvent) => void;
  onDateSelect: (date: Date) => void;
}

export default function AgendaSearch({ events, onEventSelect, onDateSelect }: AgendaSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredEvents = useMemo(() => {
    if (!query.trim()) return [];
    const searchLower = query.toLowerCase();
    return events
      .filter((event) => {
        return (
          event.titulo.toLowerCase().includes(searchLower) ||
          event.pacienteNombre?.toLowerCase().includes(searchLower) ||
          event.profesionalNombre?.toLowerCase().includes(searchLower) ||
          event.salaNombre?.toLowerCase().includes(searchLower) ||
          event.notas?.toLowerCase().includes(searchLower) ||
          event.tipo.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime())
      .slice(0, 10);
  }, [events, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEventClick = (event: AgendaEvent) => {
    onEventSelect(event);
    onDateSelect(event.fechaInicio);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar citas... (⌘K)"
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {isOpen && query && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto"
        >
          {filteredEvents.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                {filteredEvents.length} resultado{filteredEvents.length !== 1 ? 's' : ''}
              </div>
              {filteredEvents.map((event) => {
                const typeColors = EVENT_TYPE_COLORS[event.tipo];
                return (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-full ${typeColors.border} rounded-full flex-shrink-0 mt-1`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {event.titulo}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(event.fechaInicio, "d MMM 'a las' HH:mm", { locale: es })}
                            </span>
                          </div>
                          {event.pacienteNombre && (
                            <div className="flex items-center gap-1 truncate">
                              <User className="w-3 h-3" />
                              <span className="truncate">{event.pacienteNombre}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors.bg} ${typeColors.text}`}>
                            {event.tipo}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              event.estado === 'confirmada'
                                ? 'bg-green-100 text-green-700'
                                : event.estado === 'cancelada'
                                ? 'bg-red-100 text-red-700'
                                : event.estado === 'realizada'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {event.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No se encontraron citas</p>
              <p className="text-xs mt-1">Intenta buscar por paciente, título o profesional</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
