'use client';

import type { Profesional } from '@/types';
import {
  User,
  Mail,
  Phone,
  Clock,
  Calendar,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { ProfesionalEstadisticas } from '@/lib/server/profesionalesStats';

interface ProfesionalResumenTabProps {
  profesional: Profesional;
  estadisticas?: ProfesionalEstadisticas | null;
}

export default function ProfesionalResumenTab({
  profesional,
  estadisticas,
}: ProfesionalResumenTabProps) {
  // Calcular tendencias
  const tendenciaCitas =
    estadisticas && estadisticas.mesAnterior.citasRealizadas > 0
      ? ((estadisticas.mesActual.citasRealizadas - estadisticas.mesAnterior.citasRealizadas) /
          estadisticas.mesAnterior.citasRealizadas) *
        100
      : 0;

  const tendenciaPacientes =
    estadisticas && estadisticas.mesAnterior.pacientesAtendidos > 0
      ? ((estadisticas.mesActual.pacientesAtendidos -
          estadisticas.mesAnterior.pacientesAtendidos) /
          estadisticas.mesAnterior.pacientesAtendidos) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Citas realizadas"
            value={estadisticas.citasRealizadas}
            sublabel="últimos 3 meses"
            icon={<Calendar className="h-5 w-5" />}
            tone="brand"
          />
          <KpiCard
            label="Pacientes atendidos"
            value={estadisticas.pacientesAtendidos}
            sublabel="únicos"
            icon={<Users className="h-5 w-5" />}
            tone="success"
          />
          <KpiCard
            label="Tasa de realización"
            value={`${estadisticas.tasaRealizacion}%`}
            icon={<Activity className="h-5 w-5" />}
            tone={estadisticas.tasaRealizacion >= 80 ? 'success' : 'warn'}
          />
          <KpiCard
            label="Próximas citas"
            value={estadisticas.proximasCitas}
            icon={<Clock className="h-5 w-5" />}
            tone="brand"
          />
        </div>
      )}

      {/* Información del profesional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-text">Información personal</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Especialidad" value={profesional.especialidad || 'No especificada'} capitalize />
            <InfoRow
              label="Email"
              value={
                profesional.email ? (
                  <a href={`mailto:${profesional.email}`} className="text-brand hover:underline">
                    {profesional.email}
                  </a>
                ) : (
                  'No registrado'
                )
              }
              icon={<Mail className="h-4 w-4" />}
            />
            <InfoRow
              label="Teléfono"
              value={
                profesional.telefono ? (
                  <a href={`tel:${profesional.telefono}`} className="text-brand hover:underline">
                    {profesional.telefono}
                  </a>
                ) : (
                  'No registrado'
                )
              }
              icon={<Phone className="h-4 w-4" />}
            />
            <InfoRow
              label="Estado"
              value={profesional.activo ? 'Activo' : 'Inactivo'}
              className={profesional.activo ? 'text-success font-semibold' : 'text-text-muted'}
            />
          </div>
        </div>

        {/* Horario de trabajo */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-text">Horario de trabajo</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Horas semanales" value={`${profesional.horasSemanales || 40} horas`} />
            <InfoRow
              label="Horario"
              value={`${profesional.horaInicio || '08:00'} - ${profesional.horaFin || '16:00'}`}
            />
            <InfoRow
              label="Días de trabajo"
              value={
                profesional.diasTrabajo && profesional.diasTrabajo.length > 0
                  ? profesional.diasTrabajo.join(', ')
                  : 'No especificados'
              }
              capitalize
            />
            {estadisticas && (
              <InfoRow
                label="% de uso"
                value={`${estadisticas.porcentajeUso}%`}
                className={
                  estadisticas.porcentajeUso > 90
                    ? 'text-danger font-semibold'
                    : estadisticas.porcentajeUso > 70
                    ? 'text-warn font-semibold'
                    : 'text-success font-semibold'
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas y tendencias */}
      {estadisticas && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencias */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-text">Tendencias (mes actual vs anterior)</h2>
            </div>
            <div className="space-y-4">
              <TrendCard
                label="Citas realizadas"
                actual={estadisticas.mesActual.citasRealizadas}
                anterior={estadisticas.mesAnterior.citasRealizadas}
                tendencia={tendenciaCitas}
              />
              <TrendCard
                label="Pacientes atendidos"
                actual={estadisticas.mesActual.pacientesAtendidos}
                anterior={estadisticas.mesAnterior.pacientesAtendidos}
                tendencia={tendenciaPacientes}
              />
            </div>
          </div>

          {/* Servicios */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-text">Servicios ofrecidos</h2>
            </div>
            {estadisticas.serviciosOfrecidos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {estadisticas.serviciosOfrecidos.map((servicio, index) => (
                    <span
                      key={index}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        servicio === estadisticas.servicioMasSolicitado
                          ? 'bg-brand text-white'
                          : 'bg-muted text-text'
                      }`}
                    >
                      {servicio}
                    </span>
                  ))}
                </div>
                {estadisticas.servicioMasSolicitado && (
                  <p className="text-sm text-text-muted mt-3">
                    Más solicitado: <span className="font-semibold text-brand">{estadisticas.servicioMasSolicitado}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No hay servicios registrados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  capitalize,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  capitalize?: boolean;
  className?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-text-muted flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`text-text ${capitalize ? 'capitalize' : ''} ${className || ''}`}>{value}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sublabel,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: React.ReactNode;
  tone?: 'brand' | 'success' | 'warn';
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-success-bg text-success'
      : tone === 'warn'
      ? 'bg-warn-bg text-warn'
      : 'bg-brand-subtle text-brand';

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClasses}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
      {sublabel && <p className="text-xs text-text-muted">{sublabel}</p>}
    </div>
  );
}

function TrendCard({
  label,
  actual,
  anterior,
  tendencia,
}: {
  label: string;
  actual: number;
  anterior: number;
  tendencia: number;
}) {
  const isPositive = tendencia > 0;
  const isNeutral = tendencia === 0;

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-muted">
          Actual: {actual} | Anterior: {anterior}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {!isNeutral && (
          <>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-danger" />
            )}
            <span
              className={`text-sm font-semibold ${
                isPositive ? 'text-success' : 'text-danger'
              }`}
            >
              {Math.abs(Math.round(tendencia))}%
            </span>
          </>
        )}
        {isNeutral && <span className="text-sm text-text-muted">Sin cambios</span>}
      </div>
    </div>
  );
}
