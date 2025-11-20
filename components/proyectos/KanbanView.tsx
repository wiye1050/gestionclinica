'use client';

import { useState } from 'react';
import { Proyecto, EstadoProyecto } from '@/types/proyectos';
import { GripVertical, Plus, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KanbanViewProps {
  proyectos: Proyecto[];
  onProyectoClick: (proyecto: Proyecto) => void;
  onNuevoProyecto: () => void;
}

const COLUMNAS: { estado: EstadoProyecto; titulo: string; color: string }[] = [
  { estado: 'propuesta', titulo: 'Propuesta', color: 'bg-gray-100 border-gray-300' },
  { estado: 'planificacion', titulo: 'Planificación', color: 'bg-blue-100 border-blue-300' },
  { estado: 'en-curso', titulo: 'En Curso', color: 'bg-yellow-100 border-yellow-300' },
  { estado: 'pausado', titulo: 'Pausado', color: 'bg-orange-100 border-orange-300' },
  { estado: 'completado', titulo: 'Completado', color: 'bg-green-100 border-green-300' },
  { estado: 'cancelado', titulo: 'Cancelado', color: 'bg-red-100 border-red-300' },
];

const COLORES_PRIORIDAD = {
  critica: 'border-l-4 border-l-red-500',
  alta: 'border-l-4 border-l-orange-500',
  media: 'border-l-4 border-l-yellow-500',
  baja: 'border-l-4 border-l-gray-400',
};

export default function KanbanView({ proyectos, onProyectoClick, onNuevoProyecto }: KanbanViewProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const proyectosPorColumna = (estado: EstadoProyecto) =>
    proyectos.filter((p) => p.estado === estado);

  const handleDragStart = (e: React.DragEvent, proyectoId: string) => {
    setDraggedId(proyectoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, nuevoEstado: EstadoProyecto) => {
    e.preventDefault();
    if (draggedId) {
      // TODO: Implementar actualización de estado vía hook
      setDraggedId(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
      {COLUMNAS.map((columna) => {
        const proyectosColumna = proyectosPorColumna(columna.estado);
        
        return (
          <div
            key={columna.estado}
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, columna.estado)}
          >
            {/* Header de columna */}
            <div className={`p-3 rounded-t-lg border-2 ${columna.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  {columna.titulo}
                </h3>
                <span className="bg-white px-2 py-1 rounded-full text-xs font-medium">
                  {proyectosColumna.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-lg p-2 space-y-2 overflow-y-auto">
              {proyectosColumna.map((proyecto) => (
                <div
                  key={proyecto.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, proyecto.id)}
                  onClick={() => onProyectoClick(proyecto)}
                  className={`
                    bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer
                    ${COLORES_PRIORIDAD[proyecto.prioridad]}
                    ${draggedId === proyecto.id ? 'opacity-50' : ''}
                  `}
                >
                  {/* Grip */}
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {/* Título */}
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                        {proyecto.nombre}
                      </h4>

                      {/* Tipo */}
                      <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded mb-2">
                        {proyecto.tipo}
                      </span>

                      {/* Progreso */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progreso</span>
                          <span className="font-medium">{proyecto.progreso}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${proyecto.progreso}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {proyecto.fechaFinEstimada && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(proyecto.fechaFinEstimada, 'dd MMM', { locale: es })}
                            </span>
                          </div>
                        )}
                        {proyecto.responsableNombre && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">
                              {proyecto.responsableNombre}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {proyecto.tags && proyecto.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proyecto.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {proyecto.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{proyecto.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Botón añadir en columna */}
              {columna.estado === 'propuesta' && (
                <button
                  onClick={onNuevoProyecto}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Proyecto
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
