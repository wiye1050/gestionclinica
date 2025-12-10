'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Activity,
} from 'lucide-react';
import { RecentActivity } from '@/types/dashboard';

interface ActivityWidgetProps {
  activity: RecentActivity[];
  loading: boolean;
}

export function ActivityWidget({ activity, loading }: ActivityWidgetProps) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-cyan-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
          <Activity className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Actividad</h3>
          <p className="text-[9px] text-slate-500">Recientes</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="py-3 text-center">
          <Activity className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin actividad</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activity.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 transition-all hover:bg-white hover:border-cyan-300"
            >
              <p className="text-[11px] font-medium text-slate-900 truncate">{item.descripcion}</p>
              <p className="text-[9px] text-slate-500">
                {item.tipo} ·{' '}
                {item.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/auditoria"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver auditoría
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
