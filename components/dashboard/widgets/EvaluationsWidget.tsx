'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ClipboardCheck,
  Star,
} from 'lucide-react';
import { RecentEvaluation } from '@/types/dashboard';

interface EvaluationsWidgetProps {
  evaluations: RecentEvaluation[];
  loading: boolean;
}

export function EvaluationsWidget({ evaluations, loading }: EvaluationsWidgetProps) {
  const promedioTotal =
    evaluations.length > 0
      ? evaluations.reduce((acc, e) => acc + e.promedioGeneral, 0) / evaluations.length
      : 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-teal-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
            <ClipboardCheck className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Supervisión QA</h3>
            <p className="text-[9px] text-slate-500">Evaluaciones</p>
          </div>
        </div>
        {evaluations.length > 0 && (
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-lg font-bold text-slate-900">
                {promedioTotal.toFixed(1)}
              </span>
            </div>
            <p className="text-[8px] text-slate-500">Promedio</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : evaluations.length === 0 ? (
        <div className="py-4 text-center">
          <ClipboardCheck className="mx-auto mb-1 h-6 w-6 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin evaluaciones recientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {evaluations.slice(0, 4).map((evaluation) => (
            <div
              key={evaluation.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition-all hover:bg-white hover:shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-900 truncate">
                  {evaluation.profesionalNombre}
                </span>
                <div
                  className={`flex items-center gap-0.5 rounded-full px-1 py-0.5 ${
                    evaluation.promedioGeneral >= 4
                      ? 'bg-emerald-100 text-emerald-700'
                      : evaluation.promedioGeneral >= 3
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Star className="h-2.5 w-2.5" />
                  <span className="text-[9px] font-bold">{evaluation.promedioGeneral}</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 truncate">{evaluation.servicioNombre}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/supervision"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 transition-all hover:gap-2"
      >
        Ver evaluaciones
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
