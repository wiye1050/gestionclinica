'use client';

import { Paciente, Profesional } from '@/types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  Calendar,
  FileText,
  DollarSign,
  Activity,
  AlertCircle,
  Shield,
  Users
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
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Datos Personales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna 1 */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Nombre completo</p>
              <p className="text-gray-900">{paciente.nombre} {paciente.apellidos}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de nacimiento</p>
              <p className="text-gray-900">
                {paciente.fechaNacimiento.toLocaleDateString('es-ES')} ({edad} años)
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Género</p>
              <p className="text-gray-900 capitalize">{paciente.genero || 'No especificado'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Documento</p>
              <p className="text-gray-900">
                {paciente.tipoDocumento || 'DNI'}: {paciente.documentoId || 'No registrado'}
              </p>
            </div>
          </div>

          {/* Columna 2 */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Teléfono
              </p>
              {paciente.telefono ? (
                <a href={`tel:${paciente.telefono}`} className="text-blue-600 hover:underline">
                  {paciente.telefono}
                </a>
              ) : (
                <p className="text-gray-400">No registrado</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </p>
              {paciente.email ? (
                <a href={`mailto:${paciente.email}`} className="text-blue-600 hover:underline break-all">
                  {paciente.email}
                </a>
              ) : (
                <p className="text-gray-400">No registrado</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Dirección
              </p>
              {paciente.direccion ? (
                <p className="text-gray-900">
                  {paciente.direccion}
                  {paciente.ciudad && `, ${paciente.ciudad}`}
                  {paciente.codigoPostal && ` (${paciente.codigoPostal})`}
                </p>
              ) : (
                <p className="text-gray-400">No registrada</p>
              )}
            </div>

            {paciente.aseguradora && (
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Seguro
                </p>
                <p className="text-gray-900">
                  {paciente.aseguradora}
                  {paciente.numeroPoliza && ` - Póliza: ${paciente.numeroPoliza}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contacto de emergencia */}
        {paciente.contactoEmergencia && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Contacto de Emergencia
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-900 font-medium">{paciente.contactoEmergencia.nombre}</p>
              <p className="text-sm text-gray-600">
                {paciente.contactoEmergencia.parentesco} • {paciente.contactoEmergencia.telefono}
              </p>
            </div>
          </div>
        )}

        {/* Profesional referente */}
        {profesionalReferente && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-500 mb-2">Profesional Referente</p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-gray-900 font-medium">
                {profesionalReferente.nombre} {profesionalReferente.apellidos}
              </p>
              <p className="text-sm text-gray-600 capitalize">{profesionalReferente.especialidad}</p>
            </div>
          </div>
        )}
      </section>

      {/* Alertas Médicas */}
      {((paciente.alergias?.length ?? 0) > 0 || 
        (paciente.alertasClinicas?.length ?? 0) > 0 ||
        (paciente.diagnosticosPrincipales?.length ?? 0) > 0) && (
        <section className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Información Médica Importante</h2>
          </div>

          {paciente.alergias && paciente.alergias.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-700 mb-2">🚨 Alergias</p>
              <div className="flex flex-wrap gap-2">
                {paciente.alergias.map((alergia, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                  >
                    {alergia}
                  </span>
                ))}
              </div>
            </div>
          )}

          {paciente.alertasClinicas && paciente.alertasClinicas.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-orange-700 mb-2">⚠️ Alertas Clínicas</p>
              <ul className="space-y-1">
                {paciente.alertasClinicas.map((alerta, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    {alerta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {paciente.diagnosticosPrincipales && paciente.diagnosticosPrincipales.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">📋 Diagnósticos Principales</p>
              <ul className="space-y-1">
                {paciente.diagnosticosPrincipales.map((diagnostico, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {diagnostico}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Próximas Citas */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Próximas Citas</h2>
          </div>
          {proximasCitas.length > 0 && (
            <span className="text-sm text-gray-500">{proximasCitas.length} programadas</span>
          )}
        </div>

        {proximasCitas.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No hay citas programadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proximasCitas.map((cita) => (
              <div key={cita.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-gray-900">
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
                  <p className="text-sm text-gray-600">{cita.profesional} • {cita.tipo}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tratamientos Activos */}
      {tratamientosActivos.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tratamientos Activos</h2>
            </div>
            <span className="text-sm text-gray-500">{tratamientosActivos.length} en curso</span>
          </div>

          <div className="space-y-3">
            {tratamientosActivos.map((tratamiento) => (
              <div key={tratamiento.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{tratamiento.nombre}</p>
                  <span className="text-sm text-gray-600">{tratamiento.progreso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${tratamiento.progreso}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">{tratamiento.profesional}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estadísticas */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{estadisticas.totalCitas}</p>
            <p className="text-sm text-gray-600">Total Citas</p>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{estadisticas.tratamientosCompletados}</p>
            <p className="text-sm text-gray-600">Completados</p>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {estadisticas.ultimaVisita 
                ? Math.floor((new Date().getTime() - estadisticas.ultimaVisita.getTime()) / (24 * 60 * 60 * 1000))
                : '-'}
            </p>
            <p className="text-sm text-gray-600">Días desde última visita</p>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{estadisticas.facturasPendientes}€</p>
            <p className="text-sm text-gray-600">Pendiente</p>
          </div>
        </div>
      </section>
    </div>
  );
}
