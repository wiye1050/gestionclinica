'use client';

import { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePacientes } from '@/lib/hooks/usePacientes';
import { useProfesionales } from '@/lib/hooks/useQueries';
import { getPendingFollowUpPatientIds } from '@/lib/utils/followUps';
import ViewSelector from '@/components/shared/ViewSelector';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  List,
  Download,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const SavedFiltersSchema = z.object({
  followUpOnly: z.boolean().optional(),
  profesionalId: z.string().optional(),
  vista: z.enum(['lista', 'kanban']).optional(),
}).strict();

const PacientesTable = lazy(() => import('@/components/pacientes/PacientesTable').then(m => ({ default: m.PacientesTable })));
const PacientesKanban = lazy(() => import('@/components/pacientes/PacientesKanban'));

type Vista = 'lista' | 'kanban';

function PacientesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [pacientesSeguimiento, setPacientesSeguimiento] = useState<Set<string>>(new Set());
  const [loadingSeguimientos, setLoadingSeguimientos] = useState(true);
  const [vista, setVista] = useState<Vista>('lista');

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'activo' | 'inactivo' | 'egresado'>('todos');
  const [riesgoFilter, setRiesgoFilter] = useState<'todos' | 'alto' | 'medio' | 'bajo'>('todos');
  const [followUpOnly, setFollowUpOnly] = useState(searchParams.get('filtro') === 'seguimiento');
  const [profesionalFilter, setProfesionalFilter] = useState<string>('todos');
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const STORAGE_KEY = 'pacientesFilters.v2';

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: profesionalesData = [], isLoading: loadingProfesionales } = useProfesionales();

  useEffect(() => {
    if (typeof window === 'undefined' || filtersLoaded) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const validation = SavedFiltersSchema.safeParse(parsed);

      if (!validation.success) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const saved = validation.data;

      if (saved.followUpOnly !== undefined && searchParams.get('filtro') !== 'seguimiento') {
        setFollowUpOnly(saved.followUpOnly);
      }
      if (saved.profesionalId) {
        setProfesionalFilter(saved.profesionalId);
      }
      if (saved.vista) {
        setVista(saved.vista);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setFiltersLoaded(true);
    }
  }, [filtersLoaded, searchParams]);

  useEffect(() => {
    if (!filtersLoaded || typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({
        followUpOnly,
        profesionalId: profesionalFilter,
        vista
      });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.warn('No se pudieron guardar los filtros', error);
    }
  }, [followUpOnly, profesionalFilter, vista, filtersLoaded]);

  useEffect(() => {
    if (!filtersLoaded) return;
    if (!user || profesionalesData.length === 0 || profesionalFilter !== 'todos') return;
    const profesional = profesionalesData.find((prof) => prof.email === user.email);
    if (profesional) {
      setProfesionalFilter(profesional.id);
    }
  }, [user, profesionalesData, profesionalFilter, filtersLoaded]);

  useEffect(() => {
    const cargarSeguimientos = async () => {
      setLoadingSeguimientos(true);
      try {
        const ids = await getPendingFollowUpPatientIds();
        setPacientesSeguimiento(ids);
      } catch (error) {
        console.error('Error al cargar seguimientos pendientes:', error);
      } finally {
        setLoadingSeguimientos(false);
      }
    };

    cargarSeguimientos();
  }, []);

  useEffect(() => {
    setFollowUpOnly(searchParams.get('filtro') === 'seguimiento');
  }, [searchParams]);

  const stats = useMemo(() => {
    const activos = pacientes.filter(p => p.estado === 'activo').length;
    const riesgoAlto = pacientes.filter(p => p.riesgo === 'alto').length;
    const total = pacientes.length;
    
    return {
      total,
      activos,
      riesgoAlto,
      seguimiento: pacientesSeguimiento.size,
    };
  }, [pacientes, pacientesSeguimiento]);

  const loading = loadingPacientes || loadingProfesionales || loadingSeguimientos;

  const handleExportar = () => {
    try {
      const datos = pacientes.map(p => ({
        'Nombre': p.nombre,
        'Apellidos': p.apellidos,
        'Documento': p.documentoId || '',
        'Teléfono': p.telefono || '',
        'Email': p.email || '',
        'Estado': p.estado,
        'Riesgo': p.riesgo || '',
        'Ciudad': p.ciudad || '',
        'Aseguradora': p.aseguradora || '',
      }));

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
      
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `pacientes_${fecha}.xlsx`);
      
      toast.success('Pacientes exportados correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar pacientes');
    }
  };

  if (loading && !filtersLoaded) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header compacto */}
      <div className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Pacientes</h1>
              <p className="text-sm text-gray-500">Gestión de fichas clínicas</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ViewSelector
              views={[
                { id: 'lista', label: 'Lista', icon: <List className="w-4 h-4" /> },
                { id: 'kanban', label: 'Kanban', icon: <LayoutGrid className="w-4 h-4" /> },
              ]}
              currentView={vista}
              onViewChange={(v) => setVista(v as Vista)}
            />

            <button
              onClick={handleExportar}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>

            <Link
              href="/dashboard/pacientes/nuevo"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </Link>
          </div>
        </div>

        {/* KPIs integrados en el header */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Activos</p>
              <p className="text-xl font-semibold text-gray-900">{stats.activos}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Riesgo Alto</p>
              <p className="text-xl font-semibold text-gray-900">{stats.riesgoAlto}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Seguimiento</p>
              <p className="text-xl font-semibold text-gray-900">{stats.seguimiento}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <Suspense fallback={<SkeletonLoader />}>
        {vista === 'lista' ? (
          <PacientesTable
            pacientes={pacientes}
            profesionales={profesionalesData}
            pacientesSeguimiento={pacientesSeguimiento}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            estadoFilter={estadoFilter}
            onEstadoFilterChange={(value) => setEstadoFilter(value as typeof estadoFilter)}
            riesgoFilter={riesgoFilter}
            onRiesgoFilterChange={(value) => setRiesgoFilter(value as typeof riesgoFilter)}
            followUpOnly={followUpOnly}
            onFollowUpOnlyChange={setFollowUpOnly}
            profesionalFilter={profesionalFilter}
            onProfesionalFilterChange={setProfesionalFilter}
            loading={loading}
          />
        ) : (
          <PacientesKanban
            pacientes={pacientes}
            profesionales={profesionalesData}
            pacientesSeguimiento={pacientesSeguimiento}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function PacientesPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <PacientesContent />
    </Suspense>
  );
}
