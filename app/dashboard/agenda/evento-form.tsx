'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAgendaForm, AgendaEventFormValues } from '@/components/agenda/useAgendaForm';
import { Profesional, Paciente, CatalogoServicio, SalaClinica } from '@/types';
import { Button } from '@/components/ui/Button';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { sanitizeHTML, sanitizeInput, sanitizeObject } from '@/lib/utils/sanitize';

interface AgendaEventFormProps {
  onSuccess?: () => void;
}

const TEXT_FIELDS: Array<keyof AgendaEventFormValues> = [
  'titulo',
  'pacienteId',
  'pacienteNombre',
  'profesionalId',
  'salaId',
  'servicioId',
];

function sanitizeAgendaValues(values: AgendaEventFormValues): AgendaEventFormValues {
  let sanitized = sanitizeObject(values, TEXT_FIELDS, sanitizeInput);
  sanitized = sanitizeObject(sanitized, ['notas'], sanitizeHTML);
  return sanitized;
}

export function AgendaEventForm({ onSuccess }: AgendaEventFormProps) {
  const router = useRouter();
  const form = useAgendaForm();
  const { register, handleSubmit, watch, setValue, formState } = form;
  const { errors, isSubmitting } = formState;

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [salas, setSalas] = useState<SalaClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pacienteSeleccionado = watch('pacienteId');

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [profSnap, pacSnap, servSnap, salasSnap] = await Promise.all([
          getDocs(query(collection(db, 'profesionales'), orderBy('apellidos'), limit(200))),
          getDocs(query(collection(db, 'pacientes'), orderBy('apellidos'), limit(200))),
          getDocs(query(collection(db, 'catalogo-servicios'), orderBy('nombre'), limit(200))),
          getDocs(query(collection(db, 'salas'), orderBy('nombre'), limit(200)))
        ]);

        setProfesionales(
          profSnap.docs.map((docSnap) => {
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
          })
        );

        setPacientes(
          pacSnap.docs.map((docSnap) => {
            const data = docSnap.data() ?? {};
            return {
              id: docSnap.id,
              numeroHistoria: data.numeroHistoria ?? '',
              nombre: data.nombre ?? 'Sin nombre',
              apellidos: data.apellidos ?? '',
              fechaNacimiento: data.fechaNacimiento?.toDate?.() ?? new Date('1970-01-01'),
              genero: data.genero ?? 'no-especificado',
              telefono: data.telefono,
              email: data.email,
              estado: data.estado ?? 'activo',
              alergias: Array.isArray(data.alergias) ? data.alergias : [],
              alertasClinicas: Array.isArray(data.alertasClinicas) ? data.alertasClinicas : [],
              diagnosticosPrincipales: Array.isArray(data.diagnosticosPrincipales)
                ? data.diagnosticosPrincipales
                : [],
              riesgo: data.riesgo ?? 'medio',
              consentimientos: [],
              createdAt: data.createdAt?.toDate?.() ?? new Date(),
              updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
              creadoPor: data.creadoPor ?? 'desconocido',
              modificadoPor: data.modificadoPor
            } as Paciente;
          })
        );

        setServicios(
          servSnap.docs.map((docSnap) => {
            const data = docSnap.data() ?? {};
            return {
              id: docSnap.id,
              nombre: data.nombre ?? 'Servicio sin nombre',
              categoria: data.categoria ?? 'medicina',
              descripcion: data.descripcion,
              tiempoEstimado: data.tiempoEstimado ?? 60,
              requiereSala: data.requiereSala ?? false,
              salaPredeterminada: data.salaPredeterminada,
              requiereSupervision: data.requiereSupervision ?? false,
              requiereApoyo: data.requiereApoyo ?? false,
              profesionalesHabilitados: Array.isArray(data.profesionalesHabilitados)
                ? data.profesionalesHabilitados
                : [],
              activo: data.activo ?? true,
              createdAt: data.createdAt?.toDate?.() ?? new Date(),
              updatedAt: data.updatedAt?.toDate?.() ?? new Date()
            } as CatalogoServicio;
          })
        );

        setSalas(
          salasSnap.docs.map((docSnap) => {
            const data = docSnap.data() ?? {};
            return {
              id: docSnap.id,
              nombre: data.nombre ?? 'Sala',
              tipo: data.tipo ?? 'general',
              capacidad: data.capacidad ?? 1,
              equipamiento: Array.isArray(data.equipamiento) ? data.equipamiento : [],
              estado: data.estado ?? 'activa',
              colorAgenda: data.colorAgenda,
              notas: data.notas,
              createdAt: data.createdAt?.toDate?.() ?? new Date(),
              updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
              modificadoPor: data.modificadoPor
            } as SalaClinica;
          })
        );
      } catch (err) {
        console.error('Error cargando datos de agenda:', err);
        const mensaje =
          err instanceof Error ? err.message : 'No se pudieron cargar los datos necesarios';
        setError(mensaje);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    if (pacienteSeleccionado && pacienteSeleccionado.length > 0) {
      const paciente = pacientes.find((p) => p.id === pacienteSeleccionado);
      if (paciente) {
        setValue('pacienteNombre', `${paciente.nombre} ${paciente.apellidos}`);
      }
    }
  }, [pacienteSeleccionado, pacientes, setValue]);

  const pacienteOptions = useMemo(() => {
    return pacientes.map((pac) => ({
      value: pac.id,
      label: `${pac.nombre} ${pac.apellidos}`
    }));
  }, [pacientes]);

  const onSubmit: SubmitHandler<AgendaEventFormValues> = async (values) => {
    const sanitizedValues = sanitizeAgendaValues(values);
    setError(null);
    try {
      const fecha = new Date(sanitizedValues.fecha);
      const [inicioHoras, inicioMinutos] = sanitizedValues.horaInicio.split(':').map(Number);
      const [finHoras, finMinutos] = sanitizedValues.horaFin.split(':').map(Number);

      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(inicioHoras, inicioMinutos, 0, 0);

      const fechaFin = new Date(fecha);
      fechaFin.setHours(finHoras, finMinutos, 0, 0);

      if (fechaFin <= fechaInicio) {
        setError('La hora de fin debe ser posterior a la hora de inicio.');
        return;
      }

      const tipoMap: Record<string, string> = {
        clinico: 'consulta',
        coordinacion: 'seguimiento',
        reunion: 'administrativo',
      };

      const response = await fetch('/api/agenda/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: sanitizedValues.titulo,
          tipo: tipoMap[sanitizedValues.tipo] ?? sanitizedValues.tipo,
          pacienteId: sanitizedValues.pacienteId || null,
          profesionalId: sanitizedValues.profesionalId,
          salaId: sanitizedValues.salaId || null,
          servicioId: sanitizedValues.servicioId || null,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          estado: sanitizedValues.estado,
          prioridad: sanitizedValues.prioridad,
          notas: sanitizedValues.notas || '',
          requiereSeguimiento: sanitizedValues.requiereSeguimiento ?? false,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo programar el evento');
      }

      toast.success('Evento programado correctamente');
      onSuccess?.();
      router.push('/dashboard/agenda');
    } catch (err) {
      console.error('Error al crear evento de agenda:', err);
      const mensaje =
        err instanceof Error ? err.message : 'Error desconocido al guardar el evento.';
      setError(mensaje);
      toast.error('No se pudo programar el evento');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Datos del evento</h2>
          <p className="text-sm text-gray-500">
            Define el tipo de cita y relaciona a los profesionales, pacientes y recursos implicados.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Título *</label>
            <input
              type="text"
              {...register('titulo')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Tipo *</label>
            <select
              {...register('tipo')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="clinico">Clínico</option>
              <option value="coordinacion">Coordinación</option>
              <option value="reunion">Reunión</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Paciente</label>
            <select
              {...register('pacienteId')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Sin paciente asociado</option>
              {pacienteOptions.map((pac) => (
                <option key={pac.value} value={pac.value}>
                  {pac.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Profesional *</label>
            <select
              {...register('profesionalId')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Selecciona un profesional</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.apellidos} ({prof.especialidad})
                </option>
              ))}
            </select>
            {errors.profesionalId && (
              <p className="mt-1 text-sm text-red-600">{errors.profesionalId.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Servicio</label>
            <select
              {...register('servicioId')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Sin servicio asociado</option>
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Sala</label>
            <select
              {...register('salaId')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Sin sala asignada</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.nombre} ({sala.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Programación</h2>
          <p className="text-sm text-gray-500">
            Define la fecha y la duración del evento. Los horarios se usan para detectar solapes.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Fecha *</label>
            <input
              type="date"
              {...register('fecha')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {errors.fecha && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Hora inicio *</label>
            <input
              type="time"
              {...register('horaInicio')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {errors.horaInicio && (
              <p className="mt-1 text-sm text-red-600">{errors.horaInicio.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Hora fin *</label>
            <input
              type="time"
              {...register('horaFin')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {errors.horaFin && (
              <p className="mt-1 text-sm text-red-600">{errors.horaFin.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Seguimiento y notas</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <select
              {...register('estado')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="programada">Programada</option>
              <option value="confirmada">Confirmada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Prioridad</label>
            <select
              {...register('prioridad')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <label className="mt-6 flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" {...register('requiereSeguimiento')} />
            <span>Requiere seguimiento posterior</span>
          </label>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">Notas</label>
          <textarea
            {...register('notas')}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/agenda')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || loading}>
          {isSubmitting ? 'Guardando...' : 'Programar evento'}
        </Button>
      </div>
    </form>
  );
}
