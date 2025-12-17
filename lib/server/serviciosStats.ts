/**
 * lib/server/serviciosStats.ts
 * Motor de estadísticas para servicios del catálogo
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/utils/logger';
import type { SerializedCatalogoServicio } from '@/lib/utils/servicios';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInDays,
  differenceInMinutes,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';

export interface CatalogoServicioEstadisticas {
  // Identificación
  catalogoServicioId: string;
  catalogoServicioNombre: string;
  categoria: 'medicina' | 'fisioterapia' | 'enfermeria';

  // Uso general
  totalAsignaciones: number; // Cuántos ServicioAsignado existen con este catalogoServicioId
  asignacionesActivas: number;
  asignacionesPendientes: number;

  // Citas realizadas
  totalCitas: number; // Total citas en agenda con este servicioId
  citasRealizadas: number;
  citasProgramadas: number;
  citasConfirmadas: number;
  citasCanceladas: number;
  tasaCancelacion: number; // porcentaje

  // Pacientes
  pacientesUnicos: number;
  gruposQueLoUsan: number;

  // Profesionales
  totalProfesionalesHabilitados: number;
  profesionalesQueLoOfrecen: Array<{
    profesionalId: string;
    profesionalNombre: string;
    vecesAsignado: number;
    citasRealizadas: number;
  }>;

  // Duración y tiempo
  tiempoEstimado: number; // del catálogo
  duracionPromedioReal?: number; // promedio de duraciones reales de citas realizadas
  desviacionDuracion?: number; // porcentaje de desviación respecto al estimado

  // Ingresos (si hay precio configurado)
  precioBase?: number;
  ingresosEstimados?: number;

  // Distribución temporal
  citasPorMes: Array<{
    mes: string; // formato "2025-01"
    citas: number;
    citasRealizadas: number;
    citasCanceladas: number;
  }>;

  citasUltimas4Semanas: Array<{
    semana: string;
    citas: number;
  }>;

  // Tendencias (mes actual vs mes anterior)
  mesActual: {
    citas: number;
    citasRealizadas: number;
    citasCanceladas: number;
    pacientesUnicos: number;
  };
  mesAnterior: {
    citas: number;
    citasRealizadas: number;
    citasCanceladas: number;
    pacientesUnicos: number;
  };
  tendenciaCitas: number; // porcentaje de cambio

  // Alertas y salud
  alertas: Array<{
    tipo: 'info' | 'warning' | 'error';
    mensaje: string;
  }>;

  // Metadatos
  fechaActualizacion: string;
}

/**
 * Calcula estadísticas completas para un servicio del catálogo
 */
export async function getEstadisticasServicioCatalogo(
  catalogoServicioId: string,
  mesesHistorico: number = 6
): Promise<CatalogoServicioEstadisticas | null> {
  if (!adminDb) {
    logger.warn('[serviciosStats] Firebase Admin no configurado');
    return null;
  }

  try {
    // 1. Obtener el servicio del catálogo
    const catalogoSnap = await adminDb
      .collection('catalogo-servicios')
      .doc(catalogoServicioId)
      .get();

    if (!catalogoSnap.exists) {
      logger.warn(`[serviciosStats] Servicio ${catalogoServicioId} no encontrado`);
      return null;
    }

    const catalogoData = catalogoSnap.data() ?? {};
    const catalogo: SerializedCatalogoServicio = {
      id: catalogoSnap.id,
      nombre: catalogoData.nombre ?? 'Sin nombre',
      categoria: catalogoData.categoria ?? 'medicina',
      color: catalogoData.color ?? '#3B82F6',
      descripcion: catalogoData.descripcion,
      protocolosRequeridos: catalogoData.protocolosRequeridos ?? [],
      tiempoEstimado: catalogoData.tiempoEstimado ?? 45,
      requiereSala: catalogoData.requiereSala ?? false,
      salaPredeterminada: catalogoData.salaPredeterminada,
      requiereSupervision: catalogoData.requiereSupervision ?? false,
      requiereApoyo: catalogoData.requiereApoyo ?? false,
      frecuenciaMensual: catalogoData.frecuenciaMensual,
      cargaMensualEstimada: catalogoData.cargaMensualEstimada,
      profesionalesHabilitados: catalogoData.profesionalesHabilitados ?? [],
      activo: catalogoData.activo !== false,
      createdAt: catalogoData.createdAt?.toDate?.()?.toISOString(),
      updatedAt: catalogoData.updatedAt?.toDate?.()?.toISOString(),
    };

    // 2. Obtener todas las asignaciones de este servicio
    const asignacionesSnap = await adminDb
      .collection('servicios-asignados')
      .where('catalogoServicioId', '==', catalogoServicioId)
      .get();

    const asignaciones = asignacionesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        estado: data.estado ?? 'activo',
        grupoId: data.grupoId,
        profesionalPrincipalId: data.profesionalPrincipalId,
        profesionalPrincipalNombre: data.profesionalPrincipalNombre ?? 'Desconocido',
      };
    });

    // 3. Obtener todas las citas relacionadas con este servicio
    const citasSnap = await adminDb
      .collection('agenda-eventos')
      .where('servicioId', '==', catalogoServicioId)
      .get();

    const citas = citasSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        estado: data.estado ?? 'programada',
        profesionalId: data.profesionalId,
        pacienteId: data.pacienteId,
        grupoPacienteId: data.grupoPacienteId,
        duracion: data.duracion ?? 0,
        fechaInicio: data.fechaInicio?.toDate?.() ?? new Date(),
        fechaFin: data.fechaFin?.toDate?.() ?? new Date(),
      };
    });

    // 4. Calcular estadísticas de asignaciones
    const totalAsignaciones = asignaciones.length;
    const asignacionesActivas = asignaciones.filter((a) => a.estado === 'activo').length;
    const asignacionesPendientes = asignaciones.filter((a) => a.estado === 'pendiente').length;

    // 5. Calcular estadísticas de citas
    const totalCitas = citas.length;
    const citasRealizadas = citas.filter((c) => c.estado === 'realizada').length;
    const citasProgramadas = citas.filter((c) => c.estado === 'programada').length;
    const citasConfirmadas = citas.filter((c) => c.estado === 'confirmada').length;
    const citasCanceladas = citas.filter((c) => c.estado === 'cancelada').length;
    const tasaCancelacion = totalCitas > 0 ? (citasCanceladas / totalCitas) * 100 : 0;

    // 6. Pacientes únicos
    const pacientesSet = new Set<string>();
    citas.forEach((c) => {
      if (c.pacienteId) pacientesSet.add(c.pacienteId);
    });
    const pacientesUnicos = pacientesSet.size;

    // 7. Grupos que usan este servicio
    const gruposSet = new Set<string>();
    asignaciones.forEach((a) => {
      if (a.grupoId) gruposSet.add(a.grupoId);
    });
    const gruposQueLoUsan = gruposSet.size;

    // 8. Profesionales que lo ofrecen
    const profesionalesMap = new Map<
      string,
      { nombre: string; vecesAsignado: number; citasRealizadas: number }
    >();

    asignaciones.forEach((a) => {
      const profId = a.profesionalPrincipalId;
      const profNombre = a.profesionalPrincipalNombre ?? 'Desconocido';
      if (!profesionalesMap.has(profId)) {
        profesionalesMap.set(profId, { nombre: profNombre, vecesAsignado: 0, citasRealizadas: 0 });
      }
      const prof = profesionalesMap.get(profId)!;
      prof.vecesAsignado++;
    });

    citas
      .filter((c) => c.estado === 'realizada')
      .forEach((c) => {
        const profId = c.profesionalId;
        if (profesionalesMap.has(profId)) {
          const prof = profesionalesMap.get(profId)!;
          prof.citasRealizadas++;
        }
      });

    const profesionalesQueLoOfrecen = Array.from(profesionalesMap.entries())
      .map(([profesionalId, data]) => ({
        profesionalId,
        profesionalNombre: data.nombre,
        vecesAsignado: data.vecesAsignado,
        citasRealizadas: data.citasRealizadas,
      }))
      .sort((a, b) => b.citasRealizadas - a.citasRealizadas);

    // 9. Duración promedio real
    const citasConDuracion = citas.filter((c) => c.estado === 'realizada' && c.duracion > 0);
    const duracionPromedioReal =
      citasConDuracion.length > 0
        ? citasConDuracion.reduce((sum, c) => sum + c.duracion, 0) / citasConDuracion.length
        : undefined;

    const desviacionDuracion =
      duracionPromedioReal && catalogo.tiempoEstimado
        ? ((duracionPromedioReal - catalogo.tiempoEstimado) / catalogo.tiempoEstimado) * 100
        : undefined;

    // 10. Distribución por mes
    const ahora = new Date();
    const citasPorMes: Array<{
      mes: string;
      citas: number;
      citasRealizadas: number;
      citasCanceladas: number;
    }> = [];

    for (let i = mesesHistorico - 1; i >= 0; i--) {
      const mesDate = subMonths(ahora, i);
      const inicioMes = startOfMonth(mesDate);
      const finMes = endOfMonth(mesDate);
      const mesStr = format(mesDate, 'yyyy-MM');

      const citasDelMes = citas.filter(
        (c) => c.fechaInicio >= inicioMes && c.fechaInicio <= finMes
      );

      citasPorMes.push({
        mes: mesStr,
        citas: citasDelMes.length,
        citasRealizadas: citasDelMes.filter((c) => c.estado === 'realizada').length,
        citasCanceladas: citasDelMes.filter((c) => c.estado === 'cancelada').length,
      });
    }

    // 11. Últimas 4 semanas
    const citasUltimas4Semanas: Array<{ semana: string; citas: number }> = [];
    for (let i = 3; i >= 0; i--) {
      const semanaDate = subMonths(ahora, 0);
      const inicioSemana = startOfWeek(new Date(ahora.getTime() - i * 7 * 24 * 60 * 60 * 1000), {
        weekStartsOn: 1,
      });
      const finSemana = endOfWeek(inicioSemana, { weekStartsOn: 1 });
      const semanaStr = format(inicioSemana, 'yyyy-MM-dd');

      const citasDeLaSemana = citas.filter(
        (c) => c.fechaInicio >= inicioSemana && c.fechaInicio <= finSemana
      );

      citasUltimas4Semanas.push({
        semana: semanaStr,
        citas: citasDeLaSemana.length,
      });
    }

    // 12. Tendencias (mes actual vs mes anterior)
    const inicioMesActual = startOfMonth(ahora);
    const finMesActual = endOfMonth(ahora);
    const inicioMesAnterior = startOfMonth(subMonths(ahora, 1));
    const finMesAnterior = endOfMonth(subMonths(ahora, 1));

    const citasMesActual = citas.filter(
      (c) => c.fechaInicio >= inicioMesActual && c.fechaInicio <= finMesActual
    );
    const citasMesAnterior = citas.filter(
      (c) => c.fechaInicio >= inicioMesAnterior && c.fechaInicio <= finMesAnterior
    );

    const pacientesMesActual = new Set(citasMesActual.map((c) => c.pacienteId).filter(Boolean));
    const pacientesMesAnterior = new Set(citasMesAnterior.map((c) => c.pacienteId).filter(Boolean));

    const mesActual = {
      citas: citasMesActual.length,
      citasRealizadas: citasMesActual.filter((c) => c.estado === 'realizada').length,
      citasCanceladas: citasMesActual.filter((c) => c.estado === 'cancelada').length,
      pacientesUnicos: pacientesMesActual.size,
    };

    const mesAnterior = {
      citas: citasMesAnterior.length,
      citasRealizadas: citasMesAnterior.filter((c) => c.estado === 'realizada').length,
      citasCanceladas: citasMesAnterior.filter((c) => c.estado === 'cancelada').length,
      pacientesUnicos: pacientesMesAnterior.size,
    };

    const tendenciaCitas =
      mesAnterior.citas > 0
        ? ((mesActual.citas - mesAnterior.citas) / mesAnterior.citas) * 100
        : 0;

    // 13. Generar alertas
    const alertas: Array<{ tipo: 'info' | 'warning' | 'error'; mensaje: string }> = [];

    if (tasaCancelacion > 30) {
      alertas.push({
        tipo: 'error',
        mensaje: `Tasa de cancelación muy alta: ${tasaCancelacion.toFixed(1)}%`,
      });
    } else if (tasaCancelacion > 15) {
      alertas.push({
        tipo: 'warning',
        mensaje: `Tasa de cancelación elevada: ${tasaCancelacion.toFixed(1)}%`,
      });
    }

    if (desviacionDuracion && Math.abs(desviacionDuracion) > 25) {
      alertas.push({
        tipo: 'warning',
        mensaje: `La duración real difiere ${desviacionDuracion > 0 ? '+' : ''}${desviacionDuracion.toFixed(1)}% del tiempo estimado`,
      });
    }

    if (tendenciaCitas < -20) {
      alertas.push({
        tipo: 'warning',
        mensaje: `Demanda en descenso: ${tendenciaCitas.toFixed(1)}% respecto al mes anterior`,
      });
    }

    if (asignacionesActivas === 0 && totalAsignaciones > 0) {
      alertas.push({
        tipo: 'info',
        mensaje: 'No hay asignaciones activas actualmente',
      });
    }

    if (profesionalesQueLoOfrecen.length === 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: 'No hay profesionales asignados a este servicio',
      });
    }

    // 14. Construir resultado final
    const estadisticas: CatalogoServicioEstadisticas = {
      catalogoServicioId,
      catalogoServicioNombre: catalogo.nombre,
      categoria: catalogo.categoria,
      totalAsignaciones,
      asignacionesActivas,
      asignacionesPendientes,
      totalCitas,
      citasRealizadas,
      citasProgramadas,
      citasConfirmadas,
      citasCanceladas,
      tasaCancelacion,
      pacientesUnicos,
      gruposQueLoUsan,
      totalProfesionalesHabilitados: catalogo.profesionalesHabilitados.length,
      profesionalesQueLoOfrecen,
      tiempoEstimado: catalogo.tiempoEstimado,
      duracionPromedioReal,
      desviacionDuracion,
      citasPorMes,
      citasUltimas4Semanas,
      mesActual,
      mesAnterior,
      tendenciaCitas,
      alertas,
      fechaActualizacion: new Date().toISOString(),
    };

    return estadisticas;
  } catch (error) {
    logger.error('[serviciosStats] Error al calcular estadísticas:', error);
    return null;
  }
}
