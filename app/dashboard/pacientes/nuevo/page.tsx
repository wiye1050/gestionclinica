'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Profesional } from '@/types';
import { PacienteForm, PacienteFormValues } from '@/components/pacientes/PacienteForm';
import { toast } from 'sonner';

export default function NuevoPacientePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loadingProfesionales, setLoadingProfesionales] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarProfesionales = async () => {
      setLoadingProfesionales(true);
      try {
        const profesionalesSnap = await getDocs(
          query(collection(db, 'profesionales'), orderBy('apellidos'), limit(200))
        );

        const profesionalesData: Profesional[] = profesionalesSnap.docs.map((docSnap) => {
          const data = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            nombre: data.nombre ?? 'Sin nombre',
            apellidos: data.apellidos ?? '',
            especialidad: data.especialidad ?? 'medicina',
            email: data.email ?? '',
            telefono: data.telefono,
            activo: data.activo ?? true,
            horasSemanales: data.horasSemanales ?? 0,
            diasTrabajo: Array.isArray(data.diasTrabajo) ? data.diasTrabajo : [],
            horaInicio: data.horaInicio ?? '09:00',
            horaFin: data.horaFin ?? '17:00',
            serviciosAsignados: data.serviciosAsignados ?? 0,
            cargaTrabajo: data.cargaTrabajo ?? 0,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date()
          };
        });

        setProfesionales(profesionalesData);
      } catch (err) {
        console.error('Error al cargar profesionales:', err);
      } finally {
        setLoadingProfesionales(false);
      }
    };

    cargarProfesionales();
  }, []);

  const manejarSubmit = async (values: PacienteFormValues) => {
    if (!user) {
      setError('Debes iniciar sesión para crear pacientes.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const ahora = new Date();
      const alergias = values.alergias
        ? values.alergias.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
      const alertasClinicas = values.alertasClinicas
        ? values.alertasClinicas.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
      const diagnosticosPrincipales = values.diagnosticosPrincipales
        ? values.diagnosticosPrincipales.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      const docRef = await addDoc(collection(db, 'pacientes'), {
        nombre: values.nombre,
        apellidos: values.apellidos,
        fechaNacimiento: values.fechaNacimiento ? new Date(values.fechaNacimiento) : null,
        genero: values.genero,
        documentoId: values.documentoId || null,
        tipoDocumento: values.tipoDocumento || null,
        telefono: values.telefono || null,
        email: values.email || null,
        direccion: values.direccion || null,
        ciudad: values.ciudad || null,
        codigoPostal: values.codigoPostal || null,
        aseguradora: values.aseguradora || null,
        numeroPoliza: values.numeroPoliza || null,
        alergias,
        alertasClinicas,
        diagnosticosPrincipales,
        riesgo: values.riesgo,
        estado: values.estado,
        profesionalReferenteId: values.profesionalReferenteId || null,
        notasInternas: values.notasInternas || null,
        contactoEmergencia: values.contactoEmergenciaNombre
          ? {
              nombre: values.contactoEmergenciaNombre,
              parentesco: values.contactoEmergenciaParentesco ?? '',
              telefono: values.contactoEmergenciaTelefono ?? ''
            }
          : null,
        consentimientos: [],
        createdAt: ahora,
        updatedAt: ahora,
        creadoPor: user.email ?? user.uid
      });

      await addDoc(collection(db, 'pacientes-historial'), {
        pacienteId: docRef.id,
        eventoAgendaId: null,
        servicioId: null,
        servicioNombre: null,
        profesionalId: values.profesionalReferenteId || null,
        profesionalNombre: profesionales.find((p) => p.id === values.profesionalReferenteId)
          ? `${profesionales.find((p) => p.id === values.profesionalReferenteId)!.nombre} ${
              profesionales.find((p) => p.id === values.profesionalReferenteId)!.apellidos
            }`
          : null,
        fecha: ahora,
        tipo: 'seguimiento',
        descripcion: 'Ficha de paciente creada en el sistema.',
        resultado: null,
        planesSeguimiento: null,
        adjuntos: [],
        createdAt: ahora,
        creadoPor: user.email ?? user.uid
      });

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
