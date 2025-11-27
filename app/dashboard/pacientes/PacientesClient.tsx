'use client';

import { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import { startOfWeek, isSameDay } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { useInfinitePacientes, type PacientesResult } from '@/lib/hooks/usePacientes';
import { useEventosAgenda } from '@/lib/hooks/useQueries';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';
import { getPendingFollowUpPatientIds } from '@/lib/utils/followUps';
import ModuleHeader from '@/components/shared/ModuleHeader';
import StatCard from '@/components/shared/StatCard';
import ViewSelector from '@/components/shared/ViewSelector';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import CrossModuleAlert from '@/components/shared/CrossModuleAlert';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  List,
  Download,
  Upload,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface PacientesClientProps {
  initialPage: PacientesResult;
}

// Esquema de validación para localStorage
const SavedFiltersSchema = z.object({
  followUpOnly: z.boolean().optional(),
  profesionalId: z.string().optional(),
  vista: z.enum(['lista', 'kanban']).optional(),
}).strict();

// Lazy loading de componentes
const PacientesTable = lazy(() => import('@/components/pacientes/PacientesTable').then(m => ({ default: m.PacientesTable })));
const PacientesKanban = lazy(() => import('@/components/pacientes/PacientesKanban'));

type Vista = 'lista' | 'kanban';

function PacientesContent({ initialPage }: PacientesClientProps) {
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

  // Hooks con React Query
  const pacienteQueryFilters = useMemo(
    () => ({
      estado: estadoFilter === 'todos' ? undefined : estadoFilter,
      busqueda: searchTerm.trim() ? searchTerm.trim() : undefined,
    }),
    [estadoFilter, searchTerm]
  );

  const {
    data: pacientesPages,
    isLoading: loadingPacientes,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error: pacientesError,
  } = useInfinitePacientes(pacienteQueryFilters, { initialPage });

  const pacientes = useMemo(
    () => pacientesPages?.pages.flatMap((page) => page.items) ?? [],
    [pacientesPages]
  );
  const { data: profesionalesData = [], isLoading: loadingProfesionales } = useProfesionalesManager();
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const { data: eventosAgenda = [] } = useEventosAgenda(weekStart);
  const citasHoy = useMemo(
    () => eventosAgenda.filter((evento) => isSameDay(evento.fechaInicio, new Date())),
    [eventosAgenda]
  );

  // Cargar filtros guardados con validación Zod
  useEffect(() => {
    if (typeof window === 'undefined' || filtersLoaded) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      // Validar con Zod antes de usar
      const validation = SavedFiltersSchema.safeParse(parsed);

      if (!validation.success) {
        console.warn('Filtros guardados inválidos:', validation.error);
        // Limpiar localStorage corrupto
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
    } catch (err) {
      console.warn('Error cargando filtros guardados:', err);
      // Limpiar localStorage corrupto
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setFiltersLoaded(true);
    }
  }, [filtersLoaded, searchParams]);

  // Guardar filtros
  useEffect(() => {
    if (!filtersLoaded || typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({
        followUpOnly,
        profesionalId: profesionalFilter,
        vista
      });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (err) {
      console.warn('No se pudieron guardar los filtros', err);
    }
  }, [followUpOnly, profesionalFilter, vista, filtersLoaded]);

  // Auto-seleccionar profesional del usuario logueado
  useEffect(() => {
    if (!filtersLoaded) return;
    if (!user || profesionalesData.length === 0 || profesionalFilter !== 'todos') return;
    const profesional = profesionalesData.find((prof) => prof.email === user.email);
    if (profesional) {
      setProfesionalFilter(profesional.id);
    }
  }, [user, profesionalesData, profesionalFilter, filtersLoaded]);

  // Cargar seguimientos pendientes
  useEffect(() => {
    const cargarSeguimientos = async () => {
      setLoadingSeguimientos(true);
      try {
        const ids = await getPendingFollowUpPatientIds();
        setPacientesSeguimiento(ids);
      } catch (err) {
        console.error('Error al cargar seguimientos pendientes:', err);
      } finally {
        setLoadingSeguimientos(false);
      }
    };

    cargarSeguimientos();
  }, []);

  // Actualizar filtro desde URL
  useEffect(() => {
    setFollowUpOnly(searchParams.get('filtro') === 'seguimiento');
  }, [searchParams]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const activos = pacientes.filter(p => p.estado === 'activo').length;
    const riesgoAlto = pacientes.filter(p => p.riesgo === 'alto').length;
    const total = pacientes.length;
    const activosPct = total > 0 ? Math.round((activos / total) * 100) : 0;
    
    return {
      total,
      activos,
      riesgoAlto,
      seguimiento: pacientesSeguimiento.size,
      activosPct,
    };
  }, [pacientes, pacientesSeguimiento]);

  const baseLoading = loadingPacientes && pacientes.length === 0;
  const loading = baseLoading || loadingProfesionales || loadingSeguimientos;
  const pacientesErrorMessage =
    pacientesError instanceof Error ? pacientesError.message : undefined;

  // Exportar
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
    <div className="space-y-4">
      <ModuleHeader
        title="Pacientes"
        description="Gestiona las fichas, alertas y seguimientos de los pacientes"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/pacientes/importar"
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
            >
              <Upload className="h-4 w-4" />
              Importar
            </Link>
            <button
              onClick={handleExportar}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <Link
              href="/dashboard/pacientes/nuevo"
              className="btn-gradient rounded-pill px-5 py-2 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Nuevo paciente
            </Link>
          </div>
        }
        stats={
          <>
            <StatCard
              title="Total Pacientes"
              value={stats.total}
              icon={Users}
              color="blue"
              subtitle={`${stats.activos} activos`}
            />
            <StatCard
              title="Activos"
              value={stats.activos}
              icon={UserCheck}
              color="green"
              subtitle={`${stats.activosPct}% del total`}
            />
            <StatCard
              title="Riesgo Alto"
              value={stats.riesgoAlto}
              icon={AlertTriangle}
              color="red"
              subtitle="Requieren atención"
            />
            <StatCard
              title="Seguimiento"
              value={stats.seguimiento}
              icon={Calendar}
              color="yellow"
              subtitle="Pendientes de revisión"
            />
          </>
        }
      />

      {citasHoy.length > 0 && (
        <CrossModuleAlert
          title="Citas programadas para hoy"
          description={`Hay ${citasHoy.length} citas agendadas para hoy. Gestiona cambios o urgencias directamente en la agenda.`}
          actionLabel="Ir a Agenda"
          href="/dashboard/agenda"
          tone="info"
          chips={citasHoy
            .slice(0, 4)
            .map(
              (evento) =>
                evento.pacienteNombre ??
                evento.titulo ??
                `Cita ${evento.fechaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            )}
        />
      )}

      <ViewSelector
        views={[
          { id: 'lista', label: 'Lista', icon: <List className="w-4 h-4" /> },
          { id: 'kanban', label: 'Kanban', icon: <LayoutGrid className="w-4 h-4" /> },
        ]}
        currentView={vista}
        onViewChange={(v) => setVista(v as Vista)}
        counter={{
          current: pacientes.length,
          total: pacientes.length
        }}
      />

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
            error={pacientesErrorMessage}
          />
        ) : (
          <PacientesKanban
            pacientes={pacientes}
            profesionales={profesionalesData}
            pacientesSeguimiento={pacientesSeguimiento}
          />
        )}
      </Suspense>

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-pill border border-border px-6 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar más pacientes'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PacientesClient({ initialPage }: PacientesClientProps) {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <PacientesContent initialPage={initialPage} />
    </Suspense>
  );
}
