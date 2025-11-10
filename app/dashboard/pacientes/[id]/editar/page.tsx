'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Paciente, Profesional } from '@/types';
import { PacienteForm, PacienteFormValues } from '@/components/pacientes/PacienteForm';
import { toast } from 'sonner';

export default function EditarPacientePage() {
  const params = useParams();
  const pacienteId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pacienteId) return;

    const obtenerDatos = async () => {
      setLoading(true);
      setError(null);
      try {
        const pacienteRef = doc(db, 'pacientes', pacienteId);
        const pacienteSnap = await getDoc(pacienteRef);

        if (!pacienteSnap.exists()) {
          setError('El paciente no existe.');
          setLoading(false);
          return;
        }

        const data = pacienteSnap.data() ?? {};
        type ConsentimientoRaw = {
          tipo?: string;
          fecha?: { toDate?: () => Date };
          documentoId?: string;
          firmadoPor?: string;
        };

        const consentimientos = Array.isArray(data.consentimientos)
          ? (data.consentimientos as ConsentimientoRaw[]).map((item) => ({
              tipo: item?.tipo ?? 'general',
              fecha: item?.fecha?.toDate?.() ?? new Date(),
              documentoId: item?.documentoId,
              firmadoPor: item?.firmadoPor
            }))
          : [];

        const pacienteData: Paciente = {
          id: pacienteSnap.id,
          nombre: data.nombre ?? 'Sin nombre',
          apellidos: data.apellidos ?? '',
          fechaNacimiento: data.fechaNacimiento?.toDate?.() ?? new Date('1970-01-01'),
          genero: data.genero ?? 'no-especificado',
          documentoId: data.documentoId,
          tipoDocumento: data.tipoDocumento,
          telefono: data.telefono,
          email: data.email,
          direccion: data.direccion,
          ciudad: data.ciudad,
          codigoPostal: data.codigoPostal,
          aseguradora: data.aseguradora,
          numeroPoliza: data.numeroPoliza,
          alergias: Array.isArray(data.alergias) ? data.alergias : [],
          alertasClinicas: Array.isArray(data.alertasClinicas) ? data.alertasClinicas : [],
          diagnosticosPrincipales: Array.isArray(data.diagnosticosPrincipales)
            ? data.diagnosticosPrincipales
            : [],
          riesgo: data.riesgo ?? 'medio',
          contactoEmergencia: data.contactoEmergencia
            ? {
                nombre: data.contactoEmergencia.nombre ?? '',
                parentesco: data.contactoEmergencia.parentesco ?? '',
                telefono: data.contactoEmergencia.telefono ?? ''
              }
            : undefined,
          consentimientos,
          estado: data.estado ?? 'activo',
          profesionalReferenteId: data.profesionalReferenteId,
          grupoPacienteId: data.grupoPacienteId,
          notasInternas: data.notasInternas,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          creadoPor: data.creadoPor ?? 'desconocido',
          modificadoPor: data.modificadoPor
        };

        setPaciente(pacienteData);

        const profesionalesSnap = await getDocs(
          query(collection(db, 'profesionales'), orderBy('apellidos'), limit(200))
        );
        const profesionalesData: Profesional[] = profesionalesSnap.docs.map((docSnap) => {
          const info = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            nombre: info.nombre ?? 'Sin nombre',
            apellidos: info.apellidos ?? '',
            especialidad: info.especialidad ?? 'medicina',
            email: info.email ?? '',
            telefono: info.telefono,
            activo: info.activo ?? true,
            horasSemanales: info.horasSemanales ?? 0,
            diasTrabajo: Array.isArray(info.diasTrabajo) ? info.diasTrabajo : [],
            horaInicio: info.horaInicio ?? '09:00',
            horaFin: info.horaFin ?? '17:00',
            serviciosAsignados: info.serviciosAsignados ?? 0,
            cargaTrabajo: info.cargaTrabajo ?? 0,
            createdAt: info.createdAt?.toDate?.() ?? new Date(),
            updatedAt: info.updatedAt?.toDate?.() ?? new Date()
          };
        });
        setProfesionales(profesionalesData);
      } catch (err) {
        console.error('Error cargando paciente:', err);
        const mensaje = err instanceof Error ? err.message : 'No se pudo cargar el paciente.';
        setError(mensaje);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, [pacienteId]);

  const handleSubmit = async (values: PacienteFormValues) => {
    if (!user || !pacienteId) {
      toast.error('No tienes permisos para editar este paciente.');
      return;
    }

    setError(null);
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
      console.error('Error al actualizar paciente:', err);
      const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el paciente.';
      setError(mensaje);
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
          serverError={error}
        />
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          No se encontró el paciente solicitado.
        </div>
      )}
    </div>
  );
}
