// components/pacientes/v2/PatientHeader.tsx
// Cabecera con información básica del paciente

import { Paciente, Profesional } from '@/types';
import { User, Phone, Mail, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientHeaderProps {
  paciente: Paciente;
  profesionalReferente: Profesional | null;
}

export default function PatientHeader({ paciente, profesionalReferente }: PatientHeaderProps) {
  const edad = Math.floor(
    (new Date().getTime() - new Date(paciente.fechaNacimiento).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-start justify-between">
        {/* Información principal */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>

          {/* Datos personales */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {paciente.nombre} {paciente.apellidos}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {edad} años ({format(new Date(paciente.fechaNacimiento), 'dd/MM/yyyy', { locale: es })})
                </span>
              </div>
              <div className="capitalize">{paciente.genero}</div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  paciente.estado === 'activo'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {paciente.estado}
              </div>
            </div>

            {/* Contacto */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              {paciente.telefono && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{paciente.telefono}</span>
                </div>
              )}
              {paciente.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{paciente.email}</span>
                </div>
              )}
              {paciente.ciudad && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{paciente.ciudad}</span>
                </div>
              )}
            </div>

            {/* Profesional referente */}
            {profesionalReferente && (
              <div className="mt-3 text-sm">
                <span className="text-gray-500">Profesional referente:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {profesionalReferente.nombre} {profesionalReferente.apellidos}
                </span>
                <span className="ml-2 text-gray-500 capitalize">
                  ({profesionalReferente.especialidad})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Alertas clínicas */}
        {(paciente.alertasClinicas.length > 0 || paciente.alergias.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Alertas</h3>
            </div>
            {paciente.alergias.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-red-800">Alergias:</p>
                <ul className="text-xs text-red-700 ml-2">
                  {paciente.alergias.map((alergia, idx) => (
                    <li key={idx}>• {alergia}</li>
                  ))}
                </ul>
              </div>
            )}
            {paciente.alertasClinicas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-800">Alertas clínicas:</p>
                <ul className="text-xs text-red-700 ml-2">
                  {paciente.alertasClinicas.map((alerta, idx) => (
                    <li key={idx}>• {alerta}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
