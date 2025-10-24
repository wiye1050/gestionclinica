'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Paciente, Profesional } from '@/types';

const schema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
  fechaNacimiento: z.string(),
  genero: z.enum(['masculino', 'femenino', 'otro', 'no-especificado']),
  documentoId: z.string().optional(),
  tipoDocumento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  codigoPostal: z.string().optional(),
  aseguradora: z.string().optional(),
  numeroPoliza: z.string().optional(),
  riesgo: z.enum(['alto', 'medio', 'bajo']),
  estado: z.enum(['activo', 'inactivo', 'egresado']),
  profesionalReferenteId: z.string().optional(),
  alergias: z.string().optional(),
  alertasClinicas: z.string().optional(),
  diagnosticosPrincipales: z.string().optional(),
  notasInternas: z.string().optional(),
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaParentesco: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
});

export type PacienteFormValues = z.infer<typeof schema>;

interface PacienteFormProps {
  onSubmit: (values: PacienteFormValues) => Promise<void>;
  defaultValues?: Paciente;
  profesionales: Profesional[];
  loading: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  serverError?: string | null;
}

function formatList(values?: string[]): string {
  return values && values.length > 0 ? values.join(', ') : '';
}

export function PacienteForm({
  onSubmit,
  defaultValues,
  profesionales,
  loading,
  submitLabel = 'Guardar paciente',
  onCancel,
  serverError
}: PacienteFormProps) {
  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues
      ? {
          nombre: defaultValues.nombre,
          apellidos: defaultValues.apellidos,
          fechaNacimiento: defaultValues.fechaNacimiento.toISOString().split('T')[0],
          genero: defaultValues.genero,
          documentoId: defaultValues.documentoId ?? '',
          tipoDocumento: defaultValues.tipoDocumento ?? '',
          telefono: defaultValues.telefono ?? '',
          email: defaultValues.email ?? '',
          direccion: defaultValues.direccion ?? '',
          ciudad: defaultValues.ciudad ?? '',
          codigoPostal: defaultValues.codigoPostal ?? '',
          aseguradora: defaultValues.aseguradora ?? '',
          numeroPoliza: defaultValues.numeroPoliza ?? '',
          riesgo: defaultValues.riesgo ?? 'medio',
          estado: defaultValues.estado ?? 'activo',
          profesionalReferenteId: defaultValues.profesionalReferenteId ?? '',
          alergias: formatList(defaultValues.alergias),
          alertasClinicas: formatList(defaultValues.alertasClinicas),
          diagnosticosPrincipales: formatList(defaultValues.diagnosticosPrincipales),
          notasInternas: defaultValues.notasInternas ?? '',
          contactoEmergenciaNombre: defaultValues.contactoEmergencia?.nombre ?? '',
          contactoEmergenciaParentesco: defaultValues.contactoEmergencia?.parentesco ?? '',
          contactoEmergenciaTelefono: defaultValues.contactoEmergencia?.telefono ?? '',
        }
      : {
          nombre: '',
          apellidos: '',
          fechaNacimiento: new Date().toISOString().split('T')[0],
          genero: 'no-especificado',
          riesgo: 'medio',
          estado: 'activo',
        },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        nombre: defaultValues.nombre,
        apellidos: defaultValues.apellidos,
        fechaNacimiento: defaultValues.fechaNacimiento.toISOString().split('T')[0],
        genero: defaultValues.genero,
        documentoId: defaultValues.documentoId ?? '',
        tipoDocumento: defaultValues.tipoDocumento ?? '',
        telefono: defaultValues.telefono ?? '',
        email: defaultValues.email ?? '',
        direccion: defaultValues.direccion ?? '',
        ciudad: defaultValues.ciudad ?? '',
        codigoPostal: defaultValues.codigoPostal ?? '',
        aseguradora: defaultValues.aseguradora ?? '',
        numeroPoliza: defaultValues.numeroPoliza ?? '',
        riesgo: defaultValues.riesgo ?? 'medio',
        estado: defaultValues.estado ?? 'activo',
        profesionalReferenteId: defaultValues.profesionalReferenteId ?? '',
        alergias: formatList(defaultValues.alergias),
        alertasClinicas: formatList(defaultValues.alertasClinicas),
        diagnosticosPrincipales: formatList(defaultValues.diagnosticosPrincipales),
        notasInternas: defaultValues.notasInternas ?? '',
        contactoEmergenciaNombre: defaultValues.contactoEmergencia?.nombre ?? '',
        contactoEmergenciaParentesco: defaultValues.contactoEmergencia?.parentesco ?? '',
        contactoEmergenciaTelefono: defaultValues.contactoEmergencia?.telefono ?? '',
      });
    }
  }, [defaultValues, reset]);

  const profesionalesActivos = useMemo(
    () => profesionales.filter((prof) => prof.activo),
    [profesionales]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Datos personales</h2>
          <p className="text-sm text-gray-500">Información básica necesaria para la gestión.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              {...register('nombre')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Apellidos *</label>
            <input
              type="text"
              {...register('apellidos')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {errors.apellidos && (
              <p className="mt-1 text-sm text-red-600">{errors.apellidos.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              {...register('fechaNacimiento')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Género</label>
            <select
              {...register('genero')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="no-especificado">No especificado</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Documento</label>
            <input
              type="text"
              {...register('documentoId')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo documento</label>
            <input
              type="text"
              {...register('tipoDocumento')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              {...register('telefono')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              {...register('direccion')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ciudad</label>
            <input
              type="text"
              {...register('ciudad')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Código postal</label>
            <input
              type="text"
              {...register('codigoPostal')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Aseguradora</label>
            <input
              type="text"
              {...register('aseguradora')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de póliza</label>
            <input
              type="text"
              {...register('numeroPoliza')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Salud y seguimiento</h2>
          <p className="text-sm text-gray-500">Alertas clínicas, riesgos y asignación.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Riesgo</label>
            <select
              {...register('riesgo')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              {...register('estado')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="egresado">Egresado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Profesional referente
            </label>
            <Controller
              control={control}
              name="profesionalReferenteId"
              render={({ field }) => (
                <select
                  {...field}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Sin asignar</option>
                  {profesionalesActivos.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nombre} {prof.apellidos} ({prof.especialidad})
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Alergias</label>
            <textarea
              {...register('alergias')}
              rows={2}
              placeholder="Separar con comas"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Alertas clínicas
            </label>
            <textarea
              {...register('alertasClinicas')}
              rows={2}
              placeholder="Separar con comas"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Diagnósticos principales
            </label>
            <textarea
              {...register('diagnosticosPrincipales')}
              rows={2}
              placeholder="Separar con comas"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notas internas</label>
          <textarea
            {...register('notasInternas')}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contacto de emergencia</h2>
          <p className="text-sm text-gray-500">Información para situaciones urgentes.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              {...register('contactoEmergenciaNombre')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Parentesco</label>
            <input
              type="text"
              {...register('contactoEmergenciaParentesco')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              {...register('contactoEmergenciaTelefono')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </section>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
