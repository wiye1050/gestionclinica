'use client';

import { EstadisticasProyectos } from '@/types/proyectos';
import { TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface KPIsProyectosProps {
  estadisticas: EstadisticasProyectos;
}

export default function KPIsProyectos({ estadisticas }: KPIsProyectosProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Distribución por Estado */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Por Estado
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Propuesta</span>
            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {estadisticas.porEstado.propuesta}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Planificación</span>
            <span className="font-medium text-gray-900 bg-blue-100 px-2 py-0.5 rounded">
              {estadisticas.porEstado.planificacion}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">En Curso</span>
            <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {estadisticas.porEstado['en-curso']}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Pausado</span>
            <span className="font-medium text-gray-900 bg-orange-100 px-2 py-0.5 rounded">
              {estadisticas.porEstado.pausado}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Completado</span>
            <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {estadisticas.porEstado.completado}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Cancelado</span>
            <span className="font-medium text-gray-900 bg-red-100 px-2 py-0.5 rounded">
              {estadisticas.porEstado.cancelado}
            </span>
          </div>
        </div>
      </div>

      {/* Distribución por Tipo */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Por Tipo
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Desarrollo</span>
            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {estadisticas.porTipo.desarrollo}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Operacional</span>
            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {estadisticas.porTipo.operacional}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Investigación</span>
            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {estadisticas.porTipo.investigacion}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Marketing</span>
            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {estadisticas.porTipo.marketing}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Mejora</span>
            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {estadisticas.porTipo.mejora}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Infraestructura</span>
            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {estadisticas.porTipo.infraestructura}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
