'use client';

import { useState, useMemo } from 'react';
import { useProyectos } from '@/lib/hooks/useProyectos';
import { useProfesionales } from '@/lib/hooks/useQueries';
import type { Proyecto, EstadoProyecto, TipoProyecto, PrioridadProyecto } from '@/types/proyectos';
import KanbanView from '@/components/proyectos/KanbanView';
import ListView from '@/components/proyectos/ListView';
import GanttView from '@/components/proyectos/GanttView';
import FiltrosProyectos from '@/components/proyectos/FiltrosProyectos';
import KPIsProyectos from '@/components/proyectos/KPIsProyectos';
import ProyectoDetalle from '@/components/proyectos/ProyectoDetalle';
import ProyectoForm from '@/components/proyectos/ProyectoForm';
import { LayoutGrid, List, GanttChart, Plus, Download, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import ModuleHeader from '@/components/shared/ModuleHeader';
import ViewSelector from '@/components/shared/ViewSelector';
import { LoadingSpinner } from '@/components/ui/Loading';

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

export default function ProyectosPage() {
  const { proyectos, estadisticas, isLoading, crearProyecto, actualizarProyecto, eliminarProyecto } = useProyectos();
  const { data: profesionalesData = [] } = useProfesionales();
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

  // Obtener lista de responsables desde profesionales
  const responsables = useMemo(() => {
    return profesionalesData.map(p => ({
      uid: p.id,
      nombre: `${p.nombre} ${p.apellidos}`,
    }));
  }, [profesionalesData]);

  // Aplicar filtros
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(proyecto => {
      // Búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincide = 
          proyecto.nombre.toLowerCase().includes(busqueda) ||
          proyecto.descripcion.toLowerCase().includes(busqueda) ||
          proyecto.tags?.some(tag => tag.toLowerCase().includes(busqueda));
        if (!coincide) return false;
      }

      // Estado
      if (filtros.estado !== 'todos' && proyecto.estado !== filtros.estado) {
        return false;
      }

      // Tipo
      if (filtros.tipo !== 'todos' && proyecto.tipo !== filtros.tipo) {
        return false;
      }

      // Prioridad
      if (filtros.prioridad !== 'todos' && proyecto.prioridad !== filtros.prioridad) {
        return false;
      }

      // Responsable
      if (filtros.responsable !== 'todos' && proyecto.responsableUid !== filtros.responsable) {
        return false;
      }

      return true;
    });
  }, [proyectos, filtros]);

  const handleProyectoClick = (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
  };

  const handleNuevoProyecto = () => {
    setProyectoEditar(null);
    setMostrarForm(true);
  };

  const handleEditarProyecto = (proyecto: Proyecto) => {
    setProyectoEditar(proyecto);
    setProyectoSeleccionado(null);
    setMostrarForm(true);
  };

  const handleGuardarProyecto = async (datos: ProyectoPayload) => {
    try {
      if (datos.id) {
        // Editar
        await actualizarProyecto.mutateAsync({ id: datos.id, datos });
        toast.success('Proyecto actualizado correctamente');
      } else {
        // Crear
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

  const handleExportar = () => {
    try {
      const datos = proyectosFiltrados.map(p => ({
        'Nombre': p.nombre,
        'Descripción': p.descripcion,
        'Tipo': p.tipo,
        'Estado': p.estado,
        'Prioridad': p.prioridad,
        'Progreso': `${p.progreso}%`,
        'Responsable': p.responsableNombre,
        'Fecha Inicio': p.fechaInicio ? new Date(p.fechaInicio).toLocaleDateString('es-ES') : '',
        'Fecha Fin Estimada': p.fechaFinEstimada ? new Date(p.fechaFinEstimada).toLocaleDateString('es-ES') : '',
        'Presupuesto': p.presupuesto || 0,
        'Horas Estimadas': p.horasEstimadas || 0,
        'Tareas Totales': p.tareas?.length || 0,
        'Tareas Completadas': p.tareas?.filter(t => t.estado === 'completada').length || 0,
        'Hitos Totales': p.hitos?.length || 0,
        'Hitos Completados': p.hitos?.filter(h => h.completado).length || 0,
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
              className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${mostrarKPIs ? 'border border-brand bg-brand text-white shadow-sm' : 'border border-border bg-card text-text hover:bg-cardHover'}`}
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
              onClick={handleNuevoProyecto}
              className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:focus-ring"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
          </div>
        }
      />

      {/* KPIs */}
      {mostrarKPIs && (
        <KPIsProyectos estadisticas={estadisticas} />
      )}

      {/* Filtros */}
      <FiltrosProyectos
        filtros={filtros}
        onFiltroChange={setFiltros}
        responsables={responsables}
      />

      {/* Selector de Vista */}
      <ViewSelector
        views={[
          { id: 'kanban', label: 'Kanban', icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'lista', label: 'Lista', icon: <List className="h-4 w-4" /> },
          { id: 'gantt', label: 'Gantt', icon: <GanttChart className="h-4 w-4" /> },
        ]}
        currentView={vista}
        onViewChange={(v) => setVista(v as VistaProyecto)}
        counter={{ current: proyectosFiltrados.length, total: proyectos.length }}
      />

      {/* Vista Seleccionada */}
      {vista === 'kanban' && (
        <KanbanView
          proyectos={proyectosFiltrados}
          onProyectoClick={handleProyectoClick}
          onNuevoProyecto={handleNuevoProyecto}
        />
      )}

      {vista === 'lista' && (
        <ListView
          proyectos={proyectosFiltrados}
          onProyectoClick={handleProyectoClick}
        />
      )}

      {vista === 'gantt' && (
        <GanttView
          proyectos={proyectosFiltrados}
          onProyectoClick={handleProyectoClick}
        />
      )}

      {/* Modal de Detalle */}
      {proyectoSeleccionado && (
        <ProyectoDetalle
          proyecto={proyectoSeleccionado}
          onClose={() => setProyectoSeleccionado(null)}
          onEditar={handleEditarProyecto}
          onEliminar={handleEliminarProyecto}
        />
      )}

      {/* Modal de Formulario */}
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
