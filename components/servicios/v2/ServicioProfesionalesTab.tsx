'use client';

import type { CatalogoServicio } from '@/types';
import type { CatalogoServicioEstadisticas } from '@/lib/server/serviciosStats';
import { Users, Calendar, TrendingUp, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ServicioProfesionalesTabProps {
  servicio: CatalogoServicio;
  estadisticas: CatalogoServicioEstadisticas | null;
}

export default function ServicioProfesionalesTab({
  servicio,
  estadisticas,
}: ServicioProfesionalesTabProps) {
  if (!estadisticas) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <p className="text-text-subtle">No hay estadísticas disponibles</p>
      </div>
    );
  }

  const profesionales = estadisticas.profesionalesQueLoOfrecen;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-brand" />
            <span className="text-sm font-medium text-text-subtle">Total profesionales</span>
          </div>
          <p className="text-3xl font-bold text-text">{profesionales.length}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-text-subtle">Total citas realizadas</span>
          </div>
          <p className="text-3xl font-bold text-text">
            {profesionales.reduce((sum, p) => sum + p.citasRealizadas, 0)}
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-purple" />
            <span className="text-sm font-medium text-text-subtle">Total asignaciones</span>
          </div>
          <p className="text-3xl font-bold text-text">
            {estadisticas.totalAsignaciones}
          </p>
        </div>
      </div>

      {/* Lista de profesionales */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand" />
          Profesionales que ofrecen este servicio
        </h2>

        {profesionales.length > 0 ? (
          <div className="space-y-3">
            {profesionales.map((prof, index) => {
              const tasaExito =
                prof.vecesAsignado > 0
                  ? (prof.citasRealizadas / prof.vecesAsignado) * 100
                  : 0;

              return (
                <div
                  key={prof.profesionalId}
                  className="flex items-center justify-between p-4 bg-bg rounded-xl hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Ranking */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-subtle text-brand font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center text-brand font-medium text-lg">
                      {prof.profesionalNombre.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-text">{prof.profesionalNombre}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-text-subtle">
                        <span>{prof.citasRealizadas} citas realizadas</span>
                        <span>•</span>
                        <span>{prof.vecesAsignado} asignaciones</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-subtle mb-1">Tasa de éxito</p>
                      <p className="text-xl font-bold text-text">{tasaExito.toFixed(0)}%</p>
                      <div className="w-24 bg-bg rounded-full h-1.5 mt-2">
                        <div
                          className="bg-brand h-1.5 rounded-full transition-all"
                          style={{ width: `${tasaExito}%` }}
                        />
                      </div>
                    </div>

                    {/* Link */}
                    <Link
                      href={`/dashboard/profesionales/${prof.profesionalId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-subtle text-brand rounded-pill text-sm font-medium hover:bg-brand hover:text-white transition-colors"
                    >
                      Ver perfil
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-text-subtle mx-auto mb-3" />
            <p className="text-text-subtle">No hay profesionales asignados a este servicio</p>
          </div>
        )}
      </div>

      {/* Profesionales habilitados pero sin asignaciones */}
      {servicio.profesionalesHabilitados.length > profesionales.length && (
        <div className="bg-brand-subtle rounded-2xl border border-brand p-6">
          <h3 className="font-semibold text-brand mb-2">💡 Información</h3>
          <p className="text-sm text-text">
            Hay {servicio.profesionalesHabilitados.length - profesionales.length} profesionales
            habilitados para este servicio que aún no tienen asignaciones activas.
          </p>
        </div>
      )}
    </div>
  );
}
