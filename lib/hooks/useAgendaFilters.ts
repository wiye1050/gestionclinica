import { useState, useEffect } from 'react';
import type { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import type { VistaAgenda } from '@/app/dashboard/agenda/AgendaClient';
import { captureError } from '@/lib/utils/errorLogging';

const AGENDA_STORAGE_KEY = 'agenda.filters.v1';
const VIEW_STORAGE_KEY = 'agenda.view.v1';
const DAY_MODE_STORAGE_KEY = 'agenda.dayMode.v1';

type SavedFilters = {
  profesionales?: string[];
  sala?: string;
  estado?: AgendaEvent['estado'] | 'todos';
  tipo?: AgendaEvent['tipo'] | 'todos';
  preset?: 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria';
};

export function useAgendaFilters() {
  // Filter states
  const [selectedProfesionales, setSelectedProfesionales] = useState<string[]>([]);
  const [selectedSala, setSelectedSala] = useState<string>('todas');
  const [estadoFilter, setEstadoFilter] = useState<AgendaEvent['estado'] | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = useState<AgendaEvent['tipo'] | 'todos'>('todos');
  const [busquedaEvento, setBusquedaEvento] = useState('');
  const [resourcePreset, setResourcePreset] = useState<'todos' | 'medicina' | 'fisioterapia' | 'enfermeria'>('todos');

  // View states
  const [vista, setVista] = useState<VistaAgenda>('multi');
  const [viewDensity, setViewDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [dayViewMode, setDayViewMode] = useState<'single' | 'multi'>('single');

  // Loading state
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Load view preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (
      storedView === 'diaria' ||
      storedView === 'semanal' ||
      storedView === 'multi'
    ) {
      setVista(storedView);
    } else if (storedView) {
      // Normalizar vistas antiguas o inválidas
      window.localStorage.removeItem(VIEW_STORAGE_KEY);
      setVista('semanal');
    }
  }, []);

  // Persist view preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, vista);
  }, [vista]);

  // Load day mode preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedDayMode = window.localStorage.getItem(DAY_MODE_STORAGE_KEY);
    if (storedDayMode === 'single' || storedDayMode === 'multi') {
      setDayViewMode(storedDayMode);
    }
  }, []);

  // Persist day mode preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DAY_MODE_STORAGE_KEY, dayViewMode);
  }, [dayViewMode]);

  // Load filters from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || filtersLoaded) return;
    try {
      const raw = window.localStorage.getItem(AGENDA_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedFilters;

      if (Array.isArray(saved?.profesionales)) {
        setSelectedProfesionales(saved.profesionales);
      }
      if (saved?.sala) {
        setSelectedSala(saved.sala);
      }
      if (saved?.estado) {
        setEstadoFilter(saved.estado);
      }
      if (saved?.tipo) {
        setTipoFilter(saved.tipo);
      }
      if (saved?.preset) {
        setResourcePreset(saved.preset);
      }
    } catch (error) {
      captureError(error, { module: 'agenda-filters', action: 'load-filters' }, 'warn');
    } finally {
      setFiltersLoaded(true);
    }
  }, [filtersLoaded]);

  // Persist filters to localStorage
  useEffect(() => {
    if (!filtersLoaded || typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({
        profesionales: selectedProfesionales,
        sala: selectedSala,
        estado: estadoFilter,
        tipo: tipoFilter,
        preset: resourcePreset,
      });
      window.localStorage.setItem(AGENDA_STORAGE_KEY, payload);
    } catch (error) {
      captureError(error, { module: 'agenda-filters', action: 'save-filters' }, 'warn');
    }
  }, [selectedProfesionales, selectedSala, estadoFilter, tipoFilter, resourcePreset, filtersLoaded]);

  // Clear all filters
  const clearFilters = () => {
    setBusquedaEvento('');
    setSelectedProfesionales([]);
    setSelectedSala('todas');
    setTipoFilter('todos');
    setEstadoFilter('todos');
  };

  return {
    // Filter states
    selectedProfesionales,
    setSelectedProfesionales,
    selectedSala,
    setSelectedSala,
    estadoFilter,
    setEstadoFilter,
    tipoFilter,
    setTipoFilter,
    busquedaEvento,
    setBusquedaEvento,
    resourcePreset,
    setResourcePreset,

    // View states
    vista,
    setVista,
    viewDensity,
    setViewDensity,
    dayViewMode,
    setDayViewMode,

    // Utils
    filtersLoaded,
    clearFilters,
  };
}
