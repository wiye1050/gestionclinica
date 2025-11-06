import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paciente } from '@/types';

// Hook para obtener todos los pacientes con caché
export function usePacientes(filters?: { estado?: string; busqueda?: string }) {
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
  });
}

// Hook para crear paciente con invalidación automática
export function useCreatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoPaciente: Omit<Paciente, 'id'>) => {
      const docRef = await addDoc(collection(db, 'pacientes'), {
        ...nuevoPaciente,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
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
      await updateDoc(doc(db, 'pacientes', id), {
        ...data,
        updatedAt: new Date(),
      });
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
      await deleteDoc(doc(db, 'pacientes', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });
}
