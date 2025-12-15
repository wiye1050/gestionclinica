'use client';

import type { Proyecto, ProyectoHito } from '@/types/proyectos';
import { Target, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { format, isPast, isFuture, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProyectoHitosTabProps {
  proyecto: Proyecto;
}

export default function ProyectoHitosTab({ proyecto }: ProyectoHitosTabProps) {
  const ahora = new Date();
  const hitosOrdenados = [...proyecto.hitos].sort((a, b) => a.orden - b.orden);

  const stats = {
    total: proyecto.hitos.length,
    completados: proyecto.hitos.filter((h) => h.completado).length,
    pendientes: proyecto.hitos.filter((h) => !h.completado).length,
    atrasados: proyecto.hitos.filter(
      (h) => !h.completado && isPast(new Date(h.fechaObjetivo))
    ).length,
  };

  const progreso = stats.total > 0 ? (stats.completados / stats.total) * 100 : 0;

  const getHitoEstado = (hito: ProyectoHito) => {
    if (hito.completado) {
      return { estado: 'completado', color: 'success', icon: CheckCircle };
    }

    const fechaObjetivo = new Date(hito.fechaObjetivo);
    const diasRestantes = differenceInDays(fechaObjetivo, ahora);

    if (isPast(fechaObjetivo)) {
      return { estado: 'atrasado', color: 'danger', icon: AlertCircle };
    }

    if (diasRestantes <= 7) {
      return { estado: 'proximo', color: 'warn', icon: Clock };
    }

    return { estado: 'pendiente', color: 'brand', icon: Target };
  };

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Progreso de hitos</h2>
          <span className="text-2xl font-bold text-brand">{Math.round(progreso)}%</span>
        </div>

        {/* Barra de progreso */}
        <div className="h-4 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{stats.total}</p>
            <p className="text-xs text-text-muted">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{stats.completados}</p>
            <p className="text-xs text-success">Completados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brand">{stats.pendientes}</p>
            <p className="text-xs text-brand">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-danger">{stats.atrasados}</p>
            <p className="text-xs text-danger">Atrasados</p>
          </div>
        </div>
      </div>

      {/* Timeline de hitos */}
      {hitosOrdenados.length === 0 ? (
        <div className="panel-block p-12 text-center shadow-sm">
          <Target className="w-12 h-12 mx-auto mb-3 text-text-muted" />
          <p className="text-text-muted">No hay hitos definidos para este proyecto</p>
        </div>
      ) : (
        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Hitos */}
          <div className="space-y-6">
            {hitosOrdenados.map((hito, index) => {
              const estadoInfo = getHitoEstado(hito);
              const IconComponent = estadoInfo.icon;
              const fechaObjetivo = new Date(hito.fechaObjetivo);
              const diasRestantes = differenceInDays(fechaObjetivo, ahora);

              return (
                <div key={hito.id} className="relative pl-16">
                  {/* Icon y línea */}
                  <div className="absolute left-0 top-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        estadoInfo.color === 'success'
                          ? 'bg-success text-white'
                          : estadoInfo.color === 'danger'
                          ? 'bg-danger text-white'
                          : estadoInfo.color === 'warn'
                          ? 'bg-warn text-white'
                          : 'bg-brand text-white'
                      } shadow-lg`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Contenido del hito */}
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${hito.completado ? 'text-success' : 'text-text'}`}>
                          {hito.nombre}
                        </h3>
                        {hito.descripcion && (
                          <p className="text-sm text-text-muted">{hito.descripcion}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            estadoInfo.color === 'success'
                              ? 'bg-success-bg text-success'
                              : estadoInfo.color === 'danger'
                              ? 'bg-danger-bg text-danger'
                              : estadoInfo.color === 'warn'
                              ? 'bg-warn-bg text-warn'
                              : 'bg-brand-subtle text-brand'
                          }`}
                        >
                          {estadoInfo.estado}
                        </span>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(fechaObjetivo, "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>

                      {!hito.completado && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span
                            className={
                              diasRestantes < 0
                                ? 'text-danger font-semibold'
                                : diasRestantes <= 7
                                ? 'text-warn font-semibold'
                                : 'text-text-muted'
                            }
                          >
                            {diasRestantes < 0
                              ? `${Math.abs(diasRestantes)} días atrasado`
                              : diasRestantes === 0
                              ? 'Hoy'
                              : diasRestantes === 1
                              ? 'Mañana'
                              : `${diasRestantes} días restantes`}
                          </span>
                        </div>
                      )}

                      {hito.completado && hito.fechaCompletado && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            Completado el{' '}
                            {format(new Date(hito.fechaCompletado), "d 'de' MMM", { locale: es })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
