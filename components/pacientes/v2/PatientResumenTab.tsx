// components/pacientes/v2/PatientResumenTab.tsx
// Tab de resumen general del paciente

import { Paciente, Profesional } from '@/types';
import { Cita, Tratamiento } from '@/types/paciente-v2';
import { Calendar, Activity, DollarSign, Clock, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientResumenTabProps {
  paciente: Paciente;
  profesionalReferente: Profesional | null;
  proximasCitas: Cita[];
  tratamientosActivos: Tratamiento[];
  estadisticas: {
    totalCitas: number;
    ultimaVisita?: Date;
    tratamientosCompletados: number;
    facturasPendientes: number;
  };
}

export default function PatientResumenTab({
  paciente,
  profesionalReferente,
  proximasCitas,
  tratamientosActivos,
  estadisticas,
}: PatientResumenTabProps) {
  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Citas</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalCitas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tratamientos</p>
              <p className="text-2xl font-bold text-gray-900">{tratamientosActivos.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.tratamientosCompletados}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Facturas Pend.</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.facturasPendientes}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Información general */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información personal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Teléfono:</span>
              <span className="font-medium">{paciente.telefono || 'No registrado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{paciente.email || 'No registrado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dirección:</span>
              <span className="font-medium text-right">{paciente.direccion || 'No registrada'}</span>
            </div>
            {paciente.contactoEmergencia && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-gray-700 font-medium mb-2">Contacto de Emergencia</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="font-medium">{paciente.contactoEmergencia.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="font-medium">{paciente.contactoEmergencia.telefono}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Parentesco:</span>
                  <span className="font-medium">{paciente.contactoEmergencia.parentesco}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Seguro */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Información del Seguro
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Aseguradora:</span>
              <span className="font-medium">{paciente.aseguradora || 'No asegurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Número de póliza:</span>
              <span className="font-medium">{paciente.numeroPoliza || 'N/A'}</span>
            </div>
            {estadisticas.ultimaVisita && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-gray-700 font-medium mb-2">Última Visita</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha:</span>
                  <span className="font-medium">
                    {format(estadisticas.ultimaVisita, "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Próximas citas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Próximas Citas
        </h3>
        {proximasCitas.length > 0 ? (
          <div className="space-y-3">
            {proximasCitas.map((cita) => (
              <div key={cita.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{cita.servicioNombre || cita.tipo}</p>
                  <p className="text-sm text-gray-600">{cita.profesionalNombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {format(cita.fecha, "d 'de' MMM", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-600">{cita.horaInicio}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay citas programadas</p>
        )}
      </div>

      {/* Tratamientos activos */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Tratamientos Activos
        </h3>
        {tratamientosActivos.length > 0 ? (
          <div className="space-y-3">
            {tratamientosActivos.map((tratamiento) => (
              <div key={tratamiento.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{tratamiento.servicioNombre}</p>
                  <p className="text-sm text-gray-600">{tratamiento.profesionalNombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {tratamiento.vecesRealizadoMes} veces este mes
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{tratamiento.estado}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay tratamientos activos</p>
        )}
      </div>
    </div>
  );
}
