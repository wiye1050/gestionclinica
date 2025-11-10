import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Proyecto, EstadisticasProyectos, ProyectoHito, ProyectoActualizacion, ProyectoTarea } from '@/types/proyectos';

const toDate = (value: unknown): Date | undefined => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  return value as Date | undefined;
};

// Convertir timestamps de Firestore a Date
const convertirTimestamps = (data: Record<string, unknown> | undefined): Partial<Proyecto> | undefined => {
  if (!data) return data as undefined;

  const resultado: Partial<Proyecto> = { ...data } as Partial<Proyecto>;

  resultado.fechaInicio = toDate(resultado.fechaInicio) ?? resultado.fechaInicio;
  resultado.fechaFinEstimada = toDate(resultado.fechaFinEstimada) ?? resultado.fechaFinEstimada;
  resultado.fechaFinReal = toDate(resultado.fechaFinReal) ?? resultado.fechaFinReal;
  resultado.createdAt = toDate(resultado.createdAt) ?? resultado.createdAt;
  resultado.updatedAt = toDate(resultado.updatedAt) ?? resultado.updatedAt;
  resultado.archivedAt = toDate(resultado.archivedAt) ?? resultado.archivedAt;

  if (Array.isArray(resultado.hitos)) {
    resultado.hitos = (resultado.hitos as ProyectoHito[]).map((hito) => ({
      ...hito,
      fechaObjetivo: toDate(hito.fechaObjetivo) ?? hito.fechaObjetivo,
      fechaCompletado: toDate(hito.fechaCompletado) ?? hito.fechaCompletado,
    }));
  }

  if (Array.isArray(resultado.actualizaciones)) {
    resultado.actualizaciones = (resultado.actualizaciones as ProyectoActualizacion[]).map((act) => ({
      ...act,
      fecha: toDate(act.fecha) ?? act.fecha,
    }));
  }

  if (Array.isArray(resultado.tareas)) {
    resultado.tareas = (resultado.tareas as ProyectoTarea[]).map((tarea) => ({
      ...tarea,
      fechaLimite: toDate(tarea.fechaLimite) ?? tarea.fechaLimite,
      completadaEn: toDate(tarea.completadaEn) ?? tarea.completadaEn,
      createdAt: toDate(tarea.createdAt) ?? tarea.createdAt,
      updatedAt: toDate(tarea.updatedAt) ?? tarea.updatedAt,
    }));
  }

  return resultado;
};

// Hook principal
export function useProyectos(options?: { initialData?: Proyecto[] }) {
  const queryClient = useQueryClient();

  // Obtener todos los proyectos
  const { data: proyectos = [], isLoading, error } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'proyectos'));
      return snapshot.docs.map(doc => {
        const data = convertirTimestamps(doc.data());
        return {
          id: doc.id,
          ...data,
        } as Proyecto;
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });

  // Calcular estadísticas
  const estadisticas: EstadisticasProyectos = {
    totalProyectos: proyectos.length,
    porEstado: {
      propuesta: proyectos.filter(p => p.estado === 'propuesta').length,
      planificacion: proyectos.filter(p => p.estado === 'planificacion').length,
      'en-curso': proyectos.filter(p => p.estado === 'en-curso').length,
      pausado: proyectos.filter(p => p.estado === 'pausado').length,
      completado: proyectos.filter(p => p.estado === 'completado').length,
      cancelado: proyectos.filter(p => p.estado === 'cancelado').length,
    },
    porTipo: {
      desarrollo: proyectos.filter(p => p.tipo === 'desarrollo').length,
      operacional: proyectos.filter(p => p.tipo === 'operacional').length,
      investigacion: proyectos.filter(p => p.tipo === 'investigacion').length,
      marketing: proyectos.filter(p => p.tipo === 'marketing').length,
      mejora: proyectos.filter(p => p.tipo === 'mejora').length,
      infraestructura: proyectos.filter(p => p.tipo === 'infraestructura').length,
    },
    porPrioridad: {
      critica: proyectos.filter(p => p.prioridad === 'critica').length,
      alta: proyectos.filter(p => p.prioridad === 'alta').length,
      media: proyectos.filter(p => p.prioridad === 'media').length,
      baja: proyectos.filter(p => p.prioridad === 'baja').length,
    },
    progresoPromedio: proyectos.length > 0
      ? Math.round(proyectos.reduce((acc, p) => acc + p.progreso, 0) / proyectos.length)
      : 0,
    proyectosAtrasados: proyectos.filter(p => {
      if (!p.fechaFinEstimada || p.estado === 'completado') return false;
      return new Date() > p.fechaFinEstimada && p.progreso < 100;
    }).length,
    proyectosEnRiesgo: proyectos.filter(p => 
      p.estado === 'en-curso' && (p.prioridad === 'critica' || p.prioridad === 'alta')
    ).length,
    tareasCompletadasSemana: proyectos.reduce((acc, p) => {
      const tareasSemana = p.tareas?.filter(t => {
        if (!t.completadaEn) return false;
        const hace7dias = new Date();
        hace7dias.setDate(hace7dias.getDate() - 7);
        return t.completadaEn > hace7dias;
      }).length || 0;
      return acc + tareasSemana;
    }, 0),
    horasTotales: proyectos.reduce((acc, p) => acc + (p.horasEstimadas || 0), 0),
    presupuestoTotal: proyectos.reduce((acc, p) => acc + (p.presupuesto || 0), 0),
  };

  // Crear proyecto
  const crearProyecto = useMutation({
    mutationFn: async (proyecto: Omit<Proyecto, 'id'>) => {
      const response = await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proyecto),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo crear el proyecto');
      }
      return payload.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    },
  });

  // Actualizar proyecto
  const actualizarProyecto = useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<Proyecto> }) => {
      const response = await fetch(`/api/proyectos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el proyecto');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    },
  });

  // Eliminar proyecto
  const eliminarProyecto = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo eliminar el proyecto');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    },
  });

  return {
    proyectos,
    estadisticas,
    isLoading,
    error,
    crearProyecto,
    actualizarProyecto,
    eliminarProyecto,
  };
}
