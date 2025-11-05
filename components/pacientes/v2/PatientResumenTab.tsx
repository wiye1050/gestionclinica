'use client';

import type { PacienteV2 as Paciente } from '@/types/paciente-v2';
import type { Profesional } from '@/types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  Calendar,
  FileText,
  Activity,
  AlertCircle,
  Shield
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
}

export default function PatientResumenTab({
  paciente,
  profesionalReferente,
  proximasCitas = [],
  tratamientosActivos = [],
  estadisticas = {
    totalCitas: 0,
    tratamientosCompletados: 0,
    facturasPendientes: 0
  }
}: PatientResumenTabProps) {
  const edad = Math.floor(
    (new Date().getTime() - paciente.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      {/* Datos Personales */}
      <section className="bg-card rounded-3xl shadow-sm border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-text-muted" />
          <h2 className="text-lg font-semibold text-text">Datos Personales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna 1 */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-text-muted">Nombre completo</p>
              <p className="text-text">{paciente.nombre} {paciente.apellidos}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-text-muted">Fecha de nacimiento</p>
              <p className="text-text">
                {paciente.fechaNacimiento.toLocaleDateString('es-ES')} ({edad} años)
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-text-muted">Género</p>
              <p className="text-text capitalize">{paciente.genero || 'No especificado'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-text-muted">Documento</p>
              <p className="text-text">
                {paciente.tipoDocumento || 'DNI'}: {paciente.documentoId || 'No registrado'}
              </p>
            </div>
          </div>

          {/* Columna 2 */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-text-muted flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Teléfono
              </p>
              {paciente.telefono ? (
                <a href={`tel:${paciente.telefono}`} className="text-brand hover:underline">
                  {paciente.telefono}
                </a>
              ) : (
                <p className="text-text-muted">No registrado</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-text-muted flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </p>
              {paciente.email ? (
                <a href={`mailto:${paciente.email}`} className="text-brand hover:underline break-all">
                  {paciente.email}
                </a>
              ) : (
                <p className="text-text-muted">No registrado</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-text-muted flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Dirección
              </p>
              {paciente.direccion ? (
                <p className="text-text">
                  {paciente.direccion}
                  {paciente.ciudad && `, ${paciente.ciudad}`}
                  {paciente.codigoPostal && ` (${paciente.codigoPostal})`}
                </p>
              ) : (
                <p className="text-text-muted">No registrada</p>
              )}
            </div>

            {paciente.aseguradora && (
              <div>
                <p className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Seguro
                </p>
                <p className="text-text">
                  {paciente.aseguradora}
                  {paciente.numeroPoliza && ` - Póliza: ${paciente.numeroPoliza}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contacto de emergencia */}
        {paciente.contactoEmergencia && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-text-muted mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Contacto de Emergencia
            </p>
            <div className="bg-cardHover rounded-2xl p-3">
              <p className="text-text font-medium">{paciente.contactoEmergencia.nombre}</p>
              <p className="text-sm text-text-muted">
                {paciente.contactoEmergencia.parentesco} • {paciente.contactoEmergencia.telefono}
              </p>
            </div>
          </div>
        )}

        {/* Profesional referente */}
        {profesionalReferente && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-text-muted mb-2">Profesional Referente</p>
            <div className="bg-brand-subtle rounded-3xl p-3">
              <p className="text-text font-medium">
                {profesionalReferente.nombre} {profesionalReferente.apellidos}
              </p>
              <p className="text-sm text-text-muted capitalize">{profesionalReferente.especialidad}</p>
            </div>
          </div>
        )}
      </section>

      {/* Alertas Médicas */}
      {((paciente.alergias?.length ?? 0) > 0 || 
        (paciente.alertasClinicas?.length ?? 0) > 0 ||
        (paciente.diagnosticosPrincipales?.length ?? 0) > 0) && (
        <section className="bg-card rounded-3xl shadow-sm border border-danger p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-danger" />
            <h2 className="text-lg font-semibold text-danger">Información Médica Importante</h2>
          </div>

          {paciente.alergias && paciente.alergias.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-danger mb-2">🚨 Alergias</p>
              <div className="flex flex-wrap gap-2">
                {paciente.alergias.map((alergia, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-danger-bg text-danger rounded-full text-sm font-medium"
                  >
                    {alergia}
                  </span>
                ))}
              </div>
            </div>
          )}

          {paciente.alertasClinicas && paciente.alertasClinicas.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-warning mb-2">⚠️ Alertas Clínicas</p>
              <ul className="space-y-1">
                {paciente.alertasClinicas.map((alerta, index) => (
                  <li key={index} className="text-sm text-text flex items-start gap-2">
                    <span className="text-warning">•</span>
                    {alerta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {paciente.diagnosticosPrincipales && paciente.diagnosticosPrincipales.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text mb-2">📋 Diagnósticos Principales</p>
              <ul className="space-y-1">
                {paciente.diagnosticosPrincipales.map((diagnostico, index) => (
                  <li key={index} className="text-sm text-text flex items-start gap-2">
                    <span className="text-brand">•</span>
                    {diagnostico}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Próximas Citas */}
      <section className="bg-card rounded-3xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-text-muted" />
            <h2 className="text-lg font-semibold text-text">Próximas Citas</h2>
          </div>
          {proximasCitas.length > 0 && (
            <span className="text-sm text-text-muted">{proximasCitas.length} programadas</span>
          )}
        </div>

        {proximasCitas.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p>No hay citas programadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proximasCitas.map((cita) => (
              <div key={cita.id} className="flex items-center justify-between p-3 bg-brand-subtle rounded-3xl border border-brand">
                <div>
                  <p className="font-medium text-text">
                    {cita.fecha.toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                    {' '}a las{' '}
                    {cita.fecha.toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-sm text-text-muted">{cita.profesional} • {cita.tipo}</p>
                </div>
                <button className="text-brand hover:text-brand-hover text-sm font-medium">
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tratamientos Activos */}
      {tratamientosActivos.length > 0 && (
        <section className="bg-card rounded-3xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-text-muted" />
              <h2 className="text-lg font-semibold text-text">Tratamientos Activos</h2>
            </div>
            <span className="text-sm text-text-muted">{tratamientosActivos.length} en curso</span>
          </div>

          <div className="space-y-3">
            {tratamientosActivos.map((tratamiento) => (
              <div key={tratamiento.id} className="p-3 bg-cardHover rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-text">{tratamiento.nombre}</p>
                  <span className="text-sm text-text-muted">{tratamiento.progreso}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div 
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${tratamiento.progreso}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted">{tratamiento.profesional}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estadísticas */}
      <section className="bg-card rounded-3xl shadow-sm border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-text-muted" />
          <h2 className="text-lg font-semibold text-text">Resumen</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-brand-subtle rounded-3xl">
            <p className="text-2xl font-bold text-brand">{estadisticas.totalCitas}</p>
            <p className="text-sm text-text-muted">Total Citas</p>
          </div>

          <div className="text-center p-3 bg-success-bg rounded-3xl">
            <p className="text-2xl font-bold text-success">{estadisticas.tratamientosCompletados}</p>
            <p className="text-sm text-text-muted">Completados</p>
          </div>

          <div className="text-center p-3 bg-accent-bg rounded-3xl">
            <p className="text-2xl font-bold text-accent">
              {estadisticas.ultimaVisita 
                ? Math.floor((new Date().getTime() - estadisticas.ultimaVisita.getTime()) / (24 * 60 * 60 * 1000))
                : '-'}
            </p>
            <p className="text-sm text-text-muted">Días desde última visita</p>
          </div>

          <div className="text-center p-3 bg-warning-bg rounded-3xl">
            <p className="text-2xl font-bold text-warning">{estadisticas.facturasPendientes}€</p>
            <p className="text-sm text-text-muted">Pendiente</p>
          </div>
        </div>
      </section>
    </div>
  );
}
