'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit, where, Timestamp, collectionGroup, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useKPIs } from '@/lib/hooks/useQueries';
import { useProyectos } from '@/lib/hooks/useProyectos';
import { getPendingFollowUpPatientIds } from '@/lib/utils/followUps';
import {
  AlertTriangle,
  Package,
  ArrowRight,
  Activity,
  TrendingUp,
  CalendarDays,
  Users,
  FolderKanban,
  ClipboardCheck
} from 'lucide-react';

// Skeleton para loading
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-2xl"></div>
      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  // React Query hook - caché de 2 min
  const { data: kpisData, isLoading: loadingKPIs } = useKPIs();

  // Hook de proyectos
  const { proyectos, estadisticas: proyectosStats, isLoading: loadingProyectos } = useProyectos();

  const [recentActivity, setRecentActivity] = useState<Array<{id: string; tipo: string; descripcion: string; fecha: Date}>>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Array<{ id: string; paciente?: string; profesional?: string; fecha: Date; servicio?: string }>
  >([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [financeSummary, setFinanceSummary] = useState({
    facturadoMes: 0,
    cobradoMes: 0,
    totalPendiente: 0,
    totalVencido: 0,
    facturasPendientes: 0,
    totalFacturado: 0,
  });
  const [loadingFinance, setLoadingFinance] = useState(true);
  const [stockAlerts, setStockAlerts] = useState<{
    total: number;
    top: Array<{ id: string; nombre: string; stock: number; stockMinimo: number }>;
  }>({
    total: 0,
    top: [],
  });
  const [loadingStock, setLoadingStock] = useState(true);

  // Estado para pacientes con seguimiento pendiente
  const [followUpPatients, setFollowUpPatients] = useState<
    Array<{ id: string; nombre: string; apellidos: string; plan?: string }>
  >([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(true);

  // Estado para evaluaciones recientes
  const [recentEvaluations, setRecentEvaluations] = useState<
    Array<{ id: string; profesionalNombre: string; fecha: Date; promedioGeneral: number; servicioNombre: string }>
  >([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  // Stats desde React Query o valores por defecto
  const stats = useMemo(() => ({
    serviciosActivos: kpisData?.serviciosActivos ?? 0,
    incidenciasPendientes: kpisData?.reportesPendientes ?? 0,
    productosStockBajo: stockAlerts.total,
    cumplimientoProtocolos: 0, // Se puede agregar al hook useKPIs si es necesario
    seguimientosPendientes: kpisData?.eventosSemana ?? 0
  }), [kpisData, stockAlerts.total]);

  useEffect(() => {
    let active = true;

    const fetchActivity = async () => {
      try {
        const activitySnap = await getDocs(
          query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(5))
        );
        
        if (!active) return;

        setRecentActivity(
          activitySnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              tipo: data.modulo || 'general',
              descripcion: data.resumen || data.accion || 'Sin descripción',
              fecha: data.createdAt?.toDate?.() ?? new Date()
            };
          })
        );
      } catch (error) {
        console.error('Error cargando actividad', error);
      } finally {
        if (active) setLoadingActivity(false);
      }
    };

    fetchActivity();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUpcoming = async () => {
      try {
        setLoadingAppointments(true);
        const nowTs = Timestamp.fromDate(new Date());
        const eventosSnap = await getDocs(
          query(
            collection(db, 'agenda-eventos'),
            where('fechaInicio', '>=', nowTs),
            orderBy('fechaInicio', 'asc'),
            limit(3)
          )
        );
        if (!active) return;
        setUpcomingAppointments(
          eventosSnap.docs.map((doc) => {
            const data = doc.data() ?? {};
            const fecha =
              data.fechaInicio?.toDate?.() ??
              new Date();
            return {
              id: doc.id,
              paciente: data.pacienteNombre ?? data.titulo ?? 'Paciente sin nombre',
              profesional: data.profesionalNombre ?? 'Sin profesional',
              servicio: data.titulo,
              fecha,
            };
          })
        );
      } catch (error) {
        console.error('Error cargando próximas citas', error);
        if (active) setUpcomingAppointments([]);
      } finally {
        if (active) setLoadingAppointments(false);
      }
    };
    fetchUpcoming();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchFinance = async () => {
      setLoadingFinance(true);
      try {
        const today = new Date();
        const mesInicio = new Date(today.getFullYear(), today.getMonth(), 1);
        const facturasSnap = await getDocs(collectionGroup(db, 'facturas'));
        if (!active) return;
        let facturadoMes = 0;
        let cobradoMes = 0;
        let totalPendiente = 0;
        let totalVencido = 0;
        let facturasPendientes = 0;
        let totalFacturado = 0;

        facturasSnap.docs.forEach((docSnap) => {
          const data = docSnap.data() ?? {};
          const total = Number(data.total) || 0;
          const pagado = Number(data.pagado) || 0;
          const estado = data.estado ?? 'pendiente';
          const fecha = data.fecha?.toDate?.() ?? null;
          const fechaPago = data.fechaPago?.toDate?.() ?? null;

          totalFacturado += total;
          if (fecha && fecha >= mesInicio) {
            facturadoMes += total;
          }
          if (fechaPago && fechaPago >= mesInicio) {
            cobradoMes += pagado || total;
          }
          if (estado === 'pendiente') {
            totalPendiente += Math.max(total - pagado, 0);
            facturasPendientes += 1;
          }
          if (estado === 'vencida') {
            totalVencido += Math.max(total - pagado, 0);
          }
        });

        setFinanceSummary({
          facturadoMes,
          cobradoMes,
          totalPendiente,
          totalVencido,
          facturasPendientes,
          totalFacturado,
        });
      } catch (error) {
        console.error('Error cargando finanzas', error);
        if (active) {
          setFinanceSummary({
            facturadoMes: 0,
            cobradoMes: 0,
            totalPendiente: 0,
            totalVencido: 0,
            facturasPendientes: 0,
            totalFacturado: 0,
          });
        }
      } finally {
        if (active) {
          setLoadingFinance(false);
        }
      }
    };

    fetchFinance();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchStockAlerts = async () => {
      setLoadingStock(true);
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
        setStockAlerts({
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
      } catch (error) {
        console.error('Error cargando inventario', error);
        if (active) {
          setStockAlerts({ total: 0, top: [] });
        }
      } finally {
        if (active) {
          setLoadingStock(false);
        }
      }
    };

    fetchStockAlerts();
    return () => {
      active = false;
    };
  }, []);

  // Cargar pacientes con seguimiento pendiente
  useEffect(() => {
    let active = true;

    const fetchFollowUps = async () => {
      setLoadingFollowUps(true);
      try {
        const pendingIds = await getPendingFollowUpPatientIds({ pendingLimit: 100 });
        if (!active) return;

        if (pendingIds.size === 0) {
          setFollowUpPatients([]);
          return;
        }

        // Obtener datos de los primeros 5 pacientes
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
        setFollowUpPatients(patients.filter((p): p is NonNullable<typeof p> => p !== null));
      } catch (error) {
        console.error('Error cargando seguimientos', error);
        if (active) setFollowUpPatients([]);
      } finally {
        if (active) setLoadingFollowUps(false);
      }
    };

    fetchFollowUps();
    return () => {
      active = false;
    };
  }, []);

  // Cargar evaluaciones recientes
  useEffect(() => {
    let active = true;

    const fetchEvaluations = async () => {
      setLoadingEvaluations(true);
      try {
        const evalSnap = await getDocs(
          query(
            collection(db, 'evaluaciones-sesion'),
            orderBy('fecha', 'desc'),
            limit(5)
          )
        );

        if (!active) return;

        setRecentEvaluations(
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
      } catch (error) {
        console.error('Error cargando evaluaciones', error);
        if (active) setRecentEvaluations([]);
      } finally {
        if (active) setLoadingEvaluations(false);
      }
    };

    fetchEvaluations();
    return () => {
      active = false;
    };
  }, []);

  const now = useMemo(() => new Date(), []);
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(now);

  const loading = loadingKPIs || loadingActivity;
  const quickActions = [
    { label: 'Nueva cita', href: '/dashboard/agenda/nuevo' },
    { label: 'Registrar paciente', href: '/dashboard/pacientes/nuevo' },
    { label: 'Crear reporte', href: '/dashboard/reporte-diario' },
  ];

  return (
    <div className="space-y-4">
      {/* Header compacto con KPIs y acciones */}
      <section className="surface-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-slate-500">{formattedDate}</p>
            <div className="hidden md:flex items-center gap-3">
              {[
                { label: 'Servicios', value: stats.serviciosActivos, color: 'text-slate-900' },
                { label: 'Eventos', value: stats.seguimientosPendientes, color: 'text-brand' },
                { label: 'Reportes', value: stats.incidenciasPendientes, color: stats.incidenciasPendientes > 0 ? 'text-danger' : 'text-slate-900' },
                { label: 'Stock bajo', value: stats.productosStockBajo, color: stats.productosStockBajo > 0 ? 'text-warn' : 'text-slate-900' },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">{metric.label}</span>
                  <span className={`text-sm font-semibold ${metric.color}`}>
                    {loading ? '—' : metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Grid principal de widgets */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {/* Columna izquierda - 3 cols */}
        <div className="space-y-3 lg:col-span-3">
          {/* Fila superior - 3 widgets en grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Próximas citas */}
            <div className="surface-card p-3 border-l-2 border-l-brand">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-brand" />
                  <h3 className="text-xs font-semibold text-slate-900">Próximas citas</h3>
                </div>
                <span className="text-[10px] text-slate-400">{loadingAppointments ? '—' : upcomingAppointments.length}</span>
              </div>
              {loadingAppointments ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : upcomingAppointments.length === 0 ? (
                <p className="text-xs text-slate-500">Sin citas pendientes</p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingAppointments.map((cita) => (
                    <div key={cita.id} className="rounded-lg bg-slate-50 px-2 py-1.5">
                      <p className="text-xs font-medium text-slate-900 truncate">{cita.paciente}</p>
                      <p className="text-[10px] text-slate-500">
                        {cita.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finanzas */}
            <div className="surface-card p-3 border-l-2 border-l-violet-500 bg-violet-50/30">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
                <h3 className="text-xs font-semibold text-slate-900">Finanzas del mes</h3>
              </div>
              {loadingFinance ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-3 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Facturado</span>
                    <span className="font-semibold text-slate-900">{currencyFormatter.format(financeSummary.facturadoMes)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Cobrado</span>
                    <span className="font-semibold text-slate-900">{currencyFormatter.format(financeSummary.cobradoMes)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Pendiente</span>
                    <span className="font-semibold text-amber-600">{currencyFormatter.format(financeSummary.totalPendiente)}</span>
                  </div>
                  {financeSummary.totalVencido > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Vencido</span>
                      <span className="font-semibold text-rose-600">{currencyFormatter.format(financeSummary.totalVencido)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stock bajo */}
            <div className={`surface-card p-3 border-l-2 ${stats.productosStockBajo > 0 ? 'border-l-warn bg-orange-50/40' : 'border-l-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-warn" />
                  <h3 className="text-xs font-semibold text-slate-900">Stock bajo</h3>
                </div>
                {stats.productosStockBajo > 0 && (
                  <span className="rounded-full bg-warn-bg px-1.5 py-0.5 text-[9px] font-semibold text-warn">
                    {stats.productosStockBajo}
                  </span>
                )}
              </div>
              {loadingStock ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : stockAlerts.top.length === 0 ? (
                <p className="text-xs text-success">Sin alertas de stock</p>
              ) : (
                <div className="space-y-1">
                  {stockAlerts.top.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-600 truncate pr-2">{item.nombre}</span>
                      <span className="font-semibold text-slate-800">{item.stock}/{item.stockMinimo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fila de widgets principales - 2x2 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Seguimientos pendientes */}
            <div className={`surface-card p-3 border-l-2 ${followUpPatients.length > 0 ? 'border-l-amber-500 bg-amber-50/30' : 'border-l-success bg-emerald-50/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Users className={`h-3.5 w-3.5 ${followUpPatients.length > 0 ? 'text-amber-600' : 'text-success'}`} />
                  <h3 className="text-xs font-semibold text-slate-900">Seguimientos pendientes</h3>
                </div>
                {!loadingFollowUps && followUpPatients.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                    {followUpPatients.length}+
                  </span>
                )}
              </div>
              {loadingFollowUps ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : followUpPatients.length === 0 ? (
                <p className="text-xs text-success">Todos al día</p>
              ) : (
                <div className="space-y-1">
                  {followUpPatients.slice(0, 4).map((patient) => (
                    <Link
                      key={patient.id}
                      href={`/dashboard/pacientes/${patient.id}`}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] hover:bg-slate-100"
                    >
                      <span className="font-medium text-slate-900 truncate">{patient.nombre} {patient.apellidos}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/dashboard/pacientes" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Proyectos activos */}
            <div className="surface-card p-3 border-l-2 border-l-accent-500 bg-emerald-50/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5 text-accent-600" />
                  <h3 className="text-xs font-semibold text-slate-900">Proyectos en curso</h3>
                </div>
                {!loadingProyectos && proyectosStats && (
                  <span className="rounded-full bg-accent-100 px-1.5 py-0.5 text-[9px] font-semibold text-accent-700">
                    {proyectosStats.porEstado['en-curso']}
                  </span>
                )}
              </div>
              {loadingProyectos ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : proyectos.filter(p => p.estado === 'en-curso').length === 0 ? (
                <p className="text-xs text-slate-500">Sin proyectos activos</p>
              ) : (
                <div className="space-y-1.5">
                  {proyectos.filter(p => p.estado === 'en-curso').slice(0, 3).map((proyecto) => (
                    <div key={proyecto.id} className="rounded-lg bg-slate-50 px-2 py-1.5">
                      <p className="text-[11px] font-medium text-slate-900 truncate">{proyecto.nombre}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-500 rounded-full" style={{ width: `${proyecto.progreso}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-500">{proyecto.progreso}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {proyectosStats && proyectosStats.proyectosAtrasados > 0 && (
                <p className="mt-1.5 text-[10px] text-danger">⚠️ {proyectosStats.proyectosAtrasados} atrasado(s)</p>
              )}
              <Link href="/dashboard/proyectos" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Última actividad */}
            <div className="surface-card p-3 border-l-2 border-l-brand bg-sky-50/20">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="h-3.5 w-3.5 text-brand" />
                <h3 className="text-xs font-semibold text-slate-900">Actividad reciente</h3>
              </div>
              {loadingActivity ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-xs text-slate-500">Sin actividad</p>
              ) : (
                <div className="space-y-1.5">
                  {recentActivity.slice(0, 4).map((item) => (
                    <div key={item.id} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                      <p className="text-[11px] font-medium text-slate-900 truncate">{item.descripcion}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.tipo} · {item.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/auditoria" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80">
                Ver historial <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Alertas prioritarias (reportes) */}
            <div className={`surface-card p-3 border-l-2 ${stats.incidenciasPendientes > 0 ? 'border-l-danger bg-rose-50/30' : 'border-l-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className={`h-3.5 w-3.5 ${stats.incidenciasPendientes > 0 ? 'text-danger' : 'text-slate-400'}`} />
                  <h3 className="text-xs font-semibold text-slate-900">Reportes pendientes</h3>
                </div>
                {stats.incidenciasPendientes > 0 && (
                  <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-[9px] font-semibold text-danger">
                    {stats.incidenciasPendientes}
                  </span>
                )}
              </div>
              {stats.incidenciasPendientes === 0 ? (
                <p className="text-xs text-success">Sin reportes pendientes</p>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-600">
                    {stats.incidenciasPendientes} reporte(s) requieren atención
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-danger rounded-full"
                        style={{ width: `${Math.min(stats.incidenciasPendientes * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <Link href="/dashboard/reporte-diario" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80">
                Ver reportes <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Columna derecha - 1 col */}
        <aside className="space-y-3">
          {/* Métricas clave */}
          <div className="surface-card p-3 border-l-2 border-l-slate-300 bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-900 mb-2">Métricas clave</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">Servicios</span>
                <span className="text-lg font-semibold text-slate-900">{stats.serviciosActivos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">Profesionales</span>
                <span className="text-lg font-semibold text-slate-900">{kpisData?.profesionalesActivos ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">Eventos/sem</span>
                <span className="text-lg font-semibold text-brand">{stats.seguimientosPendientes}</span>
              </div>
            </div>
            <Link href="/dashboard/kpis" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80">
              Ver KPIs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Supervisión QA */}
          <div className="surface-card p-3 border-l-2 border-l-accent-500 bg-emerald-50/30">
            <div className="flex items-center gap-1.5 mb-2">
              <ClipboardCheck className="h-3.5 w-3.5 text-accent-600" />
              <h3 className="text-xs font-semibold text-slate-900">Supervisión QA</h3>
            </div>
            {loadingEvaluations ? (
              <p className="text-xs text-slate-500">Cargando...</p>
            ) : recentEvaluations.length === 0 ? (
              <p className="text-xs text-slate-500">Sin evaluaciones</p>
            ) : (
              <div className="space-y-1.5">
                {recentEvaluations.slice(0, 4).map((evaluation) => (
                  <div key={evaluation.id} className="rounded-lg bg-slate-50 px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-900 truncate">{evaluation.profesionalNombre}</span>
                      <span className={`rounded-full px-1 py-0.5 text-[9px] font-semibold ${
                        evaluation.promedioGeneral >= 4 ? 'bg-success-bg text-success' :
                        evaluation.promedioGeneral >= 3 ? 'bg-warn-bg text-warn' : 'bg-danger-bg text-danger'
                      }`}>
                        {evaluation.promedioGeneral}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{evaluation.servicioNombre}</p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/supervision" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80">
              Ver supervisión <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
