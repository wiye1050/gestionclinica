'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { getPendingFollowUpPatientIds } from '@/lib/utils/followUps';
import { logger } from '@/lib/utils/logger';
import {
  RecentActivity,
  TodayAppointment,
  UserTask,
  FinanceSummary,
  StockAlerts,
  FollowUpPatient,
  RecentEvaluation,
} from '@/types/dashboard';

// Hook para actividad reciente
export function useRecentActivity() {
  const [data, setData] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchActivity = async () => {
      try {
        const activitySnap = await getDocs(
          query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(5))
        );

        if (!active) return;

        setData(
          activitySnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              tipo: data.modulo || 'general',
              descripcion: data.resumen || data.accion || 'Sin descripción',
              fecha: data.createdAt?.toDate?.() ?? new Date(),
            };
          })
        );
        setError(null);
      } catch (err) {
        logger.error('Error cargando actividad', err as Error);
        if (active) setError('Error cargando actividad');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchActivity();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

// Hook para citas de hoy
export function useTodayAppointments() {
  const [data, setData] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchTodayAppointments = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        const startTs = Timestamp.fromDate(startOfDay);
        const endTs = Timestamp.fromDate(endOfDay);

        const eventosSnap = await getDocs(
          query(
            collection(db, 'agenda-eventos'),
            where('fechaInicio', '>=', startTs),
            where('fechaInicio', '<=', endTs),
            orderBy('fechaInicio', 'asc')
          )
        );

        if (!active) return;

        setData(
          eventosSnap.docs.map((docSnap) => {
            const data = docSnap.data() ?? {};
            const fecha = data.fechaInicio?.toDate?.() ?? new Date();
            return {
              id: docSnap.id,
              paciente: data.pacienteNombre ?? data.titulo ?? 'Paciente sin nombre',
              profesional: data.profesionalNombre ?? 'Sin profesional',
              servicio: data.titulo,
              fecha,
              completada: data.estado === 'completada' || data.estado === 'realizada',
            };
          })
        );
        setError(null);
      } catch (err) {
        logger.error('Error cargando citas de hoy', err as Error);
        if (active) {
          setData([]);
          setError('Error cargando citas');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTodayAppointments();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

// Hook para tareas del usuario
export function useUserTasks() {
  const { user } = useAuth();
  const [data, setData] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchUserTasks = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const tareasSnap = await getDocs(
          query(collection(db, 'proyectos'), where('estado', 'in', ['en-curso', 'planificacion']))
        );

        if (!active) return;

        const tasks: UserTask[] = [];

        tareasSnap.docs.forEach((docSnap) => {
          const proyecto = docSnap.data();
          const tareas = proyecto.tareas ?? [];
          tareas.forEach(
            (tarea: {
              id?: string;
              titulo?: string;
              prioridad?: string;
              fechaLimite?: { toDate?: () => Date };
              completada?: boolean;
              asignadoA?: string;
            }) => {
              if (!tarea.completada && (!tarea.asignadoA || tarea.asignadoA === user.uid)) {
                tasks.push({
                  id: tarea.id ?? `${docSnap.id}-${tasks.length}`,
                  titulo: tarea.titulo ?? 'Sin título',
                  prioridad: (tarea.prioridad as 'alta' | 'media' | 'baja') ?? 'media',
                  fechaLimite: tarea.fechaLimite?.toDate?.(),
                  completada: tarea.completada ?? false,
                });
              }
            }
          );
        });

        // Ordenar por prioridad y fecha límite
        tasks.sort((a, b) => {
          const prioridadOrder: Record<string, number> = { alta: 0, media: 1, baja: 2 };
          const aPrio = prioridadOrder[a.prioridad] ?? 1;
          const bPrio = prioridadOrder[b.prioridad] ?? 1;
          if (aPrio !== bPrio) return aPrio - bPrio;
          if (a.fechaLimite && b.fechaLimite)
            return a.fechaLimite.getTime() - b.fechaLimite.getTime();
          return 0;
        });

        setData(tasks.slice(0, 5));
        setError(null);
      } catch (err) {
        logger.error('Error cargando tareas', err as Error);
        if (active) {
          setData([]);
          setError('Error cargando tareas');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUserTasks();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  return { data, loading, error };
}

// Hook para resumen financiero
export function useFinanceSummary() {
  const [data, setData] = useState<FinanceSummary>({
    facturadoMes: 0,
    cobradoMes: 0,
    totalPendiente: 0,
    totalVencido: 0,
    facturasPendientes: 0,
    totalFacturado: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchFinance = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard/finance-summary');
        if (!response.ok) {
          throw new Error('Respuesta inválida');
        }
        const summary = (await response.json()) as FinanceSummary;
        if (!active) return;
        setData(summary);
        setError(null);
      } catch (err) {
        logger.error('Error cargando finanzas', err as Error);
        if (active) {
          setData({
            facturadoMes: 0,
            cobradoMes: 0,
            totalPendiente: 0,
            totalVencido: 0,
            facturasPendientes: 0,
            totalFacturado: 0,
          });
          setError('Error cargando finanzas');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFinance();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

// Hook para alertas de stock
export function useStockAlerts() {
  const [data, setData] = useState<StockAlerts>({ total: 0, top: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchStockAlerts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'inventario-productos'),
            where('alertaStockBajo', '==', true),
            orderBy('nombre'),
            limit(5)
          )
        );

        if (!active) return;

        setData({
          total: snapshot.size,
          top: snapshot.docs.map((docSnap) => {
            const data = docSnap.data() ?? {};
            return {
              id: docSnap.id,
              nombre: data.nombre ?? 'Sin nombre',
              stock: Number(data.cantidadActual ?? data.stock ?? 0),
              stockMinimo: Number(data.cantidadMinima ?? data.stockMinimo ?? 0),
            };
          }),
        });
        setError(null);
      } catch (err) {
        logger.error('Error cargando inventario', err as Error);
        if (active) {
          setData({ total: 0, top: [] });
          setError('Error cargando inventario');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStockAlerts();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

// Hook para pacientes con seguimiento pendiente
export function useFollowUpPatients() {
  const [data, setData] = useState<FollowUpPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchFollowUps = async () => {
      setLoading(true);
      try {
        const pendingIds = await getPendingFollowUpPatientIds({ pendingLimit: 100 });

        if (!active) return;

        if (pendingIds.size === 0) {
          setData([]);
          return;
        }

        const patientIds = Array.from(pendingIds).slice(0, 5);
        const patients = await Promise.all(
          patientIds.map(async (id) => {
            try {
              const docSnap = await getDoc(doc(db, 'pacientes', id));
              if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                  id,
                  nombre: data.nombre ?? 'Sin nombre',
                  apellidos: data.apellidos ?? '',
                };
              }
              return null;
            } catch {
              return null;
            }
          })
        );

        if (!active) return;
        setData(patients.filter((p): p is NonNullable<typeof p> => p !== null));
        setError(null);
      } catch (err) {
        logger.error('Error cargando seguimientos', err as Error);
        if (active) {
          setData([]);
          setError('Error cargando seguimientos');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFollowUps();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

// Hook para evaluaciones recientes
export function useRecentEvaluations() {
  const [data, setData] = useState<RecentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchEvaluations = async () => {
      setLoading(true);
      try {
        const evalSnap = await getDocs(
          query(collection(db, 'evaluaciones-sesion'), orderBy('fecha', 'desc'), limit(5))
        );

        if (!active) return;

        setData(
          evalSnap.docs.map((docSnap) => {
            const data = docSnap.data();
            const promedio =
              ((data.aplicacionProtocolo ?? 0) +
                (data.manejoPaciente ?? 0) +
                (data.usoEquipamiento ?? 0) +
                (data.comunicacion ?? 0)) /
              4;
            return {
              id: docSnap.id,
              profesionalNombre: data.profesionalNombre ?? 'Sin profesional',
              fecha: data.fecha?.toDate?.() ?? new Date(),
              promedioGeneral: Math.round(promedio * 10) / 10,
              servicioNombre: data.servicioNombre ?? 'Sin servicio',
            };
          })
        );
        setError(null);
      } catch (err) {
        logger.error('Error cargando evaluaciones', err as Error);
        if (active) {
          setData([]);
          setError('Error cargando evaluaciones');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEvaluations();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
