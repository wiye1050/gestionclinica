'use client';

import type { Profesional } from '@/types';
import type { ProfesionalEstadisticas } from '@/lib/server/profesionalesStats';
import { GraficoLinea, GraficoBarras, GraficoPie } from '@/components/dashboard/Graficos';
import {
  Calendar,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface ProfesionalEstadisticasTabProps {
  profesional: Profesional;
  estadisticas?: ProfesionalEstadisticas | null;
}

export default function ProfesionalEstadisticasTab({
  profesional,
  estadisticas,
}: ProfesionalEstadisticasTabProps) {
  if (!estadisticas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No hay estadísticas disponibles</p>
          <p className="text-sm text-text-muted">
            Las estadísticas se generarán una vez que el profesional tenga citas registradas
          </p>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const dataCitas = [
    { nombre: 'Realizadas', valor: estadisticas.citasRealizadas },
    { nombre: 'Programadas', valor: estadisticas.citasProgramadas },
    { nombre: 'Canceladas', valor: estadisticas.citasCanceladas },
  ];

  const dataServicios = estadisticas.serviciosOfrecidos.map((servicio) => ({
    nombre: servicio,
    valor: servicio === estadisticas.servicioMasSolicitado ? 100 : 50, // Placeholder - en producción usar conteo real
  }));

  const dataTendencia = [
    { nombre: 'Mes anterior', valor: estadisticas.mesAnterior.citasRealizadas },
    { nombre: 'Mes actual', valor: estadisticas.mesActual.citasRealizadas },
  ];

  const dataCapacidad = [
    { nombre: 'Horas trabajadas', valor: estadisticas.horasTrabajadas },
    { nombre: 'Horas disponibles', valor: estadisticas.horasDisponibles - estadisticas.horasTrabajadas },
  ];

  // Calcular variaciones
  const variacionCitas =
    estadisticas.mesAnterior.citasRealizadas > 0
      ? ((estadisticas.mesActual.citasRealizadas - estadisticas.mesAnterior.citasRealizadas) /
          estadisticas.mesAnterior.citasRealizadas) *
        100
      : 0;

  const variacionPacientes =
    estadisticas.mesAnterior.pacientesAtendidos > 0
      ? ((estadisticas.mesActual.pacientesAtendidos - estadisticas.mesAnterior.pacientesAtendidos) /
          estadisticas.mesAnterior.pacientesAtendidos) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Métricas principales en cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Calendar className="h-5 w-5" />}
          label="Total citas"
          value={estadisticas.citasProgramadas + estadisticas.citasRealizadas + estadisticas.citasCanceladas}
          subtitle="Últimos 3 meses"
          tone="brand"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Tasa de realización"
          value={`${estadisticas.tasaRealizacion}%`}
          subtitle={
            estadisticas.tasaRealizacion >= 80
              ? 'Excelente'
              : estadisticas.tasaRealizacion >= 60
              ? 'Buena'
              : 'Mejorable'
          }
          tone={estadisticas.tasaRealizacion >= 80 ? 'success' : estadisticas.tasaRealizacion >= 60 ? 'warn' : 'danger'}
        />
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Pacientes únicos"
          value={estadisticas.pacientesAtendidos}
          subtitle={`${estadisticas.pacientesActivos} activos`}
          tone="success"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label="Uso de capacidad"
          value={`${estadisticas.porcentajeUso}%`}
          subtitle={
            estadisticas.porcentajeUso > 90
              ? 'Sobrecargado'
              : estadisticas.porcentajeUso > 70
              ? 'Óptimo'
              : 'Disponible'
          }
          tone={
            estadisticas.porcentajeUso > 90 ? 'danger' : estadisticas.porcentajeUso > 70 ? 'success' : 'warn'
          }
        />
      </div>

      {/* Comparación mensual */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand" />
          Comparación mensual
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComparisonCard
            label="Citas realizadas"
            mesActual={estadisticas.mesActual.citasRealizadas}
            mesAnterior={estadisticas.mesAnterior.citasRealizadas}
            variacion={variacionCitas}
          />
          <ComparisonCard
            label="Pacientes atendidos"
            mesActual={estadisticas.mesActual.pacientesAtendidos}
            mesAnterior={estadisticas.mesAnterior.pacientesAtendidos}
            variacion={variacionPacientes}
          />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de citas */}
        <GraficoPie
          data={dataCitas}
          titulo="Distribución de citas"
          colores={['#10b981', '#0087cd', '#ef4444']}
        />

        {/* Tendencia de citas */}
        <GraficoBarras
          data={dataTendencia}
          titulo="Tendencia de citas realizadas"
          color="#0087cd"
        />

        {/* Servicios ofrecidos */}
        {dataServicios.length > 0 && (
          <GraficoBarras
            data={dataServicios}
            titulo="Servicios ofrecidos"
            color="#10b981"
          />
        )}

        {/* Capacidad de trabajo */}
        <GraficoPie
          data={dataCapacidad}
          titulo="Capacidad de trabajo"
          colores={['#0087cd', '#e5e7eb']}
        />
      </div>

      {/* Detalles adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen de actividad */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand" />
            Resumen de actividad
          </h2>
          <div className="space-y-3">
            <DetailRow
              icon={<Calendar className="h-4 w-4 text-brand" />}
              label="Citas programadas"
              value={estadisticas.citasProgramadas}
            />
            <DetailRow
              icon={<CheckCircle2 className="h-4 w-4 text-success" />}
              label="Citas realizadas"
              value={estadisticas.citasRealizadas}
            />
            <DetailRow
              icon={<XCircle className="h-4 w-4 text-danger" />}
              label="Citas canceladas"
              value={estadisticas.citasCanceladas}
            />
            <DetailRow
              icon={<Clock className="h-4 w-4 text-warn" />}
              label="Próximas citas"
              value={estadisticas.proximasCitas}
            />
          </div>
        </div>

        {/* Información de capacidad */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand" />
            Capacidad de trabajo
          </h2>
          <div className="space-y-3">
            <DetailRow
              icon={<Clock className="h-4 w-4 text-brand" />}
              label="Horas trabajadas"
              value={`${estadisticas.horasTrabajadas}h`}
            />
            <DetailRow
              icon={<Clock className="h-4 w-4 text-text-muted" />}
              label="Horas disponibles"
              value={`${estadisticas.horasDisponibles}h`}
            />
            <DetailRow
              icon={<Activity className="h-4 w-4 text-brand" />}
              label="Porcentaje de uso"
              value={`${estadisticas.porcentajeUso}%`}
              valueClassName={
                estadisticas.porcentajeUso > 90
                  ? 'text-danger font-semibold'
                  : estadisticas.porcentajeUso > 70
                  ? 'text-success font-semibold'
                  : 'text-warn font-semibold'
              }
            />
            <div className="pt-2 mt-2 border-t border-border">
              <p className="text-xs text-text-muted">
                {estadisticas.porcentajeUso > 90
                  ? '⚠️ El profesional está sobrecargado. Considere redistribuir citas.'
                  : estadisticas.porcentajeUso > 70
                  ? '✓ Uso óptimo de la capacidad de trabajo.'
                  : 'ℹ️ Hay capacidad disponible para más citas.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function MetricCard({
  icon,
  label,
  value,
  subtitle,
  tone = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  tone?: 'brand' | 'success' | 'warn' | 'danger';
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-success-bg text-success'
      : tone === 'warn'
      ? 'bg-warn-bg text-warn'
      : tone === 'danger'
      ? 'bg-danger-bg text-danger'
      : 'bg-brand-subtle text-brand';

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClasses}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function ComparisonCard({
  label,
  mesActual,
  mesAnterior,
  variacion,
}: {
  label: string;
  mesActual: number;
  mesAnterior: number;
  variacion: number;
}) {
  const isPositive = variacion > 0;
  const isNeutral = variacion === 0;

  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-sm font-medium text-text mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-text">{mesActual}</p>
          <p className="text-xs text-text-muted mt-1">Mes actual</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end mb-1">
            {!isNeutral && (
              <>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
                <span className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {Math.abs(Math.round(variacion))}%
                </span>
              </>
            )}
            {isNeutral && <span className="text-sm text-text-muted">Sin cambios</span>}
          </div>
          <p className="text-xs text-text-muted">vs {mesAnterior} anterior</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-text">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${valueClassName || 'text-text'}`}>{value}</span>
    </div>
  );
}
