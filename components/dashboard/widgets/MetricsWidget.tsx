'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
} from 'lucide-react';

interface MetricsWidgetProps {
  serviciosActivos: number;
  profesionalesActivos: number;
  eventosSemana: number;
}

export function MetricsWidget({
  serviciosActivos,
  profesionalesActivos,
  eventosSemana,
}: MetricsWidgetProps) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-indigo-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <BarChart3 className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Métricas clave</h3>
          <p className="text-[9px] text-slate-500">Visión general</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="mb-1 rounded-lg border border-blue-200 bg-blue-50 p-2">
            <span className="block text-lg font-bold text-blue-700">{serviciosActivos}</span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-600">
            Servicios
          </p>
        </div>
        <div className="text-center">
          <div className="mb-1 rounded-lg border border-purple-200 bg-purple-50 p-2">
            <span className="block text-lg font-bold text-purple-700">
              {profesionalesActivos}
            </span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-600">
            Profesionales
          </p>
        </div>
        <div className="text-center">
          <div className="mb-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
            <span className="block text-lg font-bold text-emerald-700">{eventosSemana}</span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-600">
            Eventos/sem
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/kpis"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 transition-all hover:gap-2"
      >
        Ver KPIs
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
