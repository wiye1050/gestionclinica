'use client';

import type { Proyecto } from '@/types/proyectos';
import { Users, User, CheckSquare, Mail } from 'lucide-react';

interface ProyectoEquipoTabProps {
  proyecto: Proyecto;
}

export default function ProyectoEquipoTab({ proyecto }: ProyectoEquipoTabProps) {
  const equipo = proyecto.equipo || [];

  // Calcular tareas por miembro
  const tareasEquipo = useMemo(() => {
    const map = new Map<string, { total: number; completadas: number; enCurso: number }>();

    // Inicializar con miembros del equipo
    equipo.forEach((miembro) => {
      map.set(miembro.uid, { total: 0, completadas: 0, enCurso: 0 });
    });

    // Contar tareas
    proyecto.tareas.forEach((tarea) => {
      if (tarea.asignadoA) {
        const stats = map.get(tarea.asignadoA) || { total: 0, completadas: 0, enCurso: 0 };
        stats.total++;
        if (tarea.estado === 'completada') stats.completadas++;
        if (tarea.estado === 'en-curso') stats.enCurso++;
        map.set(tarea.asignadoA, stats);
      }
    });

    return map;
  }, [equipo, proyecto.tareas]);

  return (
    <div className="space-y-6">
      {/* Header con responsable */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-text">Responsable del proyecto</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-subtle flex items-center justify-center">
            <span className="text-2xl font-bold text-brand">
              {proyecto.responsableNombre
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">{proyecto.responsableNombre}</h3>
            <p className="text-sm text-text-muted">Responsable principal</p>
          </div>
        </div>
      </div>

      {/* Equipo */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-text">Equipo del proyecto</h2>
          {equipo.length > 0 && (
            <span className="px-2 py-1 bg-brand-subtle text-brand rounded-full text-xs font-medium">
              {equipo.length} miembros
            </span>
          )}
        </div>

        {equipo.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-text-muted" />
            <p className="text-text-muted">No hay miembros asignados al equipo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipo.map((miembro) => {
              const stats = tareasEquipo.get(miembro.uid);
              const tasaCompletitud =
                stats && stats.total > 0 ? (stats.completadas / stats.total) * 100 : 0;

              return (
                <div
                  key={miembro.uid}
                  className="p-4 rounded-xl border border-border bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-brand">
                        {miembro.nombre
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text truncate">{miembro.nombre}</h3>
                      <p className="text-sm text-text-muted">{miembro.rol}</p>
                    </div>
                  </div>

                  {stats && stats.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Tareas asignadas:</span>
                        <span className="font-semibold text-text">{stats.total}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Completadas:</span>
                        <span className="font-semibold text-success">{stats.completadas}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">En curso:</span>
                        <span className="font-semibold text-brand">{stats.enCurso}</span>
                      </div>

                      {/* Barra de progreso */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                          <span>Progreso</span>
                          <span>{Math.round(tasaCompletitud)}%</span>
                        </div>
                        <div className="h-2 bg-card rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success transition-all"
                            style={{ width: `${tasaCompletitud}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tareas sin asignar */}
      {proyecto.tareas.filter((t) => !t.asignadoA).length > 0 && (
        <div className="bg-warn-bg rounded-2xl border border-warn/40 p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-5 w-5 text-warn" />
            <h3 className="font-semibold text-warn">Tareas sin asignar</h3>
          </div>
          <p className="text-sm text-text-muted">
            Hay <strong>{proyecto.tareas.filter((t) => !t.asignadoA).length} tareas</strong> que
            aún no han sido asignadas a ningún miembro del equipo.
          </p>
        </div>
      )}
    </div>
  );
}

function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // Simple implementation for server components
  return factory();
}
