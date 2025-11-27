import type { Profesional } from '@/types';

export type ApiProfesional = Omit<Profesional, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

const toDate = (value?: string): Date => (value ? new Date(value) : new Date());

export function deserializeProfesionales(items: ApiProfesional[]): Profesional[] {
  return items.map((item) => ({
    ...item,
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }));
}
