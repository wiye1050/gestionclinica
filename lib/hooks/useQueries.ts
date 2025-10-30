import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfWeek, addDays } from 'date-fns';
import type { Paciente, ServicioAsignado, Profesional, GrupoPaciente, CatalogoServicio } from '@/types';

// Hook para KPIs con caché agresivo (datos que no cambian tanto)
export function useKPIs() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const semanaInicio = startOfWeek(new Date(), { weekStartsOn: 1 });
      const semanaFin = addDays(semanaInicio, 7);

      // Todas las queries en paralelo
      const [
        serviciosActivos,
        profesionalesActivos,
        reportesPendientes,
        eventosSemanales,
      ] = await Promise.all([
        getDocs(query(collection(db, 'servicios-asignados'), where('estado', '==', 'activo'))),
        getDocs(query(collection(db, 'profesionales'), where('activo', '==', true))),
        getDocs(query(collection(db, 'reportes-diarios'), where('estado', 'in', ['pendiente', 'en-proceso']))),
        getDocs(
          query(
            collection(db, 'agenda-eventos'),
            where('fechaInicio', '>=', Timestamp.fromDate(semanaInicio)),
            where('fechaInicio', '<', Timestamp.fromDate(semanaFin))
          )
        ),
      ]);

      return {
        serviciosActivos: serviciosActivos.size,
        profesionalesActivos: profesionalesActivos.size,
        reportesPendientes: reportesPendientes.size,
        eventosSemana: eventosSemanales.size,
        timestamp: new Date(),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - KPIs pueden ser un poco desactualizados
    gcTime: 5 * 60 * 1000, // Mantener en caché 5 minutos
  });
}

// Hook para inventario con alertas de stock
export function useInventario() {
  return useQuery({
    queryKey: ['inventario'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'inventario-productos'), orderBy('nombre'), limit(200))
      );

      const productos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      }));

      const stockBajo = productos.filter((p: any) => p.alertaStockBajo === true).length;

      return {
        productos,
        stockBajo,
        total: productos.length,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para mejoras con ordenamiento por RICE
export function useMejoras(filtros?: { estado?: string; area?: string }) {
  return useQuery({
    queryKey: ['mejoras', filtros],
    queryFn: async () => {
      let q = query(collection(db, 'mejoras'), orderBy('updatedAt', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      let mejoras = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      }));

      // Filtros en cliente
      if (filtros?.estado) {
        mejoras = mejoras.filter((m: any) => m.estado === filtros.estado);
      }
      if (filtros?.area) {
        mejoras = mejoras.filter((m: any) => m.area === filtros.area);
      }

      // Ordenar por RICE score descendente
      mejoras.sort((a: any, b: any) => (b.rice?.score || 0) - (a.rice?.score || 0));

      return mejoras;
    },
    staleTime: 3 * 60 * 1000,
  });
}

// Hook para protocolos
export function useProtocolos() {
  return useQuery({
    queryKey: ['protocolos'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'protocolos'), orderBy('titulo'), limit(100))
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - protocolos casi no cambian
  });
}

// Hook para servicios asignados
export function useServicios() {
  return useQuery({
    queryKey: ['servicios-asignados'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'servicios-asignados'), orderBy('createdAt', 'desc'), limit(300))
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
        fechaProgramada: doc.data().fechaProgramada?.toDate?.(),
      })) as ServicioAsignado[];
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para profesionales
export function useProfesionales() {
  return useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'profesionales'), orderBy('apellidos'), limit(100))
      );

      const profesionales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      })) as Profesional[];

      return profesionales.filter(p => p.activo);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - profesionales no cambian frecuentemente
  });
}

// Hook para grupos de pacientes
export function useGruposPacientes() {
  return useQuery({
    queryKey: ['grupos-pacientes'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'grupos-pacientes'), orderBy('nombre'), limit(100))
      );

      const grupos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      })) as GrupoPaciente[];

      return grupos.filter(g => g.activo);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook para catálogo de servicios
export function useCatalogoServicios() {
  return useQuery({
    queryKey: ['catalogo-servicios'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'catalogo-servicios'), orderBy('nombre'), limit(200))
      );

      const servicios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      })) as CatalogoServicio[];

      return servicios.filter(s => s.activo);
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - catálogo es bastante estático
  });
}

// Hook para reportes diarios
export function useReportes() {
  return useQuery({
    queryKey: ['reportes-diarios'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'reportes-diarios'), orderBy('createdAt', 'desc'), limit(200))
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate?.(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - reportes diarios cambian frecuentemente
  });
}

// Hook para eventos de agenda
export function useEventosAgenda(weekStart: Date) {
  const weekEnd = addDays(weekStart, 7);
  
  return useQuery({
    queryKey: ['agenda-eventos', weekStart.toISOString()],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(
          collection(db, 'agenda-eventos'),
          where('fechaInicio', '>=', Timestamp.fromDate(weekStart)),
          where('fechaInicio', '<', Timestamp.fromDate(weekEnd)),
          orderBy('fechaInicio', 'asc'),
          limit(500)
        )
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaInicio: doc.data().fechaInicio?.toDate?.() ?? new Date(),
        fechaFin: doc.data().fechaFin?.toDate?.() ?? new Date(),
      }));
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para bloques de agenda
export function useBloquesAgenda() {
  return useQuery({
    queryKey: ['agenda-bloques'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'agenda-bloques'), orderBy('diaSemana'), limit(200))
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - bloques son muy estáticos
  });
}

// Hook para salas
export function useSalas() {
  return useQuery({
    queryKey: ['salas'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'salas'), orderBy('nombre'), limit(50))
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - salas muy estáticas
  });
}

// Hook para pacientes
export function usePacientes() {
  return useQuery({
    queryKey: ['pacientes'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'pacientes'), orderBy('apellidos'), limit(500))
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
      })) as Paciente[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
