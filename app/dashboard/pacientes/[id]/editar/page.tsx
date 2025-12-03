'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';
import { usePaciente } from '@/lib/hooks/usePatientDetailData';
import type { PacienteFormValues } from '@/components/pacientes/PacienteForm';
import { toast } from 'sonner';
import { captureError } from '@/lib/utils/errorLogging';
import SkeletonLoader from '@/components/shared/SkeletonLoader';

// Lazy load PacienteForm for better performance
const PacienteForm = dynamic(
  () => import('@/components/pacientes/PacienteForm').then((mod) => ({ default: mod.PacienteForm })),
  { ssr: false, loading: () => <SkeletonLoader /> }
);

export default function EditarPacientePage() {
  const params = useParams();
  const pacienteId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: paciente,
    isLoading: loadingPaciente,
    error: pacienteError,
  } = usePaciente(pacienteId);

  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionalesManager();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const loading = loadingPaciente || loadingProfesionales;
  const error = pacienteError
    ? pacienteError instanceof Error
      ? pacienteError.message
      : 'No se pudo cargar el paciente'
    : null;

  const handleSubmit = async (values: PacienteFormValues) => {
    if (!user || !pacienteId) {
      toast.error('No tienes permisos para editar este paciente.');
      return;
    }

    setSubmitError(null);
    try {
      const alergias = values.alergias
        ? values.alergias.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
      const alertas = values.alertasClinicas
        ? values.alertasClinicas.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
      const diagnosticos = values.diagnosticosPrincipales
        ? values.diagnosticosPrincipales.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      const response = await fetch(`/api/pacientes/${pacienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          alergias,
          alertasClinicas: alertas,
          diagnosticosPrincipales: diagnosticos,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el paciente');
      }

      toast.success('Paciente actualizado correctamente');
      router.push(`/dashboard/pacientes/${pacienteId}`);
    } catch (err) {
      captureError(err, { module: 'editar-paciente-page', action: 'update-paciente', metadata: { pacienteId } });
      const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el paciente.';
      setSubmitError(mensaje);
      toast.error('No se pudo actualizar el paciente');
    }
  };

  if (!pacienteId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Identificador de paciente no válido.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar paciente</h1>
          <p className="text-gray-600 mt-1">
            Actualiza la información clínica y de contacto del paciente.
          </p>
        </div>
        <Link
          href={`/dashboard/pacientes/${pacienteId}`}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          Volver a la ficha
        </Link>
      </header>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
          Cargando datos del paciente...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : paciente ? (
        <PacienteForm
          onSubmit={handleSubmit}
          defaultValues={paciente}
          profesionales={profesionales}
          loading={false}
          submitLabel="Guardar cambios"
          onCancel={() => router.push(`/dashboard/pacientes/${pacienteId}`)}
          serverError={submitError}
        />
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          No se encontró el paciente solicitado.
        </div>
      )}
    </div>
  );
}
