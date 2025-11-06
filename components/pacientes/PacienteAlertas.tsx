'use client';

import { Paciente } from '@/types';

interface PacienteAlertasProps {
  paciente: Paciente;
}

const tagClass = 'inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700';

export function PacienteAlertas({ paciente }: PacienteAlertasProps) {
  const hasAlertas =
    (paciente.alergias && paciente.alergias.length > 0) ||
    (paciente.alertasClinicas && paciente.alertasClinicas.length > 0);

  if (!hasAlertas) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Alertas clínicas</h2>
        <p className="mt-2 text-sm text-gray-500">No hay alergias ni alertas registradas.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Alertas clínicas</h2>
      <p className="mt-1 text-sm text-red-700">
        Verifica estas alertas antes de cualquier procedimiento con el paciente.
      </p>

      {paciente.alergias?.length ? (
        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium text-red-800">Alergias</p>
          <div className="flex flex-wrap gap-2">
            {paciente.alergias.map((alergia) => (
              <span key={alergia} className={tagClass}>
                {alergia}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {paciente.alertasClinicas?.length ? (
        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium text-red-800">Alertas clínicas</p>
          <div className="flex flex-wrap gap-2">
            {paciente.alertasClinicas.map((alerta) => (
              <span key={alerta} className={tagClass}>
                {alerta}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
