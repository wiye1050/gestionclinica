'use client';

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePacientes } from '@/lib/hooks/usePacientes';
import { useProfesionales } from '@/lib/hooks/useQueries';
import { getPendingFollowUpPatientIds } from '@/lib/utils/followUps';
import ModuleHeader from '@/components/shared/ModuleHeader';
import StatCard from '@/components/shared/StatCard';
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
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Paciente } from '@/types';

const PacientesTable = lazy(() =>
  import('@/components/pacientes/PacientesTable').then((m) => ({ default: m.PacientesTable }))
);
const PacientesKanban = lazy(() => import('@/components/pacientes/PacientesKanban'));

type Vista = 'lista' | 'kanban';

interface PacientesClientProps {
  initialPacientes: Paciente[];
}

export default function PacientesClient({ initialPacientes }: PacientesClientProps) {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [pacientesSeguimiento, setPacientesSeguimiento] = useState<Set<string>>(new Set());
  const [loadingSeguimientos, setLoadingSeguimientos] = useState(true);
  const [vista, setVista] = useState<Vista>('lista');

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'activo' | 'inactivo' | 'egresado'>(
    'todos'
  );
  const [riesgoFilter, setRiesgoFilter] = useState<'todos' | 'alto' | 'medio' | 'bajo'>('todos');
  const [followUpOnly, setFollowUpOnly] = useState(searchParams.get('filtro') === 'seguimiento');
  const [profesionalFilter, setProfesionalFilter] = useState<string>('todos');
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const STORAGE_KEY = 'pacientesFilters.v2';

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes(undefined, {
    initialData: initialPacientes,
  });
  const { data: profesionalesData = [], isLoading: loadingProfesionales } = useProfesionales();

  useEffect(() => {
    if (typeof window === 'undefined' || filtersLoaded) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved) {
        if (saved.followUpOnly !== undefined && searchParams.get('filtro') !== 'seguimiento') {
          setFollowUpOnly(Boolean(saved.followUpOnly));
        }
        if (saved.profesionalId) {
          setProfesionalFilter(saved.profesionalId);
        }
        if (saved.vista) {
          setVista(saved.vista);
        }
      }
    } catch (err) {
      console.warn('No se pudieron cargar los filtros guardados', err);
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
        vista,
      });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (err) {
      console.warn('No se pudieron guardar los filtros', err);
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
      } catch (err) {
        console.error('Error al cargar seguimientos pendientes:', err);
      } finally {
        setLoadingSeguimientos(false);
      }
    };

    void cargarSeguimientos();
  }, []);

  useEffect(() => {
    setFollowUpOnly(searchParams.get('filtro') === 'seguimiento');
  }, [searchParams]);

  const stats = useMemo(() => {
    const activos = pacientes.filter((p) => p.estado === 'activo').length;
    const riesgoAlto = pacientes.filter((p) => p.riesgo === 'alto').length;
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

  const loading = loadingPacientes || loadingProfesionales || loadingSeguimientos;

  const handleExportar = async () => {
    try {
      const XLSX = await import('xlsx');
      const datos = pacientes.map((p) => ({
        Nombre: p.nombre,
        Apellidos: p.apellidos,
        Documento: p.documentoId || '',
        Teléfono: p.telefono || '',
        Email: p.email || '',
        Estado: p.estado,
        Riesgo: p.riesgo || '',
        Ciudad: p.ciudad || '',
        Aseguradora: p.aseguradora || '',
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
            <button
              onClick={handleExportar}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <Link
              href="/dashboard/pacientes/nuevo"
              className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-brand/90 focus-visible:focus-ring"
            >
              <Plus className="h-4 w-4" />
              Nuevo
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
              subtitle={followUpOnly ? 'Filtrando seguimiento' : 'Pendientes de revisión'}
            />
          </>
        }
      />

      <ViewSelector
        views={[
          { id: 'lista', label: 'Lista', icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'kanban', label: 'Kanban', icon: <List className="h-4 w-4" /> },
        ]}
        currentView={vista}
        onViewChange={(view) => setVista(view as Vista)}
        counter={{
          current: pacientes.length,
          total: pacientes.length,
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
          />
        ) : (
          <PacientesKanban
            pacientes={pacientes}
            pacientesSeguimiento={pacientesSeguimiento}
            profesionales={profesionalesData}
          />
        )}
      </Suspense>
    </div>
  );
}
