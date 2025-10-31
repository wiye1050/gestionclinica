'use client';

import { useState } from 'react';
import { Paciente } from '@/types';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle,
  Heart,
  Edit,
  FileText,
  DollarSign,
  MoreVertical,
  UserPlus
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar y datos principales */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
              {paciente.nombre[0]}{paciente.apellidos[0]}
            </div>
            {tieneAlertas && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {paciente.nombre} {paciente.apellidos}
              </h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                paciente.estado === 'activo' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {paciente.estado}
              </span>
            </div>

            {/* Datos básicos en grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{edad} años</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{paciente.documentoId || 'Sin DNI'}</span>
              </div>
              {paciente.telefono && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${paciente.telefono}`} className="hover:text-blue-600">
                    {paciente.telefono}
                  </a>
                </div>
              )}
              {paciente.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${paciente.email}`} className="hover:text-blue-600 truncate">
                    {paciente.email}
                  </a>
                </div>
              )}
            </div>

            {/* Alertas críticas */}
            {tieneAlertas && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 text-sm mb-1">Alertas Médicas</p>
                    {paciente.alergias && paciente.alergias.length > 0 && (
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Alergias:</span> {paciente.alergias.join(', ')}
                      </p>
                    )}
                    {paciente.alertasClinicas && paciente.alertasClinicas.length > 0 && (
                      <p className="text-sm text-red-700 mt-1">
                        {paciente.alertasClinicas.join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-col gap-2 md:min-w-[200px]">
          <button
            onClick={onNewCita}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            Nueva Cita
          </button>

          <Link
            href={`/dashboard/pacientes/${paciente.id}/editar`}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <MoreVertical className="w-4 h-4" />
              Más acciones
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <button
                  onClick={() => { onNewNota?.(); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <FileText className="w-4 h-4" />
                  Nueva Nota
                </button>
                <button
                  onClick={() => { onUploadDoc?.(); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4" />
                  Subir Documento
                </button>
                <Link
                  href={`/dashboard/facturacion?paciente=${paciente.id}`}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <DollarSign className="w-4 h-4" />
                  Ver Facturas
                </Link>
                <button
                  onClick={() => { 
                    if (paciente.email) window.location.href = `mailto:${paciente.email}`;
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  disabled={!paciente.email}
                >
                  <Mail className="w-4 h-4" />
                  Enviar Email
                </button>
                <button
                  onClick={() => { 
                    if (paciente.telefono) window.location.href = `tel:${paciente.telefono}`;
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                  disabled={!paciente.telefono}
                >
                  <Phone className="w-4 h-4" />
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
