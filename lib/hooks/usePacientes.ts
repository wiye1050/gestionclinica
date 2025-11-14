import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Paciente } from '@/types';

type ApiPaciente = Omit<Paciente, 'fechaNacimiento' | 'createdAt' | 'updatedAt'> & {
  fechaNacimiento?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type FetchFilters = {
  estado?: string;
  busqueda?: string;
  cursor?: string | null;
};

type PacientesResult = {
  items: Paciente[];
  nextCursor: string | null;
  limit: number;
};

const deserializePaciente = (raw: ApiPaciente): Paciente => ({
  ...raw,
  fechaNacimiento: raw.fechaNacimiento ? new Date(raw.fechaNacimiento) : new Date('1970-01-01'),
  createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
});

async function fetchPacientes(filters?: FetchFilters): Promise<PacientesResult> {
  const params = new URLSearchParams();
  if (filters?.estado) params.set('estado', filters.estado);
  if (filters?.busqueda) params.set('q', filters.busqueda);
  if (filters?.cursor) params.set('cursor', filters.cursor);

  const queryString = params.toString();
  const response = await fetch(queryString ? `/api/pacientes?${queryString}` : '/api/pacientes');
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'No se pudieron cargar los pacientes');
  }

  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
    ? payload.items
    : [];

  const items = (rawItems as ApiPaciente[]).map(deserializePaciente);

  const nextCursor =
    typeof payload === 'object' && payload !== null && typeof payload.nextCursor === 'string'
      ? payload.nextCursor
      : null;
  const limit =
    typeof payload === 'object' && payload !== null && typeof payload.limit === 'number'
      ? payload.limit
      : items.length;

  return { items, nextCursor, limit };
}

export function usePacientes(
  filters?: { estado?: string; busqueda?: string },
  options?: { initialData?: Paciente[] }
) {
  return useQuery({
    queryKey: ['pacientes', filters],
    queryFn: async () => {
      const result = await fetchPacientes(filters);
      return result.items;
    },
    staleTime: 3 * 60 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

export function useInfinitePacientes(filters?: { estado?: string; busqueda?: string }) {
  return useInfiniteQuery<PacientesResult>({
    queryKey: ['pacientes-infinite', filters],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchPacientes({ ...filters, cursor: (pageParam as string | undefined) ?? undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// Hook para crear paciente con invalidación automática
export function useCreatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoPaciente: Omit<Paciente, 'id'>) => {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPaciente),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo crear el paciente');
      }
      return payload.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes-infinite'] });
    },
  });
}

// Hook para actualizar paciente
export function useUpdatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Paciente> }) => {
      const response = await fetch(`/api/pacientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el paciente');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes-infinite'] });
    },
  });
}

// Hook para eliminar paciente
export function useDeletePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo eliminar el paciente');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes-infinite'] });
    },
  });
}
