import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Proyecto, EstadisticasProyectos } from '@/types/proyectos';

// Convertir timestamps de Firestore a Date
const convertirTimestamps = (data: any): any => {
  if (!data) return data;
  
  const resultado = { ...data };
  
  // Convertir fechas del proyecto
  if (data.fechaInicio instanceof Timestamp) {
    resultado.fechaInicio = data.fechaInicio.toDate();
  }
  if (data.fechaFinEstimada instanceof Timestamp) {
    resultado.fechaFinEstimada = data.fechaFinEstimada.toDate();
  }
  if (data.fechaFinReal instanceof Timestamp) {
    resultado.fechaFinReal = data.fechaFinReal.toDate();
  }
  if (data.createdAt instanceof Timestamp) {
    resultado.createdAt = data.createdAt.toDate();
  }
  if (data.updatedAt instanceof Timestamp) {
    resultado.updatedAt = data.updatedAt.toDate();
  }
  if (data.archivedAt instanceof Timestamp) {
    resultado.archivedAt = data.archivedAt.toDate();
  }

  // Convertir fechas en hitos
  if (Array.isArray(data.hitos)) {
    resultado.hitos = data.hitos.map((hito: any) => ({
      ...hito,
      fechaObjetivo: hito.fechaObjetivo instanceof Timestamp ? hito.fechaObjetivo.toDate() : hito.fechaObjetivo,
      fechaCompletado: hito.fechaCompletado instanceof Timestamp ? hito.fechaCompletado.toDate() : hito.fechaCompletado,
    }));
  }

  // Convertir fechas en actualizaciones
  if (Array.isArray(data.actualizaciones)) {
    resultado.actualizaciones = data.actualizaciones.map((act: any) => ({
      ...act,
      fecha: act.fecha instanceof Timestamp ? act.fecha.toDate() : act.fecha,
    }));
  }

  // Convertir fechas en tareas
  if (Array.isArray(data.tareas)) {
    resultado.tareas = data.tareas.map((tarea: any) => ({
      ...tarea,
      fechaLimite: tarea.fechaLimite instanceof Timestamp ? tarea.fechaLimite.toDate() : tarea.fechaLimite,
      completadaEn: tarea.completadaEn instanceof Timestamp ? tarea.completadaEn.toDate() : tarea.completadaEn,
      createdAt: tarea.createdAt instanceof Timestamp ? tarea.createdAt.toDate() : tarea.createdAt,
      updatedAt: tarea.updatedAt instanceof Timestamp ? tarea.updatedAt.toDate() : tarea.updatedAt,
    }));
  }

  return resultado;
};

// Hook principal
export function useProyectos() {
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
      const docRef = doc(collection(db, 'proyectos'));
      await setDoc(docRef, {
        ...proyecto,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    },
  });

  // Actualizar proyecto
  const actualizarProyecto = useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<Proyecto> }) => {
      const docRef = doc(db, 'proyectos', id);
      await updateDoc(docRef, {
        ...datos,
        updatedAt: Timestamp.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    },
  });

  // Eliminar proyecto
  const eliminarProyecto = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'proyectos', id));
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
