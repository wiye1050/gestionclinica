'use client';

import { useMemo } from 'react';
import { Proyecto } from '@/types/proyectos';
import { format, differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface GanttViewProps {
  proyectos: Proyecto[];
  onProyectoClick: (proyecto: Proyecto) => void;
}

export default function GanttView({ proyectos, onProyectoClick }: GanttViewProps) {
  // Calcular el rango de fechas
  const { fechaMin, fechaMax, totalDias } = useMemo(() => {
    const proyectosConFechas = proyectos.filter(p => p.fechaInicio && p.fechaFinEstimada);
    
    if (proyectosConFechas.length === 0) {
      const hoy = new Date();
      return {
        fechaMin: hoy,
        fechaMax: new Date(hoy.getTime() + 90 * 24 * 60 * 60 * 1000),
        totalDias: 90,
      };
    }

    const fechas = proyectosConFechas.flatMap(p => [
      p.fechaInicio!,
      p.fechaFinEstimada!,
    ]);

    const min = new Date(Math.min(...fechas.map(f => f.getTime())));
    const max = new Date(Math.max(...fechas.map(f => f.getTime())));

    return {
      fechaMin: startOfDay(min),
      fechaMax: startOfDay(max),
      totalDias: differenceInDays(max, min) + 1,
    };
  }, [proyectos]);

  // Generar meses para el header
  const meses = useMemo(() => {
    const resultado: Array<{ mes: string; diasEnVista: number }> = [];
    let fechaActual = new Date(fechaMin);
    
    while (isBefore(fechaActual, fechaMax)) {
      const mesActual = format(fechaActual, 'MMMM yyyy', { locale: es });
      const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
      
      const inicio = isBefore(primerDiaMes, fechaMin) ? fechaMin : primerDiaMes;
      const fin = isAfter(ultimoDiaMes, fechaMax) ? fechaMax : ultimoDiaMes;
      
      const diasEnVista = differenceInDays(fin, inicio) + 1;
      resultado.push({ mes: mesActual, diasEnVista });
      
      fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1);
    }
    
    return resultado;
  }, [fechaMin, fechaMax]);

  const calcularPosicionBarra = (proyecto: Proyecto) => {
    if (!proyecto.fechaInicio || !proyecto.fechaFinEstimada) return null;

    const inicio = differenceInDays(proyecto.fechaInicio, fechaMin);
    const duracion = differenceInDays(proyecto.fechaFinEstimada, proyecto.fechaInicio) + 1;
    
    const left = (inicio / totalDias) * 100;
    const width = (duracion / totalDias) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const hoy = new Date();
  const posicionHoy = ((differenceInDays(hoy, fechaMin) / totalDias) * 100);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header con meses */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {/* Columna de nombres */}
            <div className="w-64 flex-shrink-0 px-4 py-3 font-semibold text-sm text-gray-700 border-r border-gray-200">
              Proyecto
            </div>
            
            {/* Timeline de meses */}
            <div className="flex-1 flex">
              {meses.map((m, idx) => (
                <div
                  key={idx}
                  className="border-r border-gray-200 px-2 py-3 text-center text-sm font-medium text-gray-600"
                  style={{ width: `${(m.diasEnVista / totalDias) * 100}%` }}
                >
                  {m.mes}
                </div>
              ))}
            </div>
          </div>

          {/* Cuerpo */}
          <div className="divide-y divide-gray-200">
            {proyectos.map((proyecto) => {
              const posicion = calcularPosicionBarra(proyecto);
              
              return (
                <div
                  key={proyecto.id}
                  className="flex items-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onProyectoClick(proyecto)}
                >
                  {/* Columna de nombre */}
                  <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-gray-200">
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                      {proyecto.nombre}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {proyecto.responsableNombre}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 px-2 py-3 relative">
                    {/* Línea de hoy */}
                    {posicionHoy >= 0 && posicionHoy <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${posicionHoy}%` }}
                      >
                        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                      </div>
                    )}

                    {/* Barra de proyecto */}
                    {posicion && (
                      <div
                        className="absolute h-8 rounded-lg flex items-center px-2 shadow-sm transition-all"
                        style={{
                          ...posicion,
                          backgroundColor: proyecto.color || '#3b82f6',
                          opacity: proyecto.estado === 'completado' ? 0.7 : 0.9,
                        }}
                      >
                        <div className="text-xs font-medium text-white truncate">
                          {proyecto.progreso}%
                        </div>
                        
                        {/* Barra de progreso interna */}
                        <div
                          className="absolute inset-0 bg-white bg-opacity-30 rounded-lg"
                          style={{
                            width: `${100 - proyecto.progreso}%`,
                            right: 0,
                            left: 'auto',
                          }}
                        />
                      </div>
                    )}

                    {!posicion && (
                      <div className="text-xs text-gray-400 italic">
                        Sin fechas definidas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {proyectos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay proyectos para mostrar en el Gantt
        </div>
      )}
    </div>
  );
}
