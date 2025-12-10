'use client';

import {
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { FinanceSummary } from '@/types/dashboard';

// Formatter para moneda
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

interface FinanceWidgetProps {
  summary: FinanceSummary;
  loading: boolean;
}

export function FinanceWidget({ summary, loading }: FinanceWidgetProps) {
  const tasaCobro =
    summary.facturadoMes > 0 ? (summary.cobradoMes / summary.facturadoMes) * 100 : 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-purple-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea)' }}>
            <DollarSign className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Finanzas</h3>
            <p className="text-[9px] text-slate-500">Este mes</p>
          </div>
        </div>
        <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] uppercase tracking-wide text-slate-500">
                Facturado
              </span>
              <span className="text-xs font-bold text-slate-900">
                {currencyFormatter.format(summary.facturadoMes)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] uppercase tracking-wide text-slate-500">Cobrado</span>
              <span className="text-xs font-bold text-emerald-600">
                {currencyFormatter.format(summary.cobradoMes)}
              </span>
            </div>
          </div>

          {/* Tasa de cobro */}
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] text-slate-500">Tasa de cobro</span>
              <span className="text-[10px] font-semibold text-purple-700">
                {Math.round(tasaCobro)}%
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${tasaCobro}%`, background: 'linear-gradient(90deg, #a855f7, #9333ea)' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
