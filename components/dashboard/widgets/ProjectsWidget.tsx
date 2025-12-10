'use client';

import Link from 'next/link';
import {
  ArrowRight,
  FolderKanban,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { Proyecto } from '@/types/proyectos';

interface ProjectsWidgetProps {
  proyectos: Proyecto[];
  estadisticas?: {
    porEstado: Record<string, number>;
    proyectosAtrasados: number;
  };
  loading: boolean;
}

export function ProjectsWidget({ proyectos, estadisticas, loading }: ProjectsWidgetProps) {
  const enCurso = proyectos.filter((p) => p.estado === 'en-curso');

  return (
    <div className="h-full flex flex-col rounded-lg border border-emerald-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <FolderKanban className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Proyectos</h3>
            <p className="text-[9px] text-slate-500">En curso</p>
          </div>
        </div>
        {!loading && estadisticas && (
          <div className="rounded-lg bg-emerald-100 px-2 py-1">
            <span className="text-sm font-bold text-emerald-700">
              {estadisticas.porEstado['en-curso'] || 0}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : enCurso.length === 0 ? (
        <div className="py-3 text-center">
          <Target className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin proyectos activos</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {enCurso.slice(0, 2).map((proyecto) => (
            <div key={proyecto.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="mb-1.5 text-[11px] font-semibold text-slate-900 truncate">
                {proyecto.nombre}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${proyecto.progreso}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}
                  />
                </div>
                <span className="text-[9px] font-semibold text-emerald-700">
                  {proyecto.progreso}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {estadisticas && estadisticas.proyectosAtrasados > 0 && (
        <div className="mt-1.5 flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5">
          <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />
          <p className="text-[9px] font-medium text-rose-700">
            {estadisticas.proyectosAtrasados} atrasado(s)
          </p>
        </div>
      )}

      <Link
        href="/dashboard/proyectos"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver kanban
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
