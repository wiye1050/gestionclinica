'use client';

import { useState } from 'react';
import type { PacienteV2 as Paciente } from '@/types/paciente-v2';
import { Badge } from '@/components/ui/Badge';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  AlertTriangle,
  Edit,
  FileText,
  DollarSign,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';

interface PatientHeaderProps {
  paciente: Paciente;
  onNewCita?: () => void;
  onNewNota?: () => void;
  onUploadDoc?: () => void;
}

export default function PatientHeader({ paciente, onNewCita, onNewNota, onUploadDoc }: PatientHeaderProps) {
  const [showActions, setShowActions] = useState(false);

  const edad = Math.floor(
    (new Date().getTime() - paciente.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const tieneAlertas = (paciente.alergias?.length ?? 0) > 0 || (paciente.alertasClinicas?.length ?? 0) > 0;

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-2xl font-semibold text-white md:h-24 md:w-24">
              {paciente.nombre[0]}
              {paciente.apellidos[0]}
            </div>
            {tieneAlertas && (
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-danger text-white">
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-text">
                {paciente.nombre} {paciente.apellidos}
              </h1>
              <Badge tone={paciente.estado === 'activo' ? 'success' : 'muted'}>{paciente.estado}</Badge>
            </div>
            <div className="grid gap-3 text-sm text-text-muted sm:grid-cols-2 lg:grid-cols-4">
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4 text-text-muted" />
                {edad} años
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-text-muted" />
                {paciente.documentoId || 'Sin documento'}
              </span>
              {paciente.telefono && (
                <a href={`tel:${paciente.telefono}`} className="inline-flex items-center gap-2 hover:text-brand">
                  <Phone className="h-4 w-4 text-text-muted" />
                  {paciente.telefono}
                </a>
              )}
              {paciente.email && (
                <a href={`mailto:${paciente.email}`} className="inline-flex items-center gap-2 hover:text-brand">
                  <Mail className="h-4 w-4 text-text-muted" />
                  <span className="truncate">{paciente.email}</span>
                </a>
              )}
            </div>
            {tieneAlertas && (
              <div className="space-y-2 rounded-2xl border border-danger/40 bg-danger-bg px-4 py-3 text-sm text-danger">
                <p className="font-semibold text-danger">Alertas médicas</p>
                {paciente.alergias?.length ? <p>Alergias: {paciente.alergias.join(', ')}</p> : null}
                {paciente.alertasClinicas?.length ? <p>{paciente.alertasClinicas.join(' • ')}</p> : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px]">
          <button
            onClick={onNewCita}
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
          >
            <Calendar className="h-4 w-4" />
            Nueva cita
          </button>
          <Link
            href={`/dashboard/pacientes/${paciente.id}/editar`}
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-cardHover"
          >
            <Edit className="h-4 w-4" />
            Editar ficha
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowActions((prev) => !prev)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-cardHover"
            >
              <MoreVertical className="h-4 w-4" />
              Más acciones
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-56 space-y-1 panel-block p-2 shadow-lg">
                <button
                  onClick={() => {
                    onNewNota?.();
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-cardHover"
                >
                  <FileText className="h-4 w-4" />
                  Nueva nota
                </button>
                <button
                  onClick={() => {
                    onUploadDoc?.();
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-cardHover"
                >
                  <FileText className="h-4 w-4" />
                  Subir documento
                </button>
                <Link
                  href={`/dashboard/facturacion?paciente=${paciente.id}`}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-cardHover"
                >
                  <DollarSign className="h-4 w-4" />
                  Ver facturación
                </Link>
                <button
                  onClick={() => {
                    if (paciente.email) window.location.href = `mailto:${paciente.email}`;
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-cardHover disabled:opacity-50"
                  disabled={!paciente.email}
                >
                  <Mail className="h-4 w-4" />
                  Enviar email
                </button>
                <button
                  onClick={() => {
                    if (paciente.telefono) window.location.href = `tel:${paciente.telefono}`;
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-cardHover disabled:opacity-50"
                  disabled={!paciente.telefono}
                >
                  <Phone className="h-4 w-4" />
                  Llamar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
