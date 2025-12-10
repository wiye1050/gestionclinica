'use client';

import Link from 'next/link';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface ReportsWidgetProps {
  pendingCount: number;
}

export function ReportsWidget({ pendingCount }: ReportsWidgetProps) {
  const hasReports = pendingCount > 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-rose-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: hasReports ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
            <AlertTriangle className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Reportes</h3>
            <p className="text-[9px] text-slate-500">Pendientes</p>
          </div>
        </div>
        {hasReports && (
          <div className="rounded-lg bg-rose-100 px-2 py-1">
            <span className="text-sm font-bold text-rose-700">{pendingCount}</span>
          </div>
        )}
      </div>

      {hasReports ? (
        <div>
          <p className="mb-1.5 text-[10px] text-slate-600">{pendingCount} reporte(s) pendientes</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pendingCount * 15, 100)}%`, background: 'linear-gradient(90deg, #f43f5e, #e11d48)' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin reportes pendientes</p>
        </div>
      )}

      <Link
        href="/dashboard/reporte-diario"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver reportes
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
