'use client';

import { useMemo, useState } from 'react';
import { LayoutGrid, List, GanttChart, Plus, Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import ModuleHeader from '@/components/shared/ModuleHeader';
import ViewSelector from '@/components/shared/ViewSelector';
import KanbanView from '@/components/proyectos/KanbanView';
import ListView from '@/components/proyectos/ListView';
import GanttView from '@/components/proyectos/GanttView';
import ProyectoDetalle from '@/components/proyectos/ProyectoDetalle';
import ProyectoForm from '@/components/proyectos/ProyectoForm';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useProyectos } from '@/lib/hooks/useProyectos';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';
import type {
  Proyecto,
  EstadoProyecto,
  TipoProyecto,
  PrioridadProyecto,
} from '@/types/proyectos';

type VistaProyecto = 'kanban' | 'lista' | 'gantt';
type EstadoFiltro = EstadoProyecto | 'todos';
type TipoFiltro = TipoProyecto | 'todos';
type PrioridadFiltro = PrioridadProyecto | 'todos';

type FiltrosProyectosState = {
  busqueda: string;
  estado: EstadoFiltro;
  tipo: TipoFiltro;
  prioridad: PrioridadFiltro;
  responsable: string;
};

type ProyectoPayload = Partial<Proyecto> & { id?: string };

interface ProyectosClientProps {
  initialProyectos: Proyecto[];
}

export default function ProyectosClient({ initialProyectos }: ProyectosClientProps) {
  const {
    proyectos,
    estadisticas,
    isLoading,
    crearProyecto,
    actualizarProyecto,
    eliminarProyecto,
  } = useProyectos({ initialData: initialProyectos });
  const { data: profesionalesData = [] } = useProfesionalesManager();

  const [vista, setVista] = useState<VistaProyecto>('kanban');
  const [mostrarKPIs, setMostrarKPIs] = useState(true);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [proyectoEditar, setProyectoEditar] = useState<Proyecto | null>(null);
  const [filtros, setFiltros] = useState<FiltrosProyectosState>({
    busqueda: '',
    estado: 'todos',
    tipo: 'todos',
    prioridad: 'todos',
    responsable: 'todos',
  });

  const responsables = useMemo(
    () =>
      profesionalesData.map((p) => ({
        uid: p.id,
        nombre: `${p.nombre} ${p.apellidos}`,
      })),
    [profesionalesData]
  );

  const responsableOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos los responsables' },
      ...responsables.map((resp) => ({ value: resp.uid, label: resp.nombre })),
    ],
    [responsables]
  );

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((proyecto) => {
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincide =
          proyecto.nombre.toLowerCase().includes(busqueda) ||
          proyecto.descripcion.toLowerCase().includes(busqueda) ||
          proyecto.tags?.some((tag) => tag.toLowerCase().includes(busqueda));
        if (!coincide) return false;
      }

      if (filtros.estado !== 'todos' && proyecto.estado !== filtros.estado) {
        return false;
      }

      if (filtros.tipo !== 'todos' && proyecto.tipo !== filtros.tipo) {
        return false;
      }

      if (filtros.prioridad !== 'todos' && proyecto.prioridad !== filtros.prioridad) {
        return false;
      }

      if (filtros.responsable !== 'todos' && proyecto.responsableUid !== filtros.responsable) {
        return false;
      }

      return true;
    });
  }, [proyectos, filtros]);

  const activeFilters: ActiveFilterChip[] = [];
  if (filtros.busqueda.trim()) {
    activeFilters.push({
      id: 'busqueda',
      label: 'Búsqueda',
      value: filtros.busqueda,
      onRemove: () => setFiltros((prev) => ({ ...prev, busqueda: '' })),
    });
  }
  if (filtros.estado !== 'todos') {
    activeFilters.push({
      id: 'estado',
      label: 'Estado',
      value: filtros.estado,
      onRemove: () => setFiltros((prev) => ({ ...prev, estado: 'todos' })),
    });
  }
  if (filtros.tipo !== 'todos') {
    activeFilters.push({
      id: 'tipo',
      label: 'Tipo',
      value: filtros.tipo,
      onRemove: () => setFiltros((prev) => ({ ...prev, tipo: 'todos' })),
    });
  }
  if (filtros.prioridad !== 'todos') {
    activeFilters.push({
      id: 'prioridad',
      label: 'Prioridad',
      value: filtros.prioridad,
      onRemove: () => setFiltros((prev) => ({ ...prev, prioridad: 'todos' })),
    });
  }
  if (filtros.responsable !== 'todos') {
    const respLabel = responsableOptions.find((opt) => opt.value === filtros.responsable)?.label;
    activeFilters.push({
      id: 'responsable',
      label: 'Responsable',
      value: respLabel ?? 'Responsable',
      onRemove: () => setFiltros((prev) => ({ ...prev, responsable: 'todos' })),
    });
  }

  const clearFiltros = () =>
    setFiltros({ busqueda: '', estado: 'todos', tipo: 'todos', prioridad: 'todos', responsable: 'todos' });

  const kpiItems = useMemo(
    () => [
      {
        id: 'total',
        label: 'Total proyectos',
        value: estadisticas.totalProyectos,
        helper: 'Registrados',
        accent: 'brand' as const,
      },
      {
        id: 'encurso',
        label: 'En curso',
        value: estadisticas.porEstado['en-curso'],
        helper: 'Activos',
        accent: 'blue' as const,
      },
      {
        id: 'completados',
        label: 'Completados',
        value: estadisticas.porEstado.completado,
        helper: 'Finalizados',
        accent: 'green' as const,
      },
      {
        id: 'riesgo',
        label: 'En riesgo',
        value: estadisticas.proyectosEnRiesgo,
        helper: 'Prioridad alta',
        accent: 'purple' as const,
      },
      {
        id: 'atrasados',
        label: 'Atrasados',
        value: estadisticas.proyectosAtrasados,
        helper: 'Fuera de plazo',
        accent: 'red' as const,
      },
      {
        id: 'progreso',
        label: 'Progreso medio',
        value: `${estadisticas.progresoPromedio}%`,
        helper: 'Promedio global',
        accent: 'gray' as const,
      },
    ],
    [estadisticas]
  );

  const handleExportar = async () => {
    try {
      const XLSX = await import('xlsx');
      const datos = proyectosFiltrados.map((p) => ({
        Nombre: p.nombre,
        Descripción: p.descripcion,
        Tipo: p.tipo,
        Estado: p.estado,
        Prioridad: p.prioridad,
        Progreso: `${p.progreso}%`,
        Responsable: p.responsableNombre,
        'Fecha Inicio': p.fechaInicio ? new Date(p.fechaInicio).toLocaleDateString('es-ES') : '',
        'Fecha Fin Estimada': p.fechaFinEstimada
          ? new Date(p.fechaFinEstimada).toLocaleDateString('es-ES')
          : '',
        Presupuesto: p.presupuesto || 0,
        'Horas Estimadas': p.horasEstimadas || 0,
        'Tareas Totales': p.tareas?.length || 0,
        'Tareas Completadas': p.tareas?.filter((t) => t.estado === 'completada').length || 0,
        'Hitos Totales': p.hitos?.length || 0,
        'Hitos Completados': p.hitos?.filter((h) => h.completado).length || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');

      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `proyectos_${fecha}.xlsx`);

      toast.success('Proyectos exportados correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar proyectos');
    }
  };

  const handleGuardarProyecto = async (datos: ProyectoPayload) => {
    try {
      if (datos.id) {
        await actualizarProyecto.mutateAsync({ id: datos.id, datos });
        toast.success('Proyecto actualizado correctamente');
      } else {
        await crearProyecto.mutateAsync(datos as Omit<Proyecto, 'id'>);
        toast.success('Proyecto creado correctamente');
      }
      setMostrarForm(false);
      setProyectoEditar(null);
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      toast.error('Error al guardar el proyecto');
    }
  };

  const handleEliminarProyecto = async (id: string) => {
    try {
      await eliminarProyecto.mutateAsync(id);
      toast.success('Proyecto eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-text-muted">Cargando proyectos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Proyectos"
        description="Gestión completa de proyectos del instituto"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarKPIs(!mostrarKPIs)}
              className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
                mostrarKPIs
                  ? 'border border-brand bg-brand text-text shadow-sm'
                  : 'border border-border bg-card text-text hover:bg-cardHover'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              KPIs
            </button>
            <button
              onClick={handleExportar}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => {
                setProyectoEditar(null);
                setMostrarForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-brand/90 focus-visible:focus-ring"
            >
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </button>
          </div>
        }
      />

      {mostrarKPIs && <KPIGrid items={kpiItems} />}

      <CompactFilters
        search={{
          value: filtros.busqueda,
          onChange: (value) => setFiltros((prev) => ({ ...prev, busqueda: value })),
          placeholder: 'Buscar por nombre, descripción o tag',
        }}
        selects={[
          {
            id: 'estado',
            label: 'Estado',
            value: filtros.estado,
            onChange: (value) => setFiltros((prev) => ({ ...prev, estado: value as EstadoFiltro })),
            options: [
              { value: 'todos', label: 'Todos los estados' },
              { value: 'propuesta', label: 'Propuesta' },
              { value: 'planificacion', label: 'Planificación' },
              { value: 'en-curso', label: 'En curso' },
              { value: 'pausado', label: 'Pausado' },
              { value: 'completado', label: 'Completado' },
              { value: 'cancelado', label: 'Cancelado' },
            ],
          },
          {
            id: 'tipo',
            label: 'Tipo',
            value: filtros.tipo,
            onChange: (value) => setFiltros((prev) => ({ ...prev, tipo: value as TipoFiltro })),
            options: [
              { value: 'todos', label: 'Todos los tipos' },
              { value: 'desarrollo', label: 'Desarrollo' },
              { value: 'operacional', label: 'Operacional' },
              { value: 'investigacion', label: 'Investigación' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'mejora', label: 'Mejora' },
              { value: 'infraestructura', label: 'Infraestructura' },
            ],
          },
          {
            id: 'prioridad',
            label: 'Prioridad',
            value: filtros.prioridad,
            onChange: (value) => setFiltros((prev) => ({ ...prev, prioridad: value as PrioridadFiltro })),
            options: [
              { value: 'todos', label: 'Todas' },
              { value: 'critica', label: 'Crítica' },
              { value: 'alta', label: 'Alta' },
              { value: 'media', label: 'Media' },
              { value: 'baja', label: 'Baja' },
            ],
          },
          {
            id: 'responsable',
            label: 'Responsable',
            value: filtros.responsable,
            onChange: (value) => setFiltros((prev) => ({ ...prev, responsable: value })),
            options: responsableOptions,
          },
        ]}
        activeFilters={activeFilters}
        onClear={activeFilters.length ? clearFiltros : undefined}
      />

      <ViewSelector
        views={[
          { id: 'kanban', label: 'Kanban', icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'lista', label: 'Lista', icon: <List className="h-4 w-4" /> },
          { id: 'gantt', label: 'Gantt', icon: <GanttChart className="h-4 w-4" /> },
        ]}
        currentView={vista}
        onViewChange={(value) => setVista(value as VistaProyecto)}
      />

      {vista === 'kanban' && (
        <KanbanView
          proyectos={proyectosFiltrados}
          onProyectoClick={setProyectoSeleccionado}
          onNuevoProyecto={() => {
            setProyectoEditar(null);
            setProyectoSeleccionado(null);
            setMostrarForm(true);
          }}
        />
      )}

      {vista === 'lista' && (
        <ListView
          proyectos={proyectosFiltrados}
          onProyectoClick={setProyectoSeleccionado}
        />
      )}

      {vista === 'gantt' && (
        <GanttView
          proyectos={proyectosFiltrados}
          onProyectoClick={(proyecto) => setProyectoSeleccionado(proyecto)}
        />
      )}

      {proyectoSeleccionado && (
        <ProyectoDetalle
          proyecto={proyectoSeleccionado}
          onClose={() => setProyectoSeleccionado(null)}
          onEditar={(proyecto) => {
            setProyectoEditar(proyecto);
            setMostrarForm(true);
          }}
          onEliminar={handleEliminarProyecto}
        />
      )}

      {mostrarForm && (
        <ProyectoForm
          proyecto={proyectoEditar}
          onClose={() => {
            setMostrarForm(false);
            setProyectoEditar(null);
          }}
          onGuardar={handleGuardarProyecto}
          profesionales={responsables}
        />
      )}
    </div>
  );
}
