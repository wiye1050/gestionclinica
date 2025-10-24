'use client';

import { useEffect, useState } from "react";
import {
  getCountFromServer,
  collection,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import KPICard from "@/components/dashboard/KPICard";
import {
  Wrench,
  Users,
  ClipboardList,
  AlertTriangle,
  Layers,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { startOfWeek, addDays } from "date-fns";

interface KPIData {
  serviciosActivos: number;
  serviciosProgramados: number;
  profesionalesActivos: number;
  reportesPendientes: number;
  tratamientosActivos: number;
  catalogoActivos: number;
  eventosSemana: number;
  eventosConfirmadosSemana: number;
  cancelacionesSemana: number;
}

export default function KPIsPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerKPIs = async () => {
      try {
        const semanaInicio = startOfWeek(new Date(), { weekStartsOn: 1 });
        const semanaFin = addDays(semanaInicio, 7);

        const qServiciosActivos = query(
          collection(db, "servicios-asignados"),
          where("estado", "==", "activo")
        );
        const qServiciosActuales = query(
          collection(db, "servicios-asignados"),
          where("esActual", "==", true)
        );
        const qProfesionales = query(
          collection(db, "profesionales"),
          where("activo", "==", true)
        );
        const qReportesPendientes = query(
          collection(db, "reportes-diarios"),
          where("estado", "in", ["pendiente", "en-proceso"])
        );
        const qTratamientos = query(
          collection(db, "tratamientos"),
          where("activo", "==", true)
        );
        const qCatalogoServicios = query(
          collection(db, "catalogo-servicios"),
          where("activo", "==", true)
        );
        const qEventosSemana = query(
          collection(db, "agenda-eventos"),
          where("fechaInicio", ">=", Timestamp.fromDate(semanaInicio)),
          where("fechaInicio", "<", Timestamp.fromDate(semanaFin))
        );
        const qEventosConfirmados = query(
          collection(db, "agenda-eventos"),
          where("fechaInicio", ">=", Timestamp.fromDate(semanaInicio)),
          where("fechaInicio", "<", Timestamp.fromDate(semanaFin)),
          where("estado", "==", "confirmada")
        );
        const qEventosCancelados = query(
          collection(db, "agenda-eventos"),
          where("fechaInicio", ">=", Timestamp.fromDate(semanaInicio)),
          where("fechaInicio", "<", Timestamp.fromDate(semanaFin)),
          where("estado", "==", "cancelada")
        );

        const [
          serviciosActivosSnap,
          serviciosActualesSnap,
          profesionalesSnap,
          reportesPendientesSnap,
          tratamientosSnap,
          catalogoSnap,
          eventosSemanaSnap,
          eventosConfirmadosSnap,
          eventosCanceladosSnap
        ] = await Promise.all([
          getCountFromServer(qServiciosActivos),
          getCountFromServer(qServiciosActuales),
          getCountFromServer(qProfesionales),
          getCountFromServer(qReportesPendientes),
          getCountFromServer(qTratamientos),
          getCountFromServer(qCatalogoServicios),
          getCountFromServer(qEventosSemana),
          getCountFromServer(qEventosConfirmados),
          getCountFromServer(qEventosCancelados)
        ]);

        const eventosSemana = eventosSemanaSnap.data().count;
        const eventosConfirmadosSemana = eventosConfirmadosSnap.data().count;
        const cancelacionesSemana = eventosCanceladosSnap.data().count;

        setData({
          serviciosActivos: serviciosActivosSnap.data().count,
          serviciosProgramados: serviciosActualesSnap.data().count,
          profesionalesActivos: profesionalesSnap.data().count,
          reportesPendientes: reportesPendientesSnap.data().count,
          tratamientosActivos: tratamientosSnap.data().count,
          catalogoActivos: catalogoSnap.data().count,
          eventosSemana,
          eventosConfirmadosSemana,
          cancelacionesSemana
        });
      } catch (err) {
        console.error("Error cargando KPIs:", err);
        const message = err instanceof Error ? err.message : "Error desconocido al cargar los KPIs.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    obtenerKPIs();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Cargando KPIs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-gray-600">
        No se pudieron cargar los KPIs.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Indicadores Clave</h1>
        <p className="text-gray-600 mt-1">
          Panorama general del rendimiento operativo de la clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Servicios Activos"
          value={data.serviciosActivos.toString()}
          icon={<Wrench className="w-6 h-6" />}
          color="blue"
          trend={data.serviciosActivos > 0 ? "up" : "stable"}
          trendValue={
            data.serviciosActivos > 0
              ? `+${data.serviciosActivos} en curso`
              : "Sin servicios activos"
          }
        />
        <KPICard
          title="Servicios Programados"
          value={data.serviciosProgramados.toString()}
          icon={<ClipboardList className="w-6 h-6" />}
          color="green"
          trend={
            data.serviciosProgramados > data.serviciosActivos ? "up" : "stable"
          }
          trendValue={
            data.serviciosProgramados > 0
              ? `${data.serviciosProgramados} marcados como actuales`
              : "Sin servicios programados"
          }
        />
        <KPICard
          title="Profesionales Activos"
          value={data.profesionalesActivos.toString()}
          icon={<Users className="w-6 h-6" />}
          color="purple"
          trend={data.profesionalesActivos > 0 ? "up" : "stable"}
          trendValue={
            data.profesionalesActivos > 0
              ? `${data.profesionalesActivos} disponibles`
              : "Sin profesionales activos"
          }
        />
        <KPICard
          title="Alertas Pendientes"
          value={data.reportesPendientes.toString()}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={data.reportesPendientes > 0 ? "red" : "green"}
          trend={data.reportesPendientes > 0 ? "down" : "stable"}
          trendValue={
            data.reportesPendientes > 0
              ? `${data.reportesPendientes} reportes sin resolver`
              : "Todo en orden"
          }
        />
        <KPICard
          title="Tratamientos Activos"
          value={data.tratamientosActivos.toString()}
          icon={<Layers className="w-6 h-6" />}
          color="orange"
          trend={data.tratamientosActivos > 0 ? "up" : "stable"}
          trendValue={
            data.tratamientosActivos > 0
              ? `${data.tratamientosActivos} disponibles`
              : "Sin tratamientos activos"
          }
        />
        <KPICard
          title="Servicios en Catálogo"
          value={data.catalogoActivos.toString()}
          icon={<BookOpen className="w-6 h-6" />}
          color="blue"
          trend={data.catalogoActivos > 0 ? "up" : "stable"}
          trendValue={
            data.catalogoActivos > 0
              ? `${data.catalogoActivos} listos para asignación`
              : "Catálogo vacío"
          }
        />
        <KPICard
          title="Eventos esta semana"
          value={data.eventosSemana.toString()}
          icon={<CalendarDays className="w-6 h-6" />}
          color="purple"
          trend={data.eventosSemana > 0 ? "up" : "stable"}
          trendValue={
            data.eventosSemana > 0
              ? `${data.eventosSemana} entre lunes y domingo`
              : "Sin eventos planificados"
          }
        />
        <KPICard
          title="Confirmados semana"
          value={data.eventosConfirmadosSemana.toString()}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
          trend={
            data.eventosSemana > 0
              ? data.eventosConfirmadosSemana / data.eventosSemana > 0.5
                ? "up"
                : "down"
              : "stable"
          }
          trendValue={
            data.eventosSemana > 0
              ? `${Math.round(
                  (data.eventosConfirmadosSemana / data.eventosSemana) * 100
                )}% confirmados`
              : "No hay citas confirmadas"
          }
        />
        <KPICard
          title="Cancelaciones semana"
          value={data.cancelacionesSemana.toString()}
          icon={<XCircle className="w-6 h-6" />}
          color="red"
          trend={data.cancelacionesSemana > 0 ? "down" : "stable"}
          trendValue={
            data.cancelacionesSemana > 0
              ? `${data.cancelacionesSemana} citas canceladas`
              : "Sin cancelaciones registradas"
          }
        />
      </div>
    </div>
  );
}
