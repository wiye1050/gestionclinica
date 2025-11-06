// components/pacientes/v2/PatientHistorialClinicoTab.tsx
// Tab de historial clínico (con datos mock temporales)

import { AlertTriangle, Pill, FileText, Syringe } from 'lucide-react';

// TODO: Crear interfaces apropiadas y obtener datos reales
interface Alergia {
  nombre: string;
  severidad: 'leve' | 'moderada' | 'grave';
  fechaDiagnostico: Date;
  notas?: string;
}

interface Medicamento {
  nombre: string;
  dosis: string;
  frecuencia: string;
  prescriptor: string;
  fechaInicio: Date;
}

interface Antecedente {
  tipo: 'personal' | 'familiar';
  descripcion: string;
  fecha?: Date;
}

interface Vacuna {
  nombre: string;
  fecha: Date;
  lote?: string;
  proximaDosis?: Date;
}

interface PatientHistorialClinicoTabProps {
  alergias: Alergia[];
  medicamentos: Medicamento[];
  antecedentes: Antecedente[];
  vacunas: Vacuna[];
}

export default function PatientHistorialClinicoTab({
  alergias,
  medicamentos,
  antecedentes,
  vacunas,
}: PatientHistorialClinicoTabProps) {
  return (
    <div className="space-y-6">
      {/* Alergias */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Alergias
        </h3>
        {alergias.length > 0 ? (
          <div className="space-y-3">
            {alergias.map((alergia, idx) => (
              <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alergia.nombre}</p>
                    {alergia.notas && <p className="text-sm text-gray-600 mt-1">{alergia.notas}</p>}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      alergia.severidad === 'grave'
                        ? 'bg-red-100 text-red-700'
                        : alergia.severidad === 'moderada'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {alergia.severidad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay alergias registradas</p>
        )}
      </div>

      {/* Medicamentos actuales */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" />
          Medicamentos Actuales
        </h3>
        {medicamentos.length > 0 ? (
          <div className="space-y-3">
            {medicamentos.map((med, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{med.nombre}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {med.dosis} - {med.frecuencia}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Prescrito por: {med.prescriptor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay medicamentos registrados</p>
        )}
      </div>

      {/* Antecedentes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Antecedentes Médicos
        </h3>
        {antecedentes.length > 0 ? (
          <div className="space-y-3">
            {antecedentes.map((ant, idx) => (
              <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">
                    {ant.tipo}
                  </span>
                  <p className="text-sm text-gray-900 flex-1">{ant.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay antecedentes registrados</p>
        )}
      </div>

      {/* Vacunas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Syringe className="w-5 h-5 text-green-600" />
          Vacunas
        </h3>
        {vacunas.length > 0 ? (
          <div className="space-y-3">
            {vacunas.map((vac, idx) => (
              <div key={idx} className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{vac.nombre}</p>
                    <p className="text-sm text-gray-600">
                      Aplicada: {vac.fecha.toLocaleDateString('es-ES')}
                    </p>
                    {vac.proximaDosis && (
                      <p className="text-xs text-gray-500 mt-1">
                        Próxima dosis: {vac.proximaDosis.toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay vacunas registradas</p>
        )}
      </div>
    </div>
  );
}
