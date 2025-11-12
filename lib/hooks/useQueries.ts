'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfWeek, addDays } from 'date-fns';
import type {
  ServicioAsignado,
  Profesional,
  GrupoPaciente,
  CatalogoServicio,
  Mejora,
  Protocolo,
  Sala
} from '@/types';
import type { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
export { usePacientes } from '@/lib/hooks/usePacientes';

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
type InventarioItem = {
  id: string;
  nombre: string;
  categoria?: string;
  stock: number;
  stockMinimo: number;
  proveedor?: string;
  precio?: number;
  alertaStockBajo: boolean;
};

export function useInventario(options?: { initialData?: { productos: InventarioItem[]; stockBajo: number; total: number } }) {
  return useQuery<{ productos: InventarioItem[]; stockBajo: number; total: number }>({
    queryKey: ['inventario'],
    queryFn: async () => {
      const response = await fetch('/api/inventario');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo cargar el inventario');
      }
      return payload as { productos: InventarioItem[]; stockBajo: number; total: number };
    },
    staleTime: 5 * 60 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

// Hook para mejoras con ordenamiento por RICE
export function useMejoras(filtros?: { estado?: string; area?: string }) {
  return useQuery<Mejora[]>({
    queryKey: ['mejoras', filtros],
    queryFn: async () => {
      const q = query(collection(db, 'mejoras'), orderBy('updatedAt', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      let mejoras = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() ?? {};
        return {
          id: docSnap.id,
          titulo: data.titulo ?? 'Sin título',
          descripcion: data.descripcion ?? '',
          area: (data.area ?? 'otro') as Mejora['area'],
          estado: (data.estado ?? 'idea') as Mejora['estado'],
          responsableUid: data.responsableUid,
          responsableNombre: data.responsableNombre,
          rice: {
            reach: Number(data.rice?.reach ?? 0),
            impact: Number(data.rice?.impact ?? 0),
            confidence: Number(data.rice?.confidence ?? 0),
            effort: Number(data.rice?.effort ?? 1),
            score: Number(data.rice?.score ?? 0)
          },
          evidenciasCount: data.evidenciasCount ?? 0,
          creadoPor: data.creadoPor ?? 'desconocido',
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date()
        } satisfies Mejora;
      });

      // Filtros en cliente
      if (filtros?.estado) {
        mejoras = mejoras.filter((m) => m.estado === filtros.estado);
      }
      if (filtros?.area) {
        mejoras = mejoras.filter((m) => m.area === filtros.area);
      }

      // Ordenar por RICE score descendente
      mejoras.sort((a, b) => (b.rice?.score || 0) - (a.rice?.score || 0));

      return mejoras;
    },
    staleTime: 3 * 60 * 1000,
  });
}

// Hook para protocolos
export function useProtocolos() {
  return useQuery<Protocolo[]>({
    queryKey: ['protocolos'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'protocolos'), orderBy('titulo'), limit(100))
      );

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() ?? {};
        return {
          id: docSnap.id,
          titulo: data.titulo ?? 'Sin título',
          area: (data.area ?? 'medicina') as Protocolo['area'],
          estado: (data.estado ?? 'borrador') as Protocolo['estado'],
          descripcion: data.descripcion,
          ultimaVersionId: data.ultimaVersionId,
          requiereQuiz: Boolean(data.requiereQuiz),
          visiblePara: Array.isArray(data.visiblePara) ? data.visiblePara : ['admin'],
          checklistBasica: data.checklistBasica ?? [],
          creadoPor: data.creadoPor ?? 'desconocido',
          creadoPorNombre: data.creadoPorNombre,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          modificadoPor: data.modificadoPor
        } satisfies Protocolo;
      });
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - protocolos casi no cambian
  });
}

// Hook para servicios asignados
export function useServicios(options?: { initialData?: ServicioAsignado[] }) {
  return useQuery<ServicioAsignado[]>({
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
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

// Hook para profesionales
export function useProfesionales(options?: { initialData?: Profesional[] }) {
  return useQuery<Profesional[]>({
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
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

// Hook para grupos de pacientes
export function useGruposPacientes(options?: { initialData?: GrupoPaciente[] }) {
  return useQuery<GrupoPaciente[]>({
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
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

// Hook para catálogo de servicios
export function useCatalogoServicios(options?: { initialData?: CatalogoServicio[] }) {
  return useQuery<CatalogoServicio[]>({
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
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
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
export function useEventosAgenda(
  weekStart: Date,
  options?: {
    initialData?: AgendaEvent[];
  }
) {
  const weekEnd = addDays(weekStart, 7);

  return useQuery<AgendaEvent[]>({
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

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() ?? {};
        const fechaInicio = data.fechaInicio?.toDate?.() ?? new Date();
        const fechaFin = data.fechaFin?.toDate?.() ?? new Date();

        return {
          id: docSnap.id,
          titulo: data.titulo ?? 'Sin título',
          fechaInicio,
          fechaFin,
          estado: data.estado ?? 'programada',
          tipo: data.tipo ?? 'consulta',
          pacienteId: data.pacienteId,
          pacienteNombre: data.pacienteNombre,
          profesionalId: data.profesionalId,
          profesionalNombre: data.profesionalNombre,
          salaId: data.salaId,
          salaNombre: data.salaNombre,
          prioridad: data.prioridad ?? 'media',
          notas: data.notas ?? '',
          color: data.color,
        } satisfies AgendaEvent;
      });
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
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
  return useQuery<Sala[]>({
    queryKey: ['salas'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'salas'), orderBy('nombre'), limit(50))
      );

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() ?? {};
        return {
          id: docSnap.id,
          nombre: data.nombre ?? 'Sin nombre',
          tipo: data.tipo ?? 'general',
          capacidad: data.capacidad ?? 0,
          equipamiento: Array.isArray(data.equipamiento) ? data.equipamiento : [],
          activa: data.activa ?? true,
          ocupacionActual: data.ocupacionActual ?? 0,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date()
        } as Sala;
      });
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - salas muy estáticas
  });
}
