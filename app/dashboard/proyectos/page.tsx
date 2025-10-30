'use client';

import { useState, useMemo } from 'react';
import { useProyectos } from '@/lib/hooks/useProyectos';
import { useProfesionales } from '@/lib/hooks/useQueries';
import { Proyecto } from '@/types/proyectos';
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

type VistaProyecto = 'kanban' | 'lista' | 'gantt';

export default function ProyectosPage() {
  const { proyectos, estadisticas, isLoading, crearProyecto, actualizarProyecto, eliminarProyecto } = useProyectos();
  const { data: profesionalesData = [] } = useProfesionales();
  const [vista, setVista] = useState<VistaProyecto>('kanban');
  const [mostrarKPIs, setMostrarKPIs] = useState(true);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [proyectoEditar, setProyectoEditar] = useState<Proyecto | null>(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos' as any,
    tipo: 'todos' as any,
    prioridad: 'todos' as any,
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

  const handleGuardarProyecto = async (datos: any) => {
    try {
      if (datos.id) {
        // Editar
        await actualizarProyecto.mutateAsync({ id: datos.id, datos });
        toast.success('Proyecto actualizado correctamente');
      } else {
        // Crear
        await crearProyecto.mutateAsync(datos);
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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Gestión completa de proyectos del instituto
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle KPIs */}
          <button
            onClick={() => setMostrarKPIs(!mostrarKPIs)}
            className={`
              px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2
              ${mostrarKPIs 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <BarChart3 className="w-4 h-4" />
            KPIs
          </button>

          {/* Exportar */}
          <button
            onClick={handleExportar}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>

          {/* Nuevo Proyecto */}
          <button
            onClick={handleNuevoProyecto}
            className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

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
      <div className="bg-white rounded-lg shadow p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVista('kanban')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
              ${vista === 'kanban' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>

          <button
            onClick={() => setVista('lista')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
              ${vista === 'lista' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <List className="w-4 h-4" />
            Lista
          </button>

          <button
            onClick={() => setVista('gantt')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
              ${vista === 'gantt' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <GanttChart className="w-4 h-4" />
            Gantt
          </button>
        </div>

        <div className="text-sm text-gray-600 font-medium">
          {proyectosFiltrados.length} de {proyectos.length}
        </div>
      </div>

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
