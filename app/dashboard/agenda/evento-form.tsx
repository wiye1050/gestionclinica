'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgendaForm, AgendaEventFormValues } from '@/components/agenda/useAgendaForm';
import { Profesional, Paciente, CatalogoServicio, SalaClinica, EstadoPaciente } from '@/types';
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
    const toDate = (value?: string | null) => (value ? new Date(value) : new Date());
    const fetchJson = async <T,>(url: string) => {
      const response = await fetch(url);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo cargar la información');
      }
      return payload as T;
    };
    const especialidades: ReadonlyArray<Profesional['especialidad']> = ['medicina', 'fisioterapia', 'enfermeria'];
    const categoriasServicio: ReadonlyArray<CatalogoServicio['categoria']> = ['medicina', 'fisioterapia', 'enfermeria'];
    const riesgosPaciente: ReadonlyArray<Paciente['riesgo']> = ['alto', 'medio', 'bajo'];
    const estadosPaciente: ReadonlyArray<EstadoPaciente> = ['activo', 'inactivo', 'egresado'];
    const tiposSala: ReadonlyArray<SalaClinica['tipo']> = ['consulta', 'quirurgica', 'rehabilitacion', 'diagnostico', 'general'];
    const estadosSala: ReadonlyArray<SalaClinica['estado']> = ['activa', 'mantenimiento', 'inactiva'];

    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [profData, pacData, servData, salasData] = await Promise.all([
          fetchJson<Array<Record<string, unknown>>>('/api/profesionales?limit=200'),
          fetchJson<Array<Record<string, unknown>>>('/api/pacientes?limit=200'),
          fetchJson<Array<Record<string, unknown>>>('/api/catalogo-servicios?limit=200'),
          fetchJson<Array<Record<string, unknown>>>('/api/salas?limit=200'),
        ]);

        setProfesionales(
          profData.map((item) => {
            const especialidad = especialidades.includes(item.especialidad as Profesional['especialidad'])
              ? (item.especialidad as Profesional['especialidad'])
              : 'medicina';
            return {
              id: String(item.id),
              nombre: (item.nombre as string) ?? 'Sin nombre',
              apellidos: (item.apellidos as string) ?? '',
              especialidad,
              email: (item.email as string) ?? '',
              telefono: typeof item.telefono === 'string' ? item.telefono : undefined,
              activo: Boolean(item.activo ?? true),
              horasSemanales: Number(item.horasSemanales ?? 0),
              diasTrabajo: Array.isArray(item.diasTrabajo) ? (item.diasTrabajo as string[]) : [],
              horaInicio: (item.horaInicio as string) ?? '09:00',
              horaFin: (item.horaFin as string) ?? '17:00',
              serviciosAsignados: Number(item.serviciosAsignados ?? 0),
              cargaTrabajo: Number(item.cargaTrabajo ?? 0),
              createdAt: toDate(item.createdAt as string | null | undefined),
              updatedAt: toDate(item.updatedAt as string | null | undefined),
            };
          })
        );

        setPacientes(
          pacData.map((item) => {
            const riesgo = riesgosPaciente.includes(item.riesgo as Paciente['riesgo'])
              ? (item.riesgo as Paciente['riesgo'])
              : 'medio';
            const estadoPaciente = estadosPaciente.includes(item.estado as EstadoPaciente)
              ? (item.estado as EstadoPaciente)
              : 'activo';
            return {
              id: String(item.id),
              nombre: (item.nombre as string) ?? 'Sin nombre',
              apellidos: (item.apellidos as string) ?? '',
              fechaNacimiento: toDate(item.fechaNacimiento as string | null | undefined),
              genero: (item.genero as string) ?? 'no-especificado',
              documentoId: typeof item.documentoId === 'string' ? item.documentoId : undefined,
              tipoDocumento: typeof item.tipoDocumento === 'string' ? item.tipoDocumento : undefined,
              telefono: typeof item.telefono === 'string' ? item.telefono : undefined,
              email: typeof item.email === 'string' ? item.email : undefined,
              direccion: typeof item.direccion === 'string' ? item.direccion : undefined,
              ciudad: typeof item.ciudad === 'string' ? item.ciudad : undefined,
              codigoPostal: typeof item.codigoPostal === 'string' ? item.codigoPostal : undefined,
              aseguradora: typeof item.aseguradora === 'string' ? item.aseguradora : undefined,
              numeroPoliza: typeof item.numeroPoliza === 'string' ? item.numeroPoliza : undefined,
              alergias: Array.isArray(item.alergias) ? (item.alergias as string[]) : [],
              alertasClinicas: Array.isArray(item.alertasClinicas) ? (item.alertasClinicas as string[]) : [],
              diagnosticosPrincipales: Array.isArray(item.diagnosticosPrincipales)
                ? (item.diagnosticosPrincipales as string[])
                : [],
              riesgo,
              consentimientos: [],
              estado: estadoPaciente,
              profesionalReferenteId: typeof item.profesionalReferenteId === 'string' ? item.profesionalReferenteId : undefined,
              grupoPacienteId: typeof item.grupoPacienteId === 'string' ? item.grupoPacienteId : undefined,
              notasInternas: typeof item.notasInternas === 'string' ? item.notasInternas : undefined,
              createdAt: toDate(item.createdAt as string | null | undefined),
              updatedAt: toDate(item.updatedAt as string | null | undefined),
              creadoPor: (item.creadoPor as string) ?? 'desconocido',
            };
          }) as Paciente[]
        );

        setServicios(
          servData.map((item) => {
            const categoria = categoriasServicio.includes(item.categoria as CatalogoServicio['categoria'])
              ? (item.categoria as CatalogoServicio['categoria'])
              : 'medicina';
            return {
              id: String(item.id),
              nombre: (item.nombre as string) ?? 'Servicio sin nombre',
              categoria,
              descripcion: typeof item.descripcion === 'string' ? item.descripcion : undefined,
              tiempoEstimado: Number(item.tiempoEstimado ?? 60),
              requiereSala: Boolean(item.requiereSala ?? false),
              salaPredeterminada: typeof item.salaPredeterminada === 'string' ? item.salaPredeterminada : undefined,
              requiereSupervision: Boolean(item.requiereSupervision ?? false),
              requiereApoyo: Boolean(item.requiereApoyo ?? false),
              profesionalesHabilitados: Array.isArray(item.profesionalesHabilitados)
                ? (item.profesionalesHabilitados as string[])
                : [],
              activo: Boolean(item.activo ?? true),
              createdAt: toDate(item.createdAt as string | null | undefined),
              updatedAt: toDate(item.updatedAt as string | null | undefined),
            };
          }) as CatalogoServicio[]
        );

        setSalas(
          salasData.map((item) => {
            const tipo = tiposSala.includes(item.tipo as SalaClinica['tipo'])
              ? (item.tipo as SalaClinica['tipo'])
              : 'general';
            const estadoSala = estadosSala.includes(item.estado as SalaClinica['estado'])
              ? (item.estado as SalaClinica['estado'])
              : 'activa';
            return {
              id: String(item.id),
              nombre: (item.nombre as string) ?? 'Sala',
              tipo,
              capacidad: Number(item.capacidad ?? 1),
              equipamiento: Array.isArray(item.equipamiento) ? (item.equipamiento as string[]) : [],
              estado: estadoSala,
              colorAgenda: typeof item.colorAgenda === 'string' ? item.colorAgenda : undefined,
              notas: typeof item.notas === 'string' ? item.notas : undefined,
              createdAt: toDate(item.createdAt as string | null | undefined),
              updatedAt: toDate(item.updatedAt as string | null | undefined),
              modificadoPor: typeof item.modificadoPor === 'string' ? item.modificadoPor : undefined,
            };
          }) as SalaClinica[]
        );
      } catch (err) {
        console.error('Error cargando datos de agenda:', err);
        const mensaje = err instanceof Error ? err.message : 'No se pudieron cargar los datos necesarios';
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
