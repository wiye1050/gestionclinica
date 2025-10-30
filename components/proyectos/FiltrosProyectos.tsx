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
  onFiltroChange: (filtros: any) => void;
  responsables: Array<{ uid: string; nombre: string }>;
}

export default function FiltrosProyectos({ filtros, onFiltroChange, responsables }: FiltrosProyectosProps) {
  const actualizarFiltro = (campo: string, valor: any) => {
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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
              placeholder="Nombre, descripción..."
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => actualizarFiltro('estado', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => actualizarFiltro('tipo', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prioridad
          </label>
          <select
            value={filtros.prioridad}
            onChange={(e) => actualizarFiltro('prioridad', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-blue-500 focus:border-transparent"
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Responsable
          </label>
          <select
            value={filtros.responsable}
            onChange={(e) => actualizarFiltro('responsable', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
