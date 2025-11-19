'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { PacienteV2 as Paciente } from '@/types/paciente-v2';
import type { Profesional } from '@/types';
import {
  Activity,
  AlertCircle,
  Calendar,
  ChevronRight,
  FileText,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react';

interface PatientResumenTabProps {
  paciente: Paciente;
  profesionalReferente?: Profesional | null;
  proximasCitas?: Array<{
    id: string;
    fecha: Date;
    profesional: string;
    tipo: string;
  }>;
  tratamientosActivos?: Array<{
    id: string;
    nombre: string;
    progreso: number;
    profesional: string;
  }>;
  estadisticas?: {
    totalCitas: number;
    ultimaVisita?: Date;
    tratamientosCompletados: number;
    facturasPendientes: number;
  };
  agendaLink?: string;
}

export default function PatientResumenTab({
  paciente,
  profesionalReferente,
  proximasCitas = [],
  tratamientosActivos = [],
  estadisticas = {
    totalCitas: 0,
    tratamientosCompletados: 0,
    facturasPendientes: 0,
  },
  agendaLink,
}: PatientResumenTabProps) {
  const edad = Math.floor(
    (new Date().getTime() - paciente.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
      <section className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-text-muted" />
            <h2 className="text-lg font-semibold text-text">Datos personales</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <InfoRow label="Nombre completo" value={`${paciente.nombre} ${paciente.apellidos}`} />
              <InfoRow
                label="Fecha de nacimiento"
                value={`${paciente.fechaNacimiento.toLocaleDateString('es-ES')} (${edad} años)`}
              />
              <InfoRow label="Género" value={paciente.genero || 'No especificado'} capitalize />
              <InfoRow
                label="Documento"
                value={`${paciente.tipoDocumento || 'DNI'}: ${paciente.documentoId || 'No registrado'}`}
              />
            </div>
            <div className="space-y-3">
              <InfoRow
                label="Teléfono"
                icon={<Phone className="h-4 w-4" />}
                value={
                  paciente.telefono ? (
                    <a href={`tel:${paciente.telefono}`} className="text-brand hover:underline">
                      {paciente.telefono}
                    </a>
                  ) : (
                    'No registrado'
                  )
                }
              />
              <InfoRow
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                value={
                  paciente.email ? (
                    <a href={`mailto:${paciente.email}`} className="text-brand hover:underline break-all">
                      {paciente.email}
                    </a>
                  ) : (
                    'No registrado'
                  )
                }
              />
              <InfoRow
                label="Dirección"
                icon={<MapPin className="h-4 w-4" />}
                value={
                  paciente.direccion
                    ? `${paciente.direccion}${paciente.ciudad ? `, ${paciente.ciudad}` : ''}${
                        paciente.codigoPostal ? ` (${paciente.codigoPostal})` : ''
                      }`
                    : 'No registrada'
                }
              />
              {paciente.aseguradora ? (
                <InfoRow
                  label="Seguro"
                  icon={<Shield className="h-4 w-4" />}
                  value={`${paciente.aseguradora}${
                    paciente.numeroPoliza ? ` · ${paciente.numeroPoliza}` : ''
                  }`}
                />
              ) : null}
            </div>
          </div>
          {paciente.contactoEmergencia && (
            <div className="rounded-2xl border border-border bg-cardHover p-4">
              <p className="text-sm font-semibold text-text-muted mb-1 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-danger" />
                Contacto de emergencia
              </p>
              <p className="text-text font-medium">{paciente.contactoEmergencia.nombre}</p>
              <p className="text-sm text-text-muted">
                {paciente.contactoEmergencia.parentesco} · {paciente.contactoEmergencia.telefono}
              </p>
            </div>
          )}
          {profesionalReferente && (
            <div className="rounded-2xl border border-border bg-brand-subtle/40 p-4">
              <p className="text-sm font-semibold text-text-muted mb-1">Profesional referente</p>
              <p className="text-text font-medium">
                {profesionalReferente.nombre} {profesionalReferente.apellidos}
              </p>
              <p className="text-sm text-text-muted capitalize">{profesionalReferente.especialidad}</p>
            </div>
          )}
        </div>

        {(paciente.alergias?.length ||
          paciente.alertasClinicas?.length ||
          paciente.diagnosticosPrincipales?.length) && (
          <div className="space-y-4 rounded-3xl border border-danger bg-card p-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-danger" />
              <h2 className="text-lg font-semibold text-danger">Información médica relevante</h2>
            </div>
            {paciente.alergias?.length ? (
              <SectionChips title="Alergias" chips={paciente.alergias} tone="danger" />
            ) : null}
            {paciente.alertasClinicas?.length ? (
              <div>
                <p className="text-sm font-medium text-danger mb-2">Alertas clínicas</p>
                <div className="space-y-2">
                  {paciente.alertasClinicas.map((alerta) => (
                    <div key={alerta} className="rounded-2xl bg-cardHover px-3 py-2 text-sm">
                      {alerta}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {paciente.diagnosticosPrincipales?.length ? (
              <SectionChips
                title="Diagnósticos principales"
                chips={paciente.diagnosticosPrincipales}
                tone="neutral"
              />
            ) : null}
          </div>
        )}
      </section>

      <section className="lg:col-span-5 space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold">Estadísticas</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Total citas"
              value={estadisticas.totalCitas}
              helper={
                estadisticas.ultimaVisita
                  ? `Última: ${estadisticas.ultimaVisita.toLocaleDateString('es-ES')}`
                  : 'Sin visitas registradas'
              }
            />
            <KpiCard
              label="Tratamientos completados"
              value={estadisticas.tratamientosCompletados}
              tone="success"
            />
            <KpiCard
              label="Facturas pendientes"
              value={estadisticas.facturasPendientes}
              tone="warn"
            />
            <KpiCard label="Edad" value={edad} helper="Años" />
          </div>
        </div>

        <UpcomingCitasTimeline proximasCitas={proximasCitas} agendaLink={agendaLink} />

        <CardList
          title="Tratamientos activos"
          icon={<Activity className="h-5 w-5 text-brand" />}
          emptyMessage="No hay tratamientos activos registrados."
          items={tratamientosActivos.map((tratamiento) => ({
            id: tratamiento.id,
            primary: tratamiento.nombre,
            secondary: `Profesional: ${tratamiento.profesional}`,
            extra: `${tratamiento.progreso}%`,
          }))}
        />
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  capitalize,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-text-muted flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`text-text ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  tone = 'brand',
}: {
  label: string;
  value: React.ReactNode;
  helper?: string;
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
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-2xl font-semibold text-text">{value}</p>
      {helper && <p className="text-xs text-text-muted">{helper}</p>}
    </div>
  );
}

function SectionChips({
  title,
  chips,
  tone,
}: {
  title: string;
  chips: string[];
  tone: 'danger' | 'neutral';
}) {
  const chipClass =
    tone === 'danger'
      ? 'bg-danger-bg text-danger border border-danger/30'
      : 'bg-cardHover text-text border border-border';

  return (
    <div>
      <p className="text-sm font-medium text-text-muted mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className={`rounded-2xl px-3 py-1 text-xs font-semibold ${chipClass}`}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function CardList({
  title,
  icon,
  items,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: string; primary: string; secondary?: string; extra?: string }>;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-text">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-text">{item.primary}</p>
                {item.secondary && <p className="text-xs text-text-muted">{item.secondary}</p>}
              </div>
              <div className="flex items-center gap-3">
                {item.extra && <span className="text-xs font-semibold text-brand">{item.extra}</span>}
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingCitasTimeline({
  proximasCitas,
  agendaLink,
}: {
  proximasCitas: PatientResumenTabProps['proximasCitas'];
  agendaLink?: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <Calendar className="h-5 w-5 text-brand" />
        <h2 className="text-lg font-semibold text-text flex-1 ml-2">Próximas citas</h2>
        {agendaLink && (
          <Link
            href={agendaLink}
            className="rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle"
          >
            Ver en Agenda
          </Link>
        )}
      </div>
      {proximasCitas.length === 0 ? (
        <p className="text-sm text-text-muted">Este paciente no tiene citas próximas.</p>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {proximasCitas.map((cita) => {
              const tipoStyle = getTipoBadgeStyles(cita.tipo);
              return (
                <div key={cita.id} className="relative pl-4">
                  <div className="absolute left-[-0.65rem] top-2 h-3 w-3 rounded-full" style={tipoStyle.dot} />
                  <div className="rounded-2xl border border-border px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={tipoStyle.badge}>
                        {cita.tipo}
                      </span>
                      <span className="text-xs font-semibold uppercase text-text-muted">
                        {cita.fecha.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-text">{cita.profesional}</p>
                    <p className="text-xs text-text-muted">
                      {cita.fecha.toLocaleDateString('es-ES')} ·{' '}
                      {cita.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getTipoBadgeStyles(tipo: string) {
  switch (tipo) {
    case 'consulta':
      return {
        dot: { backgroundColor: '#2563eb' },
        badge: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
      };
    case 'seguimiento':
      return {
        dot: { backgroundColor: '#059669' },
        badge: { backgroundColor: '#d1fae5', color: '#047857' },
      };
    case 'urgencia':
      return {
        dot: { backgroundColor: '#dc2626' },
        badge: { backgroundColor: '#fee2e2', color: '#b91c1c' },
      };
    case 'tratamiento':
      return {
        dot: { backgroundColor: '#7c3aed' },
        badge: { backgroundColor: '#ede9fe', color: '#6d28d9' },
      };
    default:
      return {
        dot: { backgroundColor: '#6b7280' },
        badge: { backgroundColor: '#e5e7eb', color: '#374151' },
      };
  }
}
