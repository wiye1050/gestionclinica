'use client';

import { EstadoProyecto, TipoProyecto, PrioridadProyecto } from '@/types/proyectos';
import { Search, X } from 'lucide-react';

interface FiltrosProyectosProps {
  filtros: {
    busqueda: string;
    estado: EstadoProyecto | 'todos';
    tipo: TipoProyecto | 'todos';
    prioridad: PrioridadProyecto | 'todos';
    responsable: string;
  };
  onFiltroChange: (filtros: FiltrosProyectosProps['filtros']) => void;
  responsables: Array<{ uid: string; nombre: string }>;
}

export default function FiltrosProyectos({ filtros, onFiltroChange, responsables }: FiltrosProyectosProps) {
  const actualizarFiltro = <K extends keyof FiltrosProyectosProps['filtros']>(campo: K, valor: FiltrosProyectosProps['filtros'][K]) => {
    onFiltroChange({ ...filtros, [campo]: valor });
  };

  const limpiarFiltros = () => {
    onFiltroChange({
      busqueda: '',
      estado: 'todos',
      tipo: 'todos',
      prioridad: 'todos',
      responsable: 'todos',
    });
  };

  const hayFiltrosActivos = 
    filtros.busqueda !== '' ||
    filtros.estado !== 'todos' ||
    filtros.tipo !== 'todos' ||
    filtros.prioridad !== 'todos' ||
    filtros.responsable !== 'todos';

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-text mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
              placeholder="Nombre, descripción..."
              className="w-full rounded-xl border border-border bg-card py-2 pl-10 pr-3 text-sm focus-visible:focus-ring"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => actualizarFiltro('estado', e.target.value as FiltrosProyectosProps['filtros']['estado'])}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos</option>
            <option value="propuesta">Propuesta</option>
            <option value="planificacion">Planificación</option>
            <option value="en-curso">En Curso</option>
            <option value="pausado">Pausado</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Tipo
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => actualizarFiltro('tipo', e.target.value as FiltrosProyectosProps['filtros']['tipo'])}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos</option>
            <option value="desarrollo">Desarrollo</option>
            <option value="operacional">Operacional</option>
            <option value="investigacion">Investigación</option>
            <option value="marketing">Marketing</option>
            <option value="mejora">Mejora</option>
            <option value="infraestructura">Infraestructura</option>
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Prioridad
          </label>
          <select
            value={filtros.prioridad}
            onChange={(e) => actualizarFiltro('prioridad', e.target.value as FiltrosProyectosProps['filtros']['prioridad'])}
            className="w-full px-3 py-2 text-sm border border-border rounded-2xl focus:ring-2 focus:ring-blue-blue-500 focus:border-transparent"
          >
            <option value="todos">Todas</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        {/* Responsable */}
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Responsable
          </label>
          <select
            value={filtros.responsable}
            onChange={(e) => actualizarFiltro('responsable', e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos</option>
            {responsables.map((r) => (
              <option key={r.uid} value={r.uid}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Botón limpiar - en línea separada si hay filtros */}
      {hayFiltrosActivos && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover"
          >
            <X className="w-4 h-4" />
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
