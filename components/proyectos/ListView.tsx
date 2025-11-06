'use client';

import { Proyecto } from '@/types/proyectos';
import { Calendar, User, BarChart3, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ListViewProps {
  proyectos: Proyecto[];
  onProyectoClick: (proyecto: Proyecto) => void;
}

const COLORES_ESTADO = {
  propuesta: 'bg-gray-100 text-gray-700',
  planificacion: 'bg-blue-100 text-blue-700',
  'en-curso': 'bg-yellow-100 text-yellow-700',
  pausado: 'bg-orange-100 text-orange-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
};

const COLORES_PRIORIDAD = {
  critica: 'text-red-600',
  alta: 'text-orange-600',
  media: 'text-yellow-600',
  baja: 'text-gray-600',
};

export default function ListView({ proyectos, onProyectoClick }: ListViewProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proyecto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progreso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responsable
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Estimada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tareas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proyectos.map((proyecto) => {
              const tareasCompletadas = proyecto.tareas?.filter(t => t.estado === 'completada').length || 0;
              const totalTareas = proyecto.tareas?.length || 0;

              return (
                <tr
                  key={proyecto.id}
                  onClick={() => onProyectoClick(proyecto)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* Proyecto */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {proyecto.nombre}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                          {proyecto.descripcion}
                        </div>
                        {proyecto.tags && proyecto.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {proyecto.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                            {proyecto.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{proyecto.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${COLORES_ESTADO[proyecto.estado]}`}>
                      {proyecto.estado.replace('-', ' ')}
                    </span>
                  </td>

                  {/* Prioridad */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${COLORES_PRIORIDAD[proyecto.prioridad]}`}>
                      {proyecto.prioridad}
                    </span>
                  </td>

                  {/* Progreso */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[80px]">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            proyecto.progreso === 100 ? 'bg-green-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${proyecto.progreso}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-[40px] text-right">
                        {proyecto.progreso}%
                      </span>
                    </div>
                  </td>

                  {/* Responsable */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-sm text-gray-900">
                        {proyecto.responsableNombre}
                      </div>
                    </div>
                  </td>

                  {/* Fecha */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {proyecto.fechaFinEstimada && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {format(proyecto.fechaFinEstimada, 'dd MMM yyyy', { locale: es })}
                      </div>
                    )}
                  </td>

                  {/* Tareas */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4" />
                      <span>
                        {tareasCompletadas}/{totalTareas}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {proyectos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay proyectos que coincidan con los filtros
        </div>
      )}
    </div>
  );
}
