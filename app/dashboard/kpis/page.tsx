'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { 
  DailyReport, 
  ServicioAsignado, 
  Profesional, 
  EvaluacionSesion,
  Proyecto 
} from '@/types';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Award, 
  Clock, 
  BarChart3,
  Download,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import * as XLSX from 'xlsx';

type PeriodoFiltro = 'semana' | 'mes' | 'trimestre' | 'año';
type VistaActual = 'general' | 'profesionales' | 'servicios' | 'calidad';

export default function KPIsPage() {
  const { user } = useAuth();
  
  // Estados de datos
  const [reportes, setReportes] = useState<DailyReport[]>([]);
  const [servicios, setServicios] = useState<ServicioAsignado[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionSesion[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  
  // Estados de UI
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [vistaActual, setVistaActual] = useState<VistaActual>('general');
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
  const [fechaFin, setFechaFin] = useState<Date>(new Date());

  // Colores para gráficos
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    orange: '#F97316',
  };

  const CHART_COLORS = [
    COLORS.primary,
    COLORS.success,
    COLORS.warning,
    COLORS.purple,
    COLORS.pink,
    COLORS.cyan,
    COLORS.orange,
    COLORS.danger,
  ];

  // Calcular rango de fechas según período
  useEffect(() => {
    const hoy = new Date();
    let inicio = new Date();

    switch (periodo) {
      case 'semana':
        inicio.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        inicio.setMonth(hoy.getMonth() - 1);
        break;
      case 'trimestre':
        inicio.setMonth(hoy.getMonth() - 3);
        break;
      case 'año':
        inicio.setFullYear(hoy.getFullYear() - 1);
        break;
    }

    setFechaInicio(inicio);
    setFechaFin(hoy);
  }, [periodo]);

  // Cargar datos de Firebase
  useEffect(() => {
    // Reportes
    const qReportes = query(
      collection(db, 'daily-reports'),
      where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
      where('fecha', '<=', Timestamp.fromDate(fechaFin))
    );
    const unsubReportes = onSnapshot(qReportes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as DailyReport[];
      setReportes(data);
    });

    // Servicios
    const qServicios = query(collection(db, 'servicios-asignados'));
    const unsubServicios = onSnapshot(qServicios, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as ServicioAsignado[];
      setServicios(data);
    });

    // Profesionales
    const qProfesionales = query(
      collection(db, 'profesionales'),
      where('activo', '==', true)
    );
    const unsubProfesionales = onSnapshot(qProfesionales, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Profesional[];
      setProfesionales(data);
    });

    // Evaluaciones
    const qEvaluaciones = query(
      collection(db, 'evaluaciones-sesion'),
      where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
      where('fecha', '<=', Timestamp.fromDate(fechaFin))
    );
    const unsubEvaluaciones = onSnapshot(qEvaluaciones, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as EvaluacionSesion[];
      setEvaluaciones(data);
    });

    // Proyectos
    const qProyectos = query(collection(db, 'proyectos'));
    const unsubProyectos = onSnapshot(qProyectos, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaInicio: doc.data().fechaInicio?.toDate(),
        fechaFinEstimada: doc.data().fechaFinEstimada?.toDate(),
        fechaFinReal: doc.data().fechaFinReal?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Proyecto[];
      setProyectos(data);
    });

    return () => {
      unsubReportes();
      unsubServicios();
      unsubProfesionales();
      unsubEvaluaciones();
      unsubProyectos();
    };
  }, [fechaInicio, fechaFin]);

  // ========================================
  // CÁLCULOS DE MÉTRICAS
  // ========================================

  const metricas = useMemo(() => {
    // Reportes
    const totalReportes = reportes.length;
    const reportesResueltos = reportes.filter(r => r.estado === 'resuelta').length;
    const reportesPendientes = reportes.filter(r => r.estado === 'pendiente').length;
    const reportesAlta = reportes.filter(r => r.prioridad === 'alta').length;
    const tasaResolucion = totalReportes > 0 ? (reportesResueltos / totalReportes) * 100 : 0;

    // Servicios
    const totalServicios = servicios.length;
    const serviciosActuales = servicios.filter(s => s.esActual).length;
    const serviciosConTicket = servicios.filter(s => s.tiquet === 'SI').length;

    // Profesionales
    const totalProfesionales = profesionales.length;
    const cargaPromedioEquipo = profesionales.reduce((acc, p) => acc + p.cargaTrabajo, 0) / totalProfesionales || 0;

    // Evaluaciones
    const totalEvaluaciones = evaluaciones.length;
    const promedioCalidad = evaluaciones.length > 0
      ? evaluaciones.reduce((acc, e) => 
          acc + (e.aplicacionProtocolo + e.manejoPaciente + e.usoEquipamiento + e.comunicacion) / 4, 0
        ) / evaluaciones.length
      : 0;
    const cumplimientoProtocolos = evaluaciones.length > 0
      ? (evaluaciones.filter(e => e.protocoloSeguido).length / evaluaciones.length) * 100
      : 0;
    const satisfaccionPacientes = evaluaciones.length > 0
      ? evaluaciones.reduce((acc, e) => acc + e.resultadoPercibido, 0) / evaluaciones.length
      : 0;

    // Proyectos
    const proyectosActivos = proyectos.filter(p => p.estado === 'en-curso').length;
    const proyectosCompletados = proyectos.filter(p => p.estado === 'completado').length;

    return {
      reportes: {
        total: totalReportes,
        resueltos: reportesResueltos,
        pendientes: reportesPendientes,
        alta: reportesAlta,
        tasaResolucion: tasaResolucion.toFixed(1),
      },
      servicios: {
        total: totalServicios,
        actuales: serviciosActuales,
        conTicket: serviciosConTicket,
        porcentajeActuales: totalServicios > 0 ? ((serviciosActuales / totalServicios) * 100).toFixed(1) : 0,
      },
      profesionales: {
        total: totalProfesionales,
        cargaPromedio: cargaPromedioEquipo.toFixed(1),
      },
      calidad: {
        totalEvaluaciones,
        promedioCalidad: promedioCalidad.toFixed(2),
        cumplimientoProtocolos: cumplimientoProtocolos.toFixed(1),
        satisfaccionPacientes: satisfaccionPacientes.toFixed(2),
      },
      proyectos: {
        activos: proyectosActivos,
        completados: proyectosCompletados,
      },
    };
  }, [reportes, servicios, profesionales, evaluaciones, proyectos]);

  // Datos para gráfico de tendencia de reportes
  const datosReportesPorFecha = useMemo(() => {
    const agrupadosPorFecha = reportes.reduce((acc, reporte) => {
      const fecha = reporte.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      if (!acc[fecha]) {
        acc[fecha] = { fecha, total: 0, resueltos: 0, pendientes: 0 };
      }
      acc[fecha].total++;
      if (reporte.estado === 'resuelta') acc[fecha].resueltos++;
      if (reporte.estado === 'pendiente') acc[fecha].pendientes++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agrupadosPorFecha).slice(-10);
  }, [reportes]);

  // Datos para gráfico de reportes por tipo
  const datosReportesPorTipo = useMemo(() => {
    const tipos = reportes.reduce((acc, r) => {
      acc[r.tipo] = (acc[r.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tipos).map(([tipo, cantidad]) => ({
      name: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      value: cantidad,
    }));
  }, [reportes]);

  // Datos para gráfico de profesionales por carga
  const datosProfesionalesPorCarga = useMemo(() => {
    return profesionales
      .map(p => ({
        nombre: `${p.nombre} ${p.apellidos.split(' ')[0]}`,
        carga: p.cargaTrabajo,
        servicios: p.serviciosAsignados,
      }))
      .sort((a, b) => b.carga - a.carga)
      .slice(0, 8);
  }, [profesionales]);

  // Datos para radar de calidad por profesional
  const datosRadarCalidad = useMemo(() => {
    return profesionales.slice(0, 5).map(prof => {
      const evalsProfesional = evaluaciones.filter(e => e.profesionalId === prof.id);
      
      if (evalsProfesional.length === 0) {
        return {
          nombre: prof.nombre,
          tecnica: 0,
          manejo: 0,
          equipamiento: 0,
          comunicacion: 0,
        };
      }

      return {
        nombre: prof.nombre,
        tecnica: (evalsProfesional.reduce((acc, e) => acc + e.aplicacionProtocolo, 0) / evalsProfesional.length).toFixed(1),
        manejo: (evalsProfesional.reduce((acc, e) => acc + e.manejoPaciente, 0) / evalsProfesional.length).toFixed(1),
        equipamiento: (evalsProfesional.reduce((acc, e) => acc + e.usoEquipamiento, 0) / evalsProfesional.length).toFixed(1),
        comunicacion: (evalsProfesional.reduce((acc, e) => acc + e.comunicacion, 0) / evalsProfesional.length).toFixed(1),
      };
    });
  }, [profesionales, evaluaciones]);

  // Datos para rendimiento de profesionales
  const datosRendimientoProfesionales = useMemo(() => {
    return profesionales.map(prof => {
      const evalsProfesional = evaluaciones.filter(e => e.profesionalId === prof.id);
      
      const promedio = evalsProfesional.length > 0
        ? evalsProfesional.reduce((acc, e) => 
            acc + (e.aplicacionProtocolo + e.manejoPaciente + e.usoEquipamiento + e.comunicacion) / 4, 0
          ) / evalsProfesional.length
        : 0;

      return {
        id: prof.id,
        nombre: `${prof.nombre} ${prof.apellidos}`,
        especialidad: prof.especialidad,
        serviciosAsignados: prof.serviciosAsignados,
        cargaTrabajo: prof.cargaTrabajo,
        evaluaciones: evalsProfesional.length,
        promedioCalidad: Number(promedio.toFixed(2)),
      };
    }).sort((a, b) => b.promedioCalidad - a.promedioCalidad);
  }, [profesionales, evaluaciones]);

  // Exportar a Excel
  const exportarAExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen General
    const resumen = [
      ['KPIs - Resumen General'],
      ['Período', `${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`],
      [''],
      ['REPORTES'],
      ['Total Reportes', metricas.reportes.total],
      ['Resueltos', metricas.reportes.resueltos],
      ['Pendientes', metricas.reportes.pendientes],
      ['Tasa Resolución', `${metricas.reportes.tasaResolucion}%`],
      [''],
      ['SERVICIOS'],
      ['Total Servicios', metricas.servicios.total],
      ['Servicios Actuales', metricas.servicios.actuales],
      ['Con Ticket', metricas.servicios.conTicket],
      [''],
      ['CALIDAD'],
      ['Total Evaluaciones', metricas.calidad.totalEvaluaciones],
      ['Promedio Calidad', metricas.calidad.promedioCalidad],
      ['Cumplimiento Protocolos', `${metricas.calidad.cumplimientoProtocolos}%`],
      ['Satisfacción Pacientes', metricas.calidad.satisfaccionPacientes],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja 2: Profesionales
    const datosProfesionales = datosRendimientoProfesionales.map(p => ({
      'Nombre': p.nombre,
      'Especialidad': p.especialidad,
      'Servicios Asignados': p.serviciosAsignados,
      'Carga Trabajo': p.cargaTrabajo,
      'Evaluaciones': p.evaluaciones,
      'Promedio Calidad': p.promedioCalidad,
    }));
    const wsProfesionales = XLSX.utils.json_to_sheet(datosProfesionales);
    XLSX.utils.book_append_sheet(wb, wsProfesionales, 'Profesionales');

    // Hoja 3: Reportes
    const datosReportesExcel = reportes.map(r => ({
      'Fecha': r.fecha.toLocaleDateString(),
      'Tipo': r.tipo,
      'Categoría': r.categoria,
      'Prioridad': r.prioridad,
      'Estado': r.estado,
      'Responsable': r.responsable,
      'Descripción': r.descripcion,
    }));
    const wsReportes = XLSX.utils.json_to_sheet(datosReportesExcel);
    XLSX.utils.book_append_sheet(wb, wsReportes, 'Reportes');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `KPIs_Clinica_${fecha}.xlsx`);
  };

  // ========================================
  // COMPONENTES DE VISTA
  // ========================================

  const VistaGeneral = () => (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reportes</p>
              <p className="text-3xl font-bold text-blue-600">{metricas.reportes.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metricas.reportes.tasaResolucion}% resueltos
              </p>
            </div>
            <Activity className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Servicios Actuales</p>
              <p className="text-3xl font-bold text-green-600">{metricas.servicios.actuales}</p>
              <p className="text-xs text-gray-500 mt-1">
                de {metricas.servicios.total} totales
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Calidad Promedio</p>
              <p className="text-3xl font-bold text-purple-600">{metricas.calidad.promedioCalidad}/5</p>
              <p className="text-xs text-gray-500 mt-1">
                {metricas.calidad.totalEvaluaciones} evaluaciones
              </p>
            </div>
            <Award className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Proyectos Activos</p>
              <p className="text-3xl font-bold text-orange-600">{metricas.proyectos.activos}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metricas.proyectos.completados} completados
              </p>
            </div>
            <Target className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tendencia de Reportes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Tendencia de Reportes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosReportesPorFecha}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" style={{ fontSize: '12px' }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke={COLORS.primary} name="Total" strokeWidth={2} />
              <Line type="monotone" dataKey="resueltos" stroke={COLORS.success} name="Resueltos" strokeWidth={2} />
              <Line type="monotone" dataKey="pendientes" stroke={COLORS.warning} name="Pendientes" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reportes por Tipo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Reportes por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosReportesPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {datosReportesPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicadores de Calidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-900">Cumplimiento Protocolos</p>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{metricas.calidad.cumplimientoProtocolos}%</p>
          <div className="mt-3 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metricas.calidad.cumplimientoProtocolos}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-900">Satisfacción Pacientes</p>
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{metricas.calidad.satisfaccionPacientes}/5</p>
          <div className="mt-3 bg-green-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(parseFloat(metricas.calidad.satisfaccionPacientes) / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-900">Carga Promedio Equipo</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{metricas.profesionales.cargaPromedio}%</p>
          <div className="mt-3 bg-purple-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metricas.profesionales.cargaPromedio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const VistaProfesionales = () => (
    <div className="space-y-6">
      {/* Tabla de Rendimiento */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Rendimiento por Profesional</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesional</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicios</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carga %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluaciones</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {datosRendimientoProfesionales.map((prof, index) => (
                <tr key={prof.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{prof.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{prof.especialidad}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{prof.serviciosAsignados}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            prof.cargaTrabajo > 80 ? 'bg-red-500' :
                            prof.cargaTrabajo > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${prof.cargaTrabajo}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{prof.cargaTrabajo}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{prof.evaluaciones}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prof.promedioCalidad >= 4.5 ? 'bg-green-100 text-green-800' :
                      prof.promedioCalidad >= 4.0 ? 'bg-blue-100 text-blue-800' :
                      prof.promedioCalidad >= 3.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {prof.promedioCalidad}/5
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carga de Trabajo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Carga de Trabajo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosProfesionalesPorCarga}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="carga" fill={COLORS.primary} name="Carga %" />
              <Bar dataKey="servicios" fill={COLORS.success} name="Servicios" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar de Habilidades */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Perfil de Habilidades (Top 5)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              { skill: 'Técnica', ...Object.fromEntries(datosRadarCalidad.map(d => [d.nombre, d.tecnica])) },
              { skill: 'Manejo', ...Object.fromEntries(datosRadarCalidad.map(d => [d.nombre, d.manejo])) },
              { skill: 'Equipamiento', ...Object.fromEntries(datosRadarCalidad.map(d => [d.nombre, d.equipamiento])) },
              { skill: 'Comunicación', ...Object.fromEntries(datosRadarCalidad.map(d => [d.nombre, d.comunicacion])) },
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              {datosRadarCalidad.map((prof, index) => (
                <Radar
                  key={prof.nombre}
                  name={prof.nombre}
                  dataKey={prof.nombre}
                  stroke={CHART_COLORS[index]}
                  fill={CHART_COLORS[index]}
                  fillOpacity={0.3}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const VistaServicios = () => {
    const serviciosPorCategoria = useMemo(() => {
      const medicina = servicios.filter(s => s.catalogoServicioNombre.toLowerCase().includes('medic')).length;
      const fisioterapia = servicios.filter(s => s.catalogoServicioNombre.toLowerCase().includes('fisio')).length;
      const enfermeria = servicios.filter(s => !s.catalogoServicioNombre.toLowerCase().includes('medic') && 
                                              !s.catalogoServicioNombre.toLowerCase().includes('fisio')).length;
      
      return [
        { name: 'Medicina', value: medicina, color: COLORS.primary },
        { name: 'Fisioterapia', value: fisioterapia, color: COLORS.success },
        { name: 'Enfermería', value: enfermeria, color: COLORS.purple },
      ];
    }, [servicios]);

    const serviciosPorTicket = useMemo(() => {
      return [
        { name: 'SI', value: servicios.filter(s => s.tiquet === 'SI').length, color: COLORS.success },
        { name: 'NO', value: servicios.filter(s => s.tiquet === 'NO').length, color: COLORS.danger },
        { name: 'CORD', value: servicios.filter(s => s.tiquet === 'CORD').length, color: COLORS.warning },
        { name: 'ESPACH', value: servicios.filter(s => s.tiquet === 'ESPACH').length, color: COLORS.cyan },
      ];
    }, [servicios]);

    return (
      <div className="space-y-6">
        {/* Métricas de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Servicios</p>
            <p className="text-2xl font-bold text-gray-900">{metricas.servicios.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Actuales</p>
            <p className="text-2xl font-bold text-green-600">{metricas.servicios.actuales}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Con Ticket</p>
            <p className="text-2xl font-bold text-blue-600">{metricas.servicios.conTicket}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">% Actuales</p>
            <p className="text-2xl font-bold text-purple-600">{metricas.servicios.porcentajeActuales}%</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Por Categoría */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Servicios por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviciosPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {serviciosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Por Ticket */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 Estado de Tickets CRM</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviciosPorTicket}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Cantidad">
                  {serviciosPorTicket.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const VistaCalidad = () => (
    <div className="space-y-6">
      {/* Métricas de Calidad */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Evaluaciones</p>
          <p className="text-2xl font-bold text-gray-900">{metricas.calidad.totalEvaluaciones}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Promedio Calidad</p>
          <p className="text-2xl font-bold text-blue-600">{metricas.calidad.promedioCalidad}/5</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Cumplimiento</p>
          <p className="text-2xl font-bold text-green-600">{metricas.calidad.cumplimientoProtocolos}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Satisfacción</p>
          <p className="text-2xl font-bold text-purple-600">{metricas.calidad.satisfaccionPacientes}/5</p>
        </div>
      </div>

      {/* Evolución de Calidad */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evolución de Calidad</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={evaluaciones
              .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
              .slice(-15)
              .map(e => ({
                fecha: e.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                calidad: ((e.aplicacionProtocolo + e.manejoPaciente + e.usoEquipamiento + e.comunicacion) / 4).toFixed(1),
                satisfaccion: e.resultadoPercibido,
              }))
            }
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" style={{ fontSize: '11px' }} />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="calidad" stroke={COLORS.primary} name="Calidad" strokeWidth={2} />
            <Line type="monotone" dataKey="satisfaccion" stroke={COLORS.success} name="Satisfacción" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas de Calidad */}
      {evaluaciones.filter(e => !e.protocoloSeguido).length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">⚠️ Alertas de Calidad</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>• {evaluaciones.filter(e => !e.protocoloSeguido).length} caso(s) con protocolo no seguido</p>
                <p>• {evaluaciones.filter(e => e.resultadoPercibido < 3).length} caso(s) con satisfacción baja</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 KPIs - Indicadores Clave</h1>
          <p className="text-gray-600 mt-1">Análisis y métricas de rendimiento de la clínica</p>
        </div>
        <button
          onClick={exportarAExcel}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download className="w-5 h-5" />
          <span>Exportar Excel</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          
          <div className="flex space-x-2">
            {(['semana', 'mes', 'trimestre', 'año'] as PeriodoFiltro[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  periodo === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {fechaInicio.toLocaleDateString('es-ES')} - {fechaFin.toLocaleDateString('es-ES')}
          </div>
        </div>
      </div>

      {/* Navegación de Vistas */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          {[
            { id: 'general', nombre: 'General', icono: TrendingUp },
            { id: 'profesionales', nombre: 'Profesionales', icono: Users },
            { id: 'servicios', nombre: 'Servicios', icono: BarChart3 },
            { id: 'calidad', nombre: 'Calidad', icono: Award },
          ].map(({ id, nombre, icono: Icono }) => (
            <button
              key={id}
              onClick={() => setVistaActual(id as VistaActual)}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                vistaActual === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icono className="w-5 h-5" />
              <span>{nombre}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {vistaActual === 'general' && <VistaGeneral />}
          {vistaActual === 'profesionales' && <VistaProfesionales />}
          {vistaActual === 'servicios' && <VistaServicios />}
          {vistaActual === 'calidad' && <VistaCalidad />}
        </div>
      </div>

      {/* Mensaje si no hay datos */}
      {reportes.length === 0 && evaluaciones.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-blue-900 font-medium">No hay datos suficientes para el período seleccionado</p>
          <p className="text-blue-700 text-sm mt-2">
            Intenta seleccionar un período más amplio o verifica que haya datos registrados
          </p>
        </div>
      )}
    </div>
  );
}
