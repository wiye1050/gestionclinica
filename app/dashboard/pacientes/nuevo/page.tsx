'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';
import { PacienteForm, PacienteFormValues } from '@/components/pacientes/PacienteForm';
import { toast } from 'sonner';

export default function NuevoPacientePage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionalesManager();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarSubmit = async (values: PacienteFormValues) => {
    if (!user) {
      setError('Debes iniciar sesión para crear pacientes.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const alergias = values.alergias
        ? values.alergias.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
      const alertasClinicas = values.alertasClinicas
        ? values.alertasClinicas.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
      const diagnosticosPrincipales = values.diagnosticosPrincipales
        ? values.diagnosticosPrincipales.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          alergias,
          alertasClinicas,
          diagnosticosPrincipales,
          fechaNacimiento: values.fechaNacimiento
            ? new Date(values.fechaNacimiento).toISOString()
            : null,
          profesionalReferenteNombre: profesionales.find((p) => p.id === values.profesionalReferenteId)
            ? `${profesionales.find((p) => p.id === values.profesionalReferenteId)!.nombre} ${
                profesionales.find((p) => p.id === values.profesionalReferenteId)!.apellidos
              }`
            : null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo registrar el paciente');
      }

      toast.success('Paciente registrado correctamente');
      router.push('/dashboard/pacientes');
    } catch (err) {
      console.error('Error al crear paciente:', err);
      const mensaje =
        err instanceof Error ? err.message : 'Error desconocido al guardar el paciente.';
      setError(mensaje);
      toast.error('No se pudo registrar el paciente');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Paciente</h1>
          <p className="text-gray-600 mt-1">
            Completa los datos básicos para registrar a un paciente en la clínica.
          </p>
        </div>
        <Link
          href="/dashboard/pacientes"
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          Volver
        </Link>
      </header>

      <PacienteForm
        onSubmit={manejarSubmit}
        profesionales={profesionales}
        loading={submitting || loadingProfesionales}
        submitLabel="Crear paciente"
        onCancel={() => router.push('/dashboard/pacientes')}
        serverError={error}
      />
    </div>
  );
}
