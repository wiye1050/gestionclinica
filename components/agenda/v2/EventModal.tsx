'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { AgendaEvent } from './agendaHelpers';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';
import { captureError } from '@/lib/utils/errorLogging';

// Zod schema para el formulario
const eventFormSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200, 'Título muy largo'),
  tipo: z.enum(['consulta', 'seguimiento', 'revision', 'tratamiento', 'urgencia', 'administrativo']),
  fechaInicio: z.string().min(1, 'La fecha es requerida'),
  horaInicio: z.string().min(1, 'La hora es requerida'),
  duracion: z.number().int().min(5, 'Duración mínima 5 minutos').max(480, 'Duración máxima 8 horas'),
  profesionalId: z.string().optional(),
  salaId: z.string().optional(),
  pacienteId: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta']),
  notas: z.string().max(1000, 'Notas muy largas').optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<AgendaEvent>) => Promise<void>;
  event?: AgendaEvent | null;
  initialDate?: Date;
  profesionales: Array<{ id: string; nombre: string; apellidos: string }>;
  salas: Array<{ id: string; nombre: string }>;
  pacientes?: Array<{ id: string; nombre: string; apellidos: string }>;
  prefillPacienteId?: string;
  prefillProfesionalId?: string;
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  event,
  initialDate,
  profesionales,
  salas,
  pacientes = [],
  prefillPacienteId,
  prefillProfesionalId,
}: EventModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      titulo: '',
      tipo: 'consulta',
      fechaInicio: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
      horaInicio: initialDate ? format(initialDate, 'HH:mm') : '',
      duracion: 30,
      profesionalId: '',
      salaId: '',
      pacienteId: '',
      prioridad: 'media',
      notas: '',
    },
  });

  // Resetear formulario cuando se abre/cierra o cambia el evento
  useEffect(() => {
    if (event) {
      // Modo edición
      reset({
        titulo: event.titulo,
        tipo: event.tipo,
        fechaInicio: format(event.fechaInicio, 'yyyy-MM-dd'),
        horaInicio: format(event.fechaInicio, 'HH:mm'),
        duracion: Math.round((event.fechaFin.getTime() - event.fechaInicio.getTime()) / 60000),
        profesionalId: event.profesionalId || '',
        salaId: event.salaId || '',
        pacienteId: event.pacienteId || '',
        prioridad: event.prioridad || 'media',
        notas: event.notas || '',
      });
    } else if (initialDate) {
      // Modo creación con fecha inicial
      reset({
        titulo: '',
        tipo: 'consulta',
        fechaInicio: format(initialDate, 'yyyy-MM-dd'),
        horaInicio: format(initialDate, 'HH:mm'),
        duracion: 30,
        profesionalId: prefillProfesionalId || '',
        salaId: '',
        pacienteId: prefillPacienteId || '',
        prioridad: 'media',
        notas: '',
      });
    }
  }, [event, initialDate, reset, prefillPacienteId, prefillProfesionalId]);

  // Aplicar prefills cuando se abre el modal
  useEffect(() => {
    if (!isOpen || Boolean(event)) return;
    if (prefillPacienteId) setValue('pacienteId', prefillPacienteId);
    if (prefillProfesionalId) setValue('profesionalId', prefillProfesionalId);
  }, [isOpen, event, prefillPacienteId, prefillProfesionalId, setValue]);

  const onSubmit = async (formData: EventFormData) => {
    try {
      const fechaInicio = new Date(`${formData.fechaInicio}T${formData.horaInicio}`);
      const fechaFin = new Date(fechaInicio.getTime() + formData.duracion * 60000);

      const profesional = profesionales.find(p => p.id === formData.profesionalId);
      const sala = salas.find(s => s.id === formData.salaId);
      const paciente = pacientes.find(p => p.id === formData.pacienteId);

      // Construir objeto solo con campos que tienen valor (Firebase no acepta undefined)
      const eventData: Partial<AgendaEvent> = {
        titulo: sanitizeInput(formData.titulo),
        tipo: formData.tipo,
        fechaInicio,
        fechaFin,
        prioridad: formData.prioridad,
        notas: formData.notas ? sanitizeHTML(formData.notas) : '',
        estado: event?.estado || 'programada',
      };

      // Solo agregar campos opcionales si tienen valor
      if (formData.profesionalId) {
        const profesionalId = sanitizeInput(formData.profesionalId);
        eventData.profesionalId = profesionalId;
        if (profesional) {
          eventData.profesionalNombre = `${profesional.nombre} ${profesional.apellidos}`;
        }
      }

      if (formData.salaId) {
        eventData.salaId = sanitizeInput(formData.salaId);
        if (sala) {
          eventData.salaNombre = sala.nombre;
        }
      }

      if (formData.pacienteId) {
        eventData.pacienteId = sanitizeInput(formData.pacienteId);
        if (paciente) {
          eventData.pacienteNombre = `${paciente.nombre} ${paciente.apellidos}`;
        }
      }

      await onSave(eventData);
      onClose();
    } catch (error) {
      captureError(error, { module: 'event-modal', action: 'save-event', metadata: { isEdit: !!event } });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="panel-block shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 border-b border-border bg-card">
          <h2 className="text-xl font-semibold text-text">
            {event ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-cardHover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Título de la cita *
            </label>
            <input
              type="text"
              {...register('titulo')}
              className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
              placeholder="Ej: Consulta inicial"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-500">{errors.titulo.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Tipo de cita *
            </label>
            <select
              {...register('tipo')}
              className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
            >
              <option value="consulta">Consulta</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="revision">Revisión</option>
              <option value="tratamiento">Tratamiento</option>
              <option value="urgencia">Urgencia</option>
              <option value="administrativo">Administrativo</option>
            </select>
            {errors.tipo && (
              <p className="mt-1 text-sm text-red-500">{errors.tipo.message}</p>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha *
              </label>
              <input
                type="date"
                {...register('fechaInicio')}
                className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
              />
              {errors.fechaInicio && (
                <p className="mt-1 text-sm text-red-500">{errors.fechaInicio.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora *
              </label>
              <input
                type="time"
                {...register('horaInicio')}
                className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
              />
              {errors.horaInicio && (
                <p className="mt-1 text-sm text-red-500">{errors.horaInicio.message}</p>
              )}
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Duración (minutos) *
            </label>
            <select
              {...register('duracion', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1 hora 30 min</option>
              <option value={120}>2 horas</option>
            </select>
            {errors.duracion && (
              <p className="mt-1 text-sm text-red-500">{errors.duracion.message}</p>
            )}
          </div>

          {/* Profesional y Sala */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Profesional
              </label>
              <select
                {...register('profesionalId')}
                className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
              >
                <option value="">Sin asignar</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} {prof.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Sala
              </label>
              <select
                {...register('salaId')}
                className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
              >
                <option value="">Sin asignar</option>
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paciente */}
          {pacientes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Paciente
              </label>
              <select
                {...register('pacienteId')}
                className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
              >
                <option value="">Sin asignar</option>
                {pacientes.map((pac) => (
                  <option key={pac.id} value={pac.id}>
                    {pac.nombre} {pac.apellidos}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Prioridad
            </label>
            <select
              {...register('prioridad')}
              className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
            {errors.prioridad && (
              <p className="mt-1 text-sm text-red-500">{errors.prioridad.message}</p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Notas
            </label>
            <textarea
              {...register('notas')}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus-visible:focus-ring bg-card text-text"
              placeholder="Información adicional..."
            />
            {errors.notas && (
              <p className="mt-1 text-sm text-red-500">{errors.notas.message}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-pill border border-border px-4 py-2 text-sm font-medium text-text hover:bg-cardHover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : (event ? 'Actualizar' : 'Crear Cita')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
