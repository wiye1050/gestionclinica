'use client';

import { useState, useMemo } from 'react';
import type { Proyecto, ProyectoTarea } from '@/types/proyectos';
import {
  CheckSquare,
  Circle,
  Clock,
  User,
  Calendar,
  Filter,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProyectoTareasTabProps {
  proyecto: Proyecto;
  onNuevaTarea?: () => void;
}

export default function ProyectoTareasTab({
  proyecto,
  onNuevaTarea,
}: ProyectoTareasTabProps) {
  const [filtroEstado, setFiltroEstado] = useState<ProyectoTarea['estado'] | 'todos'>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<ProyectoTarea['prioridad'] | 'todos'>('todos');

  const tareasFiltradas = useMemo(() => {
    return proyecto.tareas
      .filter((tarea) => {
        if (filtroEstado !== 'todos' && tarea.estado !== filtroEstado) return false;
        if (filtroPrioridad !== 'todos' && tarea.prioridad !== filtroPrioridad) return false;
        return true;
      })
      .sort((a, b) => {
        // Ordenar por estado primero (pendiente/en-curso primero)
        const estadoOrder = { 'pendiente': 0, 'en-curso': 1, 'bloqueada': 2, 'completada': 3 };
        const estadoDiff = estadoOrder[a.estado] - estadoOrder[b.estado];
        if (estadoDiff !== 0) return estadoDiff;

        // Luego por prioridad
        const prioridadOrder = { 'alta': 0, 'media': 1, 'baja': 2 };
        return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
      });
  }, [proyecto.tareas, filtroEstado, filtroPrioridad]);

  // Estadísticas
  const stats = {
    total: proyecto.tareas.length,
    pendientes: proyecto.tareas.filter((t) => t.estado === 'pendiente').length,
    enCurso: proyecto.tareas.filter((t) => t.estado === 'en-curso').length,
    bloqueadas: proyecto.tareas.filter((t) => t.estado === 'bloqueada').length,
    completadas: proyecto.tareas.filter((t) => t.estado === 'completada').length,
  };

  const getEstadoIcon = (estado: ProyectoTarea['estado']) => {
    switch (estado) {
      case 'completada':
        return <CheckSquare className="h-4 w-4 text-success" />;
      case 'en-curso':
        return <Circle className="h-4 w-4 text-brand" />;
      case 'bloqueada':
        return <Circle className="h-4 w-4 text-danger" />;
      default:
        return <Circle className="h-4 w-4 text-text-muted" />;
    }
  };

  const getEstadoColor = (estado: ProyectoTarea['estado']) => {
    switch (estado) {
      case 'completada':
        return 'border border-success bg-success-bg text-success';
      case 'en-curso':
        return 'border border-brand bg-brand-subtle text-brand';
      case 'bloqueada':
        return 'border border-danger bg-danger-bg text-danger';
      default:
        return 'border border-border bg-muted text-text';
    }
  };

  const getPrioridadColor = (prioridad: ProyectoTarea['prioridad']) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-danger text-white';
      case 'media':
        return 'bg-warn text-white';
      default:
        return 'bg-muted text-text';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-muted rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-text">{stats.total}</p>
          <p className="text-xs text-text-muted">Total</p>
        </div>
        <div className="bg-brand-subtle rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-brand">{stats.enCurso}</p>
          <p className="text-xs text-brand">En curso</p>
        </div>
        <div className="bg-success-bg rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-success">{stats.completadas}</p>
          <p className="text-xs text-success">Completadas</p>
        </div>
        <div className="bg-warn-bg rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-warn">{stats.pendientes}</p>
          <p className="text-xs text-warn">Pendientes</p>
        </div>
        <div className="bg-danger-bg rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-danger">{stats.bloqueadas}</p>
          <p className="text-xs text-danger">Bloqueadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-muted" />
            <h3 className="font-semibold text-text">Filtros</h3>
            {tareasFiltradas.length > 0 && (
              <span className="px-2 py-1 bg-brand-subtle text-brand rounded-full text-xs font-medium">
                {tareasFiltradas.length} tareas
              </span>
            )}
          </div>

          {onNuevaTarea && (
            <button
              onClick={onNuevaTarea}
              className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              <Plus className="w-4 h-4" />
              Nueva Tarea
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as ProyectoTarea['estado'] | 'todos')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en-curso">En curso</option>
            <option value="bloqueada">Bloqueada</option>
            <option value="completada">Completada</option>
          </select>

          {/* Filtro Prioridad */}
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value as ProyectoTarea['prioridad'] | 'todos')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Lista de tareas */}
      {tareasFiltradas.length === 0 ? (
        <div className="panel-block p-12 text-center shadow-sm">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 text-text-muted" />
          <p className="text-text-muted">No hay tareas que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tareasFiltradas.map((tarea) => (
            <div
              key={tarea.id}
              className="panel-block p-4 transition-shadow hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Estado icon */}
                <div className="flex-shrink-0 mt-1">
                  {getEstadoIcon(tarea.estado)}
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`text-base font-medium ${tarea.estado === 'completada' ? 'line-through text-text-muted' : 'text-text'}`}>
                      {tarea.titulo}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(tarea.prioridad)}`}>
                        {tarea.prioridad}
                      </span>
                      <span className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getEstadoColor(tarea.estado)}`}>
                        {tarea.estado}
                      </span>
                    </div>
                  </div>

                  {tarea.descripcion && (
                    <p className="text-sm text-text-muted mb-2 line-clamp-2">{tarea.descripcion}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                    {tarea.asignadoNombre && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{tarea.asignadoNombre}</span>
                      </div>
                    )}
                    {tarea.fechaLimite && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(tarea.fechaLimite), "d 'de' MMM", { locale: es })}</span>
                      </div>
                    )}
                    {tarea.estimacionHoras && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{tarea.estimacionHoras}h estimadas</span>
                      </div>
                    )}
                  </div>

                  {tarea.tags && tarea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tarea.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded-full bg-muted text-text text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
