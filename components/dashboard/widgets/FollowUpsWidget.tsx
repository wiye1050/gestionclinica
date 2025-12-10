'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { FollowUpPatient } from '@/types/dashboard';

interface FollowUpsWidgetProps {
  patients: FollowUpPatient[];
  loading: boolean;
}

export function FollowUpsWidget({ patients, loading }: FollowUpsWidgetProps) {
  const hasAlerts = patients.length > 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-amber-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: hasAlerts ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Users className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Seguimientos</h3>
            <p className="text-[9px] text-slate-500">Pendientes</p>
          </div>
        </div>
        {!loading && hasAlerts && (
          <div className="rounded-lg bg-amber-100 px-2 py-1">
            <span className="text-sm font-bold text-amber-700">{patients.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : hasAlerts ? (
        <div className="space-y-1">
          {patients.slice(0, 2).map((patient) => (
            <Link
              key={patient.id}
              href={`/dashboard/pacientes/${patient.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs transition-all hover:bg-white hover:border-amber-300"
            >
              <span className="font-medium text-slate-900 truncate text-[11px]">
                {patient.nombre} {patient.apellidos}
              </span>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Todos al día</p>
        </div>
      )}

      <Link
        href="/dashboard/pacientes?filtro=seguimiento"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600"
      >
        Ver pacientes
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
