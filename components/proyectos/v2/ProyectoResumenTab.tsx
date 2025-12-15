'use client';

import type { Proyecto } from '@/types/proyectos';
import type { ProyectoEstadisticas } from '@/lib/server/proyectosStats';
import {
  CheckSquare,
  Clock,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Activity,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProyectoResumenTabProps {
  proyecto: Proyecto;
  estadisticas?: ProyectoEstadisticas | null;
}

export default function ProyectoResumenTab({
  proyecto,
  estadisticas,
}: ProyectoResumenTabProps) {
  const ahora = new Date();
  const fechaInicio = proyecto.fechaInicio ? new Date(proyecto.fechaInicio) : null;
  const fechaFin = proyecto.fechaFinEstimada ? new Date(proyecto.fechaFinEstimada) : null;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Tareas completadas"
            value={`${estadisticas.tareasCompletadas}/${estadisticas.totalTareas}`}
            sublabel={`${estadisticas.tasaCompletitud}% completitud`}
            icon={<CheckSquare className="h-5 w-5" />}
            tone="brand"
          />
          <KpiCard
            label="Hitos alcanzados"
            value={`${estadisticas.hitosCompletados}/${estadisticas.totalHitos}`}
            sublabel={estadisticas.hitosAtrasados > 0 ? `${estadisticas.hitosAtrasados} atrasados` : 'Al día'}
            icon={<Target className="h-5 w-5" />}
            tone={estadisticas.hitosAtrasados > 0 ? 'warn' : 'success'}
          />
          <KpiCard
            label="Progreso"
            value={`${proyecto.progreso}%`}
            sublabel={
              estadisticas.desviacionProgreso >= 0
                ? `+${Math.round(estadisticas.desviacionProgreso)}% vs esperado`
                : `${Math.round(estadisticas.desviacionProgreso)}% vs esperado`
            }
            icon={<Activity className="h-5 w-5" />}
            tone={estadisticas.desviacionProgreso >= 0 ? 'success' : 'warn'}
          />
          <KpiCard
            label="Salud del proyecto"
            value={estadisticas.saludProyecto}
            icon={<Activity className="h-5 w-5" />}
            tone={
              estadisticas.saludProyecto === 'excelente' || estadisticas.saludProyecto === 'bueno'
                ? 'success'
                : estadisticas.saludProyecto === 'en-riesgo'
                ? 'warn'
                : 'danger'
            }
          />
        </div>
      )}

      {/* Alertas */}
      {estadisticas && estadisticas.alertas.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warn" />
            Alertas y notificaciones
          </h2>
          <div className="space-y-2">
            {estadisticas.alertas.map((alerta, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  alerta.tipo === 'error'
                    ? 'bg-danger-bg border border-danger/40'
                    : alerta.tipo === 'warning'
                    ? 'bg-warn-bg border border-warn/40'
                    : 'bg-brand-subtle border border-brand/40'
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                    alerta.tipo === 'error'
                      ? 'text-danger'
                      : alerta.tipo === 'warning'
                      ? 'text-warn'
                      : 'text-brand'
                  }`}
                />
                <p className="text-sm text-text">{alerta.mensaje}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información del proyecto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalles generales */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-text">Detalles del proyecto</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Tipo" value={proyecto.tipo} capitalize />
            {proyecto.categoria && <InfoRow label="Categoría" value={proyecto.categoria} capitalize />}
            <InfoRow label="Responsable" value={proyecto.responsableNombre} />
            {fechaInicio && (
              <InfoRow
                label="Fecha de inicio"
                value={format(fechaInicio, "d 'de' MMMM, yyyy", { locale: es })}
              />
            )}
            {fechaFin && (
              <InfoRow
                label="Fecha estimada de fin"
                value={format(fechaFin, "d 'de' MMMM, yyyy", { locale: es })}
              />
            )}
            {estadisticas && (
              <>
                <InfoRow
                  label="Días transcurridos"
                  value={`${estadisticas.diasTranscurridos} de ${estadisticas.duracionTotal} días`}
                />
                <InfoRow
                  label="Días restantes"
                  value={estadisticas.diasRestantes}
                  className={estadisticas.diasRestantes < 7 ? 'text-danger font-semibold' : ''}
                />
              </>
            )}
          </div>
        </div>

        {/* Recursos */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-text">Recursos</h2>
          </div>
          <div className="space-y-3">
            {proyecto.presupuesto && proyecto.presupuesto > 0 && (
              <>
                <InfoRow
                  label="Presupuesto total"
                  value={`€${proyecto.presupuesto.toLocaleString()}`}
                />
                <InfoRow
                  label="Presupuesto gastado"
                  value={`€${(proyecto.presupuestoGastado || 0).toLocaleString()}`}
                />
                {estadisticas && (
                  <InfoRow
                    label="Eficiencia presupuesto"
                    value={`${estadisticas.eficienciaPresupuesto}%`}
                    className={
                      estadisticas.eficienciaPresupuesto > 100
                        ? 'text-danger font-semibold'
                        : estadisticas.eficienciaPresupuesto > 90
                        ? 'text-warn font-semibold'
                        : 'text-success font-semibold'
                    }
                  />
                )}
              </>
            )}
            {proyecto.horasEstimadas && proyecto.horasEstimadas > 0 && (
              <>
                <InfoRow label="Horas estimadas" value={`${proyecto.horasEstimadas}h`} />
                <InfoRow label="Horas reales" value={`${proyecto.horasReales || 0}h`} />
                {estadisticas && (
                  <InfoRow
                    label="Eficiencia horas"
                    value={`${estadisticas.eficienciaHoras}%`}
                    className={
                      estadisticas.eficienciaHoras > 120
                        ? 'text-danger font-semibold'
                        : estadisticas.eficienciaHoras > 100
                        ? 'text-warn font-semibold'
                        : 'text-success font-semibold'
                    }
                  />
                )}
              </>
            )}
            {estadisticas && (
              <InfoRow label="Miembros del equipo" value={estadisticas.miembrosEquipo} />
            )}
          </div>
        </div>
      </div>

      {/* Velocity y tendencias */}
      {estadisticas && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-text">Velocity del equipo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-text-muted mb-1">Última semana</p>
              <p className="text-3xl font-bold text-brand">{estadisticas.velocityActual}</p>
              <p className="text-xs text-text-muted">tareas completadas</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-text-muted mb-1">Promedio</p>
              <p className="text-3xl font-bold text-text">{estadisticas.velocityPromedio.toFixed(1)}</p>
              <p className="text-xs text-text-muted">tareas/semana</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-text-muted mb-1">Tendencia</p>
              <div className="flex items-center justify-center gap-2">
                {estadisticas.velocityActual >= estadisticas.velocityPromedio ? (
                  <>
                    <TrendingUp className="h-6 w-6 text-success" />
                    <p className="text-2xl font-bold text-success">+{Math.round((estadisticas.velocityActual / estadisticas.velocityPromedio - 1) * 100)}%</p>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-6 w-6 text-danger" />
                    <p className="text-2xl font-bold text-danger">{Math.round((estadisticas.velocityActual / estadisticas.velocityPromedio - 1) * 100)}%</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlaces y tags */}
      {(proyecto.enlaces && proyecto.enlaces.length > 0) || (proyecto.tags && proyecto.tags.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enlaces */}
          {proyecto.enlaces && proyecto.enlaces.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text mb-4">Enlaces</h3>
              <div className="space-y-2">
                {proyecto.enlaces.map((enlace, index) => (
                  <a
                    key={index}
                    href={enlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-sm text-brand hover:underline">{enlace.titulo}</span>
                    <span className="text-xs text-text-muted">({enlace.tipo})</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {proyecto.tags && proyecto.tags.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text mb-4">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {proyecto.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-brand-subtle text-brand text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
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
      <p className="text-2xl font-semibold text-text capitalize">{value}</p>
      {sublabel && <p className="text-xs text-text-muted mt-1">{sublabel}</p>}
    </div>
  );
}
