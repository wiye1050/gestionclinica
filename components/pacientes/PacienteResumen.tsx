'use client';

import { Paciente, Profesional } from '@/types';

interface PacienteResumenProps {
  paciente: Paciente;
  profesionalReferente?: Profesional | null;
}

const infoRow = (label: string, value?: string | null) => (
  <div className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm text-gray-900">{value && value.length > 0 ? value : '—'}</span>
  </div>
);

export function PacienteResumen({ paciente, profesionalReferente }: PacienteResumenProps) {
  const edad = (() => {
    if (!paciente.fechaNacimiento) return null;
    const diff = Date.now() - paciente.fechaNacimiento.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  })();

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Riesgo</p>
          <p className="text-3xl font-semibold text-gray-900">
            {paciente.riesgo ? paciente.riesgo.toUpperCase() : 'Sin asignar'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Estado</p>
          <p className="text-lg font-semibold text-gray-900">
            {paciente.estado ? paciente.estado.toUpperCase() : 'Sin estado'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {infoRow('Fecha nacimiento', paciente.fechaNacimiento?.toLocaleDateString('es-ES'))}
        {infoRow('Edad', edad !== null ? `${edad} años` : null)}
        {infoRow('Documento', paciente.documentoId)}
        {infoRow('Teléfono', paciente.telefono)}
        {infoRow('Email', paciente.email)}
        {infoRow('Aseguradora', paciente.aseguradora)}
        {infoRow('Póliza', paciente.numeroPoliza)}
        {infoRow(
          'Referente',
          profesionalReferente
            ? `${profesionalReferente.nombre} ${profesionalReferente.apellidos}`
            : null
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Ubicación</p>
        <p className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-900">
          {paciente.direccion ? (
            <>
              {paciente.direccion}
              {paciente.ciudad ? `, ${paciente.ciudad}` : ''}
              {paciente.codigoPostal ? ` (${paciente.codigoPostal})` : ''}
            </>
          ) : (
            'No hay dirección registrada'
          )}
        </p>
      </div>

      {paciente.contactoEmergencia && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Contacto de emergencia</p>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-900">
            <p className="font-medium">
              {paciente.contactoEmergencia.nombre}{' '}
              <span className="text-xs text-gray-500">
                ({paciente.contactoEmergencia.parentesco})
              </span>
            </p>
            <p className="text-gray-600">{paciente.contactoEmergencia.telefono || 'Sin teléfono'}</p>
          </div>
        </div>
      )}

      {paciente.notasInternas && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Notas internas</p>
          <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
            {paciente.notasInternas}
          </p>
        </div>
      )}
    </section>
  );
}
