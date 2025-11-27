import type { Paciente } from '@/types';

export type ApiPaciente = Omit<Paciente, 'fechaNacimiento' | 'createdAt' | 'updatedAt'> & {
  fechaNacimiento?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const deserializePaciente = (raw: ApiPaciente): Paciente => ({
  ...raw,
  fechaNacimiento: raw.fechaNacimiento ? new Date(raw.fechaNacimiento) : new Date('1970-01-01'),
  createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
});
