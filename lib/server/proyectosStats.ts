import { adminDb } from '@/lib/firebaseAdmin';
import { startOfWeek, endOfWeek, subWeeks, isAfter, isBefore, differenceInDays } from 'date-fns';
import { cached } from '@/lib/server/cache';
import { getProyectoById } from './proyectos';
import type { Proyecto, ProyectoHito, ProyectoTarea } from '@/types/proyectos';

export interface ProyectoEstadisticas {
  proyectoId: string;
  proyectoNombre: string;

  // Estado general
  estado: Proyecto['estado'];
  prioridad: Proyecto['prioridad'];
  saludProyecto: 'excelente' | 'bueno' | 'en-riesgo' | 'critico';

  // Progreso
  progresoActual: number;
  progresoEsperado: number;
  desviacionProgreso: number; // negativo = atrasado, positivo = adelantado

  // Tareas
  totalTareas: number;
  tareasPendientes: number;
  tareasEnCurso: number;
  tareasBloqueadas: number;
  tareasCompletadas: number;
  tasaCompletitud: number; // Porcentaje

  // Velocity (tareas completadas por semana)
  velocityActual: number; // Última semana
  velocityPromedio: number; // Promedio histórico
  tareasCompletadasUltimaSemana: number;

  // Hitos
  totalHitos: number;
  hitosCompletados: number;
  hitosAtrasados: number;
  proximoHito?: {
    nombre: string;
    fechaObjetivo: string;
    diasRestantes: number;
  };

  // Recursos
  horasEstimadas: number;
  horasReales: number;
  horasRestantes: number;
  eficienciaHoras: number; // horasReales / horasEstimadas * 100
  presupuestoTotal: number;
  presupuestoGastado: number;
  presupuestoRestante: number;
  eficienciaPresupuesto: number; // presupuestoGastado / presupuestoTotal * 100

  // Equipo
  miembrosEquipo: number;
  tareasAsignadas: number;
  tareasSinAsignar: number;

  // Fechas
  fechaInicio?: string;
  fechaFinEstimada?: string;
  diasTranscurridos: number;
  diasRestantes: number;
  duracionTotal: number;
  porcentajeTiempoTranscurrido: number;

  // Alertas y riesgos
  alertas: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
  }>;

  // Tendencias (últimas 4 semanas)
  tendenciasTareas: Array<{
    semana: string;
    completadas: number;
    agregadas: number;
  }>;
}

/**
 * Calcula el estado de salud del proyecto basado en múltiples factores
 */
function calcularSaludProyecto(stats: Partial<ProyectoEstadisticas>): ProyectoEstadisticas['saludProyecto'] {
  const problemas: string[] = [];

  // Factor 1: Desviación de progreso
  if (stats.desviacionProgreso && stats.desviacionProgreso < -20) {
    problemas.push('progreso-atrasado');
  }

  // Factor 2: Tareas bloqueadas
  if (stats.tareasBloqueadas && stats.totalTareas && stats.tareasBloqueadas / stats.totalTareas > 0.15) {
    problemas.push('tareas-bloqueadas');
  }

  // Factor 3: Eficiencia de horas
  if (stats.eficienciaHoras && stats.eficienciaHoras > 120) {
    problemas.push('sobrecosto-horas');
  }

  // Factor 4: Eficiencia de presupuesto
  if (stats.eficienciaPresupuesto && stats.eficienciaPresupuesto > 110) {
    problemas.push('sobrecosto-presupuesto');
  }

  // Factor 5: Hitos atrasados
  if (stats.hitosAtrasados && stats.totalHitos && stats.hitosAtrasados / stats.totalHitos > 0.3) {
    problemas.push('hitos-atrasados');
  }

  // Factor 6: Velocity decreciente
  if (stats.velocityActual !== undefined && stats.velocityPromedio !== undefined) {
    if (stats.velocityActual < stats.velocityPromedio * 0.5) {
      problemas.push('velocity-baja');
    }
  }

  if (problemas.length === 0) return 'excelente';
  if (problemas.length === 1) return 'bueno';
  if (problemas.length === 2) return 'en-riesgo';
  return 'critico';
}

/**
 * Genera alertas basadas en el estado del proyecto
 */
function generarAlertas(proyecto: Proyecto, stats: Partial<ProyectoEstadisticas>): ProyectoEstadisticas['alertas'] {
  const alertas: ProyectoEstadisticas['alertas'] = [];

  // Alerta: Progreso muy atrasado
  if (stats.desviacionProgreso && stats.desviacionProgreso < -20) {
    alertas.push({
      tipo: 'error',
      mensaje: `El proyecto está ${Math.abs(Math.round(stats.desviacionProgreso))}% por debajo del progreso esperado`,
    });
  }

  // Alerta: Muchas tareas bloqueadas
  if (stats.tareasBloqueadas && stats.tareasBloqueadas > 0) {
    alertas.push({
      tipo: 'warning',
      mensaje: `Hay ${stats.tareasBloqueadas} tareas bloqueadas que requieren atención`,
    });
  }

  // Alerta: Presupuesto casi agotado
  if (stats.eficienciaPresupuesto && stats.eficienciaPresupuesto > 90 && stats.porcentajeTiempoTranscurrido && stats.porcentajeTiempoTranscurrido < 90) {
    alertas.push({
      tipo: 'error',
      mensaje: 'El presupuesto está casi agotado pero el proyecto no ha terminado',
    });
  }

  // Alerta: Hitos atrasados
  if (stats.hitosAtrasados && stats.hitosAtrasados > 0) {
    alertas.push({
      tipo: 'warning',
      mensaje: `${stats.hitosAtrasados} hito(s) están atrasados`,
    });
  }

  // Alerta: Sin tareas en curso
  if (proyecto.estado === 'en-curso' && stats.tareasEnCurso === 0) {
    alertas.push({
      tipo: 'info',
      mensaje: 'No hay tareas actualmente en curso',
    });
  }

  // Alerta: Próximo hito cercano
  if (stats.proximoHito && stats.proximoHito.diasRestantes <= 7 && stats.proximoHito.diasRestantes >= 0) {
    alertas.push({
      tipo: 'info',
      mensaje: `El hito "${stats.proximoHito.nombre}" vence en ${stats.proximoHito.diasRestantes} días`,
    });
  }

  return alertas;
}

/**
 * Calcula estadísticas detalladas de un proyecto
 */
export async function calcularEstadisticasProyecto(
  proyectoId: string
): Promise<ProyectoEstadisticas | null> {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado');
  }

  // Obtener proyecto
  const proyectoData = await getProyectoById(proyectoId);
  if (!proyectoData) {
    return null;
  }

  // Deserializar fechas
  const proyecto: Proyecto = {
    ...proyectoData,
    fechaInicio: proyectoData.fechaInicio ? new Date(proyectoData.fechaInicio) : undefined,
    fechaFinEstimada: proyectoData.fechaFinEstimada ? new Date(proyectoData.fechaFinEstimada) : undefined,
    fechaFinReal: proyectoData.fechaFinReal ? new Date(proyectoData.fechaFinReal) : undefined,
    createdAt: new Date(proyectoData.createdAt),
    updatedAt: new Date(proyectoData.updatedAt),
    archivedAt: proyectoData.archivedAt ? new Date(proyectoData.archivedAt) : undefined,
    hitos: proyectoData.hitos.map((h) => ({
      ...h,
      fechaObjetivo: new Date(h.fechaObjetivo),
      fechaCompletado: h.fechaCompletado ? new Date(h.fechaCompletado) : undefined,
    })),
    actualizaciones: proyectoData.actualizaciones.map((a) => ({
      ...a,
      fecha: new Date(a.fecha),
    })),
    tareas: proyectoData.tareas.map((t) => ({
      ...t,
      fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : undefined,
      completadaEn: t.completadaEn ? new Date(t.completadaEn) : undefined,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    })),
  };

  const ahora = new Date();

  // === TAREAS ===
  const totalTareas = proyecto.tareas.length;
  const tareasPendientes = proyecto.tareas.filter((t) => t.estado === 'pendiente').length;
  const tareasEnCurso = proyecto.tareas.filter((t) => t.estado === 'en-curso').length;
  const tareasBloqueadas = proyecto.tareas.filter((t) => t.estado === 'bloqueada').length;
  const tareasCompletadas = proyecto.tareas.filter((t) => t.estado === 'completada').length;
  const tasaCompletitud = totalTareas > 0 ? (tareasCompletadas / totalTareas) * 100 : 0;

  // Tareas asignadas y sin asignar
  const tareasAsignadas = proyecto.tareas.filter((t) => t.asignadoA).length;
  const tareasSinAsignar = totalTareas - tareasAsignadas;

  // === VELOCITY ===
  const inicioSemanaActual = startOfWeek(ahora);
  const finSemanaActual = endOfWeek(ahora);

  const tareasCompletadasUltimaSemana = proyecto.tareas.filter(
    (t) =>
      t.estado === 'completada' &&
      t.completadaEn &&
      t.completadaEn >= inicioSemanaActual &&
      t.completadaEn <= finSemanaActual
  ).length;

  // Velocity promedio (últimas 4 semanas)
  const tareasCompletadasUltimas4Semanas = proyecto.tareas.filter((t) => {
    if (!t.completadaEn) return false;
    const hace4Semanas = subWeeks(ahora, 4);
    return t.completadaEn >= hace4Semanas;
  }).length;

  const velocityActual = tareasCompletadasUltimaSemana;
  const velocityPromedio = tareasCompletadasUltimas4Semanas / 4;

  // Tendencias por semana (últimas 4 semanas)
  const tendenciasTareas: ProyectoEstadisticas['tendenciasTareas'] = [];
  for (let i = 3; i >= 0; i--) {
    const inicioSemana = startOfWeek(subWeeks(ahora, i));
    const finSemana = endOfWeek(subWeeks(ahora, i));

    const completadas = proyecto.tareas.filter(
      (t) => t.estado === 'completada' && t.completadaEn && t.completadaEn >= inicioSemana && t.completadaEn <= finSemana
    ).length;

    const agregadas = proyecto.tareas.filter(
      (t) => t.createdAt >= inicioSemana && t.createdAt <= finSemana
    ).length;

    tendenciasTareas.push({
      semana: `S${4 - i}`,
      completadas,
      agregadas,
    });
  }

  // === HITOS ===
  const totalHitos = proyecto.hitos.length;
  const hitosCompletados = proyecto.hitos.filter((h) => h.completado).length;
  const hitosAtrasados = proyecto.hitos.filter(
    (h) => !h.completado && isBefore(h.fechaObjetivo, ahora)
  ).length;

  // Próximo hito
  const hitosProximos = proyecto.hitos
    .filter((h) => !h.completado && isAfter(h.fechaObjetivo, ahora))
    .sort((a, b) => a.fechaObjetivo.getTime() - b.fechaObjetivo.getTime());

  const proximoHito = hitosProximos[0]
    ? {
        nombre: hitosProximos[0].nombre,
        fechaObjetivo: hitosProximos[0].fechaObjetivo.toISOString(),
        diasRestantes: differenceInDays(hitosProximos[0].fechaObjetivo, ahora),
      }
    : undefined;

  // === RECURSOS ===
  const horasEstimadas = proyecto.horasEstimadas || 0;
  const horasReales = proyecto.horasReales || 0;
  const horasRestantes = Math.max(0, horasEstimadas - horasReales);
  const eficienciaHoras = horasEstimadas > 0 ? (horasReales / horasEstimadas) * 100 : 0;

  const presupuestoTotal = proyecto.presupuesto || 0;
  const presupuestoGastado = proyecto.presupuestoGastado || 0;
  const presupuestoRestante = Math.max(0, presupuestoTotal - presupuestoGastado);
  const eficienciaPresupuesto = presupuestoTotal > 0 ? (presupuestoGastado / presupuestoTotal) * 100 : 0;

  // === FECHAS Y PROGRESO ===
  const fechaInicio = proyecto.fechaInicio;
  const fechaFinEstimada = proyecto.fechaFinEstimada;

  let diasTranscurridos = 0;
  let diasRestantes = 0;
  let duracionTotal = 0;
  let porcentajeTiempoTranscurrido = 0;
  let progresoEsperado = 0;

  if (fechaInicio && fechaFinEstimada) {
    duracionTotal = differenceInDays(fechaFinEstimada, fechaInicio);
    diasTranscurridos = differenceInDays(ahora, fechaInicio);
    diasRestantes = differenceInDays(fechaFinEstimada, ahora);

    porcentajeTiempoTranscurrido = duracionTotal > 0 ? (diasTranscurridos / duracionTotal) * 100 : 0;
    progresoEsperado = Math.min(100, porcentajeTiempoTranscurrido);
  }

  const progresoActual = proyecto.progreso || 0;
  const desviacionProgreso = progresoActual - progresoEsperado;

  // === EQUIPO ===
  const miembrosEquipo = proyecto.equipo?.length || 0;

  // === CONSTRUIR ESTADÍSTICAS ===
  const stats: Partial<ProyectoEstadisticas> = {
    proyectoId,
    proyectoNombre: proyecto.nombre,
    estado: proyecto.estado,
    prioridad: proyecto.prioridad,
    progresoActual,
    progresoEsperado: Math.round(progresoEsperado * 10) / 10,
    desviacionProgreso: Math.round(desviacionProgreso * 10) / 10,
    totalTareas,
    tareasPendientes,
    tareasEnCurso,
    tareasBloqueadas,
    tareasCompletadas,
    tasaCompletitud: Math.round(tasaCompletitud * 10) / 10,
    velocityActual,
    velocityPromedio: Math.round(velocityPromedio * 10) / 10,
    tareasCompletadasUltimaSemana,
    totalHitos,
    hitosCompletados,
    hitosAtrasados,
    proximoHito,
    horasEstimadas,
    horasReales,
    horasRestantes,
    eficienciaHoras: Math.round(eficienciaHoras * 10) / 10,
    presupuestoTotal,
    presupuestoGastado,
    presupuestoRestante,
    eficienciaPresupuesto: Math.round(eficienciaPresupuesto * 10) / 10,
    miembrosEquipo,
    tareasAsignadas,
    tareasSinAsignar,
    fechaInicio: fechaInicio?.toISOString(),
    fechaFinEstimada: fechaFinEstimada?.toISOString(),
    diasTranscurridos: Math.max(0, diasTranscurridos),
    diasRestantes: Math.max(0, diasRestantes),
    duracionTotal: Math.max(0, duracionTotal),
    porcentajeTiempoTranscurrido: Math.min(100, Math.max(0, Math.round(porcentajeTiempoTranscurrido * 10) / 10)),
    tendenciasTareas,
  };

  // Calcular salud del proyecto
  const saludProyecto = calcularSaludProyecto(stats);

  // Generar alertas
  const alertas = generarAlertas(proyecto, stats);

  return {
    ...stats,
    saludProyecto,
    alertas,
  } as ProyectoEstadisticas;
}

/**
 * Obtiene estadísticas con caché
 */
export async function getEstadisticasProyecto(
  proyectoId: string
): Promise<ProyectoEstadisticas | null> {
  return cached(
    ['proyecto-stats', proyectoId],
    async () => {
      return calcularEstadisticasProyecto(proyectoId);
    },
    { revalidate: 300, tags: ['proyecto-stats', `proyecto-${proyectoId}`] } // 5 minutos
  );
}
