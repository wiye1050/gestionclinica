'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export const agendaEventSchema = z.object({
  titulo: z.string().min(3, 'El título es obligatorio'),
  tipo: z.enum(['clinico', 'coordinacion', 'reunion']),
  pacienteId: z.string().optional(),
  pacienteNombre: z.string().optional(),
  profesionalId: z.string().min(1, 'Selecciona un profesional'),
  salaId: z.string().optional(),
  servicioId: z.string().optional(),
  fecha: z.string().min(1, 'Selecciona una fecha'),
  horaInicio: z.string().min(1, 'Selecciona una hora de inicio'),
  horaFin: z.string().min(1, 'Selecciona una hora de fin'),
  estado: z.enum(['programada', 'confirmada', 'realizada', 'cancelada']),
  prioridad: z.enum(['alta', 'media', 'baja']),
  notas: z.string().optional(),
  requiereSeguimiento: z.boolean().optional()
});

export type AgendaEventFormValues = z.infer<typeof agendaEventSchema>;

export function useAgendaForm(defaultValues?: Partial<AgendaEventFormValues>) {
  return useForm<AgendaEventFormValues>({
    resolver: zodResolver(agendaEventSchema),
    defaultValues: {
      titulo: defaultValues?.titulo ?? '',
      tipo: defaultValues?.tipo ?? 'clinico',
      pacienteId: defaultValues?.pacienteId ?? '',
      pacienteNombre: defaultValues?.pacienteNombre ?? '',
      profesionalId: defaultValues?.profesionalId ?? '',
      salaId: defaultValues?.salaId ?? '',
      servicioId: defaultValues?.servicioId ?? '',
      fecha: defaultValues?.fecha ?? new Date().toISOString().split('T')[0],
      horaInicio: defaultValues?.horaInicio ?? '09:00',
      horaFin: defaultValues?.horaFin ?? '10:00',
      estado: defaultValues?.estado ?? 'programada',
      prioridad: defaultValues?.prioridad ?? 'media',
      notas: defaultValues?.notas ?? '',
      requiereSeguimiento: defaultValues?.requiereSeguimiento ?? false
    }
  });
}
