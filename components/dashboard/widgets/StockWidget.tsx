'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { StockAlerts } from '@/types/dashboard';

interface StockWidgetProps {
  alerts: StockAlerts;
  loading: boolean;
}

export function StockWidget({ alerts, loading }: StockWidgetProps) {
  const hasAlerts = alerts.total > 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-orange-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: hasAlerts ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
            <Package className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Inventario</h3>
            <p className="text-[9px] text-slate-500">Stock bajo</p>
          </div>
        </div>
        {hasAlerts && (
          <div className="rounded-lg bg-orange-100 px-2 py-1">
            <span className="text-sm font-bold text-orange-700">{alerts.total}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : hasAlerts ? (
        <div className="space-y-1">
          {alerts.top.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
              <span className="text-[11px] text-slate-700 truncate pr-2">{item.nombre}</span>
              <span className="text-[10px] font-bold text-orange-700">
                {item.stock}/{item.stockMinimo}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Stock normal</p>
        </div>
      )}

      <Link
        href="/dashboard/inventario"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver inventario
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
