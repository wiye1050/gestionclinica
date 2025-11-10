'use client';

import { useMemo, useState } from 'react';
import KPICard from '@/components/dashboard/KPICard';
import { GraficoLinea, GraficoPie } from '@/components/dashboard/Graficos';
import {
  Wrench,
  Users,
  ClipboardList,
  AlertTriangle,
  Layers,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { KPIResponse } from '@/lib/server/kpis';

interface KPIsPageClientProps {
  initialData: KPIResponse;
}

export default function KPIsPageClient({ initialData }: KPIsPageClientProps) {
  const [data] = useState(initialData);

  const cards = useMemo(
    () => [
      {
        title: 'Servicios activos',
        value: data.serviciosActivos.toString(),
        icon: <Wrench className="h-5 w-5" />,
        color: 'blue' as const,
        trend: 'up' as const,
        trendValue: '+3% mes',
      },
      {
        title: 'Servicios programados',
        value: data.serviciosProgramados.toString(),
        icon: <Layers className="h-5 w-5" />,
        color: 'purple' as const,
      },
      {
        title: 'Profesionales activos',
        value: data.profesionalesActivos.toString(),
        icon: <Users className="h-5 w-5" />,
        color: 'green' as const,
      },
      {
        title: 'Reportes pendientes',
        value: data.reportesPendientes.toString(),
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'red' as const,
      },
      {
        title: 'Tratamientos activos',
        value: data.tratamientosActivos.toString(),
        icon: <ClipboardList className="h-5 w-5" />,
        color: 'orange' as const,
      },
      {
        title: 'Catálogo disponible',
        value: data.catalogoActivos.toString(),
        icon: <BookOpen className="h-5 w-5" />,
        color: 'purple' as const,
      },
      {
        title: 'Eventos semana',
        value: data.eventosSemana.toString(),
        icon: <CalendarDays className="h-5 w-5" />,
        color: 'blue' as const,
      },
      {
        title: 'Eventos confirmados',
        value: data.eventosConfirmadosSemana.toString(),
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: 'green' as const,
      },
      {
        title: 'Cancelaciones',
        value: data.cancelacionesSemana.toString(),
        icon: <XCircle className="h-5 w-5" />,
        color: 'red' as const,
      },
    ],
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <KPICard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GraficoLinea titulo="Tendencia de servicios activos" data={data.tendenciaServicios} />
        <GraficoPie titulo="Distribución de eventos" data={data.distribucionEventos} />
      </div>
    </div>
  );
}
