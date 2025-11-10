import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paciente } from '@/types';

// Hook para obtener todos los pacientes con caché
export function usePacientes(
  filters?: { estado?: string; busqueda?: string },
  options?: { initialData?: Paciente[] }
) {
  return useQuery({
    queryKey: ['pacientes', filters],
    queryFn: async () => {
      let q = query(collection(db, 'pacientes'), orderBy('apellidos'), limit(200));

      if (filters?.estado) {
        q = query(q, where('estado', '==', filters.estado));
      }

      const snapshot = await getDocs(q);
      let pacientes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaNacimiento: doc.data().fechaNacimiento?.toDate?.() ?? new Date(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      })) as Paciente[];

      // Filtro de búsqueda en cliente (más eficiente que múltiples queries)
      if (filters?.busqueda) {
        const busqueda = filters.busqueda.toLowerCase();
        pacientes = pacientes.filter(p => 
          `${p.nombre} ${p.apellidos}`.toLowerCase().includes(busqueda) ||
          p.documentoId?.toLowerCase().includes(busqueda)
        );
      }

      return pacientes;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos - los pacientes no cambian tan rápido
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
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
      // Invalidar y refetch automático
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
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
    },
  });
}
