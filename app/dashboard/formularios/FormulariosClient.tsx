'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  BarChart3,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  Calendar,
  User,
  Clock,
  Download,
} from 'lucide-react';
import type { FormularioPlantilla, RespuestaFormulario, TipoFormulario, EstadoFormularioPlantilla } from '@/types';
import { Badge } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui';
import PrimaryTabs from '@/components/shared/PrimaryTabs';
import { KPIGrid } from '@/components/shared/KPIGrid';
import { formatDate } from '@/lib/utils/helpers';

interface FormulariosClientProps {
  initialPlantillas: FormularioPlantilla[];
  initialRespuestas: RespuestaFormulario[];
}

type VistaFormularios = 'plantillas' | 'respuestas' | 'estadisticas';

const TIPOS_FORMULARIO: Array<{ id: TipoFormulario | 'todos'; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'triaje_telefonico', label: 'Triaje Telefónico' },
  { id: 'exploracion_fisica', label: 'Exploración Física' },
  { id: 'peticion_pruebas', label: 'Petición de Pruebas' },
  { id: 'hoja_recomendaciones', label: 'Recomendaciones' },
  { id: 'consentimiento_informado', label: 'Consentimiento' },
  { id: 'citacion', label: 'Citación' },
  { id: 'valoracion_inicial', label: 'Valoración Inicial' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'alta_medica', label: 'Alta Médica' },
  { id: 'informe_clinico', label: 'Informe Clínico' },
  { id: 'receta_medica', label: 'Receta' },
  { id: 'volante_derivacion', label: 'Volante' },
  { id: 'otro', label: 'Otro' },
];

const ESTADOS_PLANTILLA: Array<{ id: EstadoFormularioPlantilla | 'todos'; label: string; tone: 'success' | 'warn' | 'danger' | 'muted' }> = [
  { id: 'todos', label: 'Todos', tone: 'muted' },
  { id: 'activo', label: 'Activo', tone: 'success' },
  { id: 'inactivo', label: 'Inactivo', tone: 'muted' },
  { id: 'borrador', label: 'Borrador', tone: 'warn' },
  { id: 'archivado', label: 'Archivado', tone: 'danger' },
];

export default function FormulariosClient({
  initialPlantillas,
  initialRespuestas,
}: FormulariosClientProps) {
  const [vista, setVista] = useState<VistaFormularios>('plantillas');
  const [busqueda, setBusqueda] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoFormulario | 'todos'>('todos');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFormularioPlantilla | 'todos'>('todos');

  // Filtros para respuestas
  const [busquedaRespuesta, setBusquedaRespuesta] = useState('');
  const [estadoRespuestaFilter, setEstadoRespuestaFilter] = useState<'todos' | 'borrador' | 'completado' | 'validado' | 'archivado'>('todos');

  // Filtrar plantillas
  const plantillasFiltradas = useMemo(() => {
    return initialPlantillas.filter((plantilla) => {
      const matchBusqueda = plantilla.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        plantilla.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const matchTipo = tipoFilter === 'todos' || plantilla.tipo === tipoFilter;
      const matchEstado = estadoFilter === 'todos' || plantilla.estado === estadoFilter;

      return matchBusqueda && matchTipo && matchEstado;
    });
  }, [initialPlantillas, busqueda, tipoFilter, estadoFilter]);

  // Filtrar respuestas
  const respuestasFiltradas = useMemo(() => {
    return initialRespuestas.filter((respuesta) => {
      const matchBusqueda = respuesta.pacienteNombre.toLowerCase().includes(busquedaRespuesta.toLowerCase()) ||
        respuesta.formularioNombre.toLowerCase().includes(busquedaRespuesta.toLowerCase()) ||
        respuesta.pacienteNHC?.toLowerCase().includes(busquedaRespuesta.toLowerCase());
      const matchEstado = estadoRespuestaFilter === 'todos' || respuesta.estado === estadoRespuestaFilter;

      return matchBusqueda && matchEstado;
    });
  }, [initialRespuestas, busquedaRespuesta, estadoRespuestaFilter]);

  // KPIs
  const totalPlantillas = initialPlantillas.length;
  const plantillasActivas = initialPlantillas.filter(p => p.estado === 'activo').length;
  const totalRespuestas = initialPlantillas.reduce((sum, p) => sum + p.totalRespuestas, 0);
  const respuestasCompletadas = initialRespuestas.filter(r => r.estado === 'completado').length;
  const conversionPromedio = Math.round(initialPlantillas.reduce((sum, p) => sum + p.tasaConversion, 0) / (totalPlantillas || 1));

  const kpis = [
    {
      label: 'Plantillas',
      value: totalPlantillas,
      helper: `${plantillasActivas} activas`,
      accent: 'brand' as const,
    },
    {
      label: 'Respuestas Totales',
      value: totalRespuestas,
      helper: 'Todos los formularios',
      accent: 'blue' as const,
    },
    {
      label: 'Completadas',
      value: respuestasCompletadas,
      helper: 'Últimas 50 respuestas',
      accent: 'green' as const,
    },
    {
      label: 'Conversión Promedio',
      value: `${conversionPromedio}%`,
      helper: 'Completados / Vistos',
      accent: 'purple' as const,
    },
  ];

  const viewTabs: Array<{ id: VistaFormularios; label: string; helper: string; icon: React.ReactElement }> = [
    { id: 'plantillas' as const, label: 'Plantillas', helper: 'Gestionar formularios', icon: <FileText className="h-4 w-4" /> },
    { id: 'respuestas' as const, label: 'Respuestas', helper: 'Ver completados', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'estadisticas' as const, label: 'Estadísticas', helper: 'Métricas y análisis', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formularios Clínicos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de plantillas y respuestas de formularios
          </p>
        </div>
        <Link href="/dashboard/formularios/nuevo">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <KPIGrid items={kpis} />

      {/* Tabs */}
      <PrimaryTabs
        tabs={viewTabs}
        current={vista}
        onChange={(id: VistaFormularios) => setVista(id)}
      />

      {/* Vista de Plantillas */}
      {vista === 'plantillas' && (
        <div className="space-y-4">
          {/* Filtros */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Búsqueda */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar formulario..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro por tipo */}
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value as TipoFormulario | 'todos')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {TIPOS_FORMULARIO.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por estado */}
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value as EstadoFormularioPlantilla | 'todos')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {ESTADOS_PLANTILLA.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Lista de Plantillas */}
          <div className="grid gap-4">
            {plantillasFiltradas.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {busqueda || tipoFilter !== 'todos' || estadoFilter !== 'todos'
                      ? 'No se encontraron formularios con los filtros aplicados'
                      : 'No hay plantillas de formularios. Crea la primera.'}
                  </p>
                </div>
              </Card>
            ) : (
              plantillasFiltradas.map((plantilla) => {
                const estadoConfig = ESTADOS_PLANTILLA.find(e => e.id === plantilla.estado) || ESTADOS_PLANTILLA[0];

                return (
                  <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {plantilla.nombre}
                          </h3>
                          <Badge tone={estadoConfig.tone}>
                            {estadoConfig.label}
                          </Badge>
                          <Badge tone="muted">
                            v{plantilla.version}
                          </Badge>
                        </div>

                        {plantilla.descripcion && (
                          <p className="text-sm text-gray-600 mb-3">
                            {plantilla.descripcion}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{plantilla.totalVistas} vistas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>{plantilla.totalRespuestas} respuestas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>{plantilla.tasaConversion.toFixed(1)}% conversión</span>
                          </div>
                          {plantilla.generaPDF && (
                            <div className="flex items-center gap-2 text-brand">
                              <FileText className="w-4 h-4" />
                              <span>Genera PDF</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 ml-4">
                        <Link href={`/dashboard/formularios/${plantilla.id}`}>
                          <Button variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/formularios/${plantilla.id}/editar`}>
                          <Button variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="outline">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Vista de Respuestas */}
      {vista === 'respuestas' && (
        <div className="space-y-4">
          {/* Filtros */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Búsqueda */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={busquedaRespuesta}
                    onChange={(e) => setBusquedaRespuesta(e.target.value)}
                    placeholder="Buscar paciente, NHC o formulario..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro por estado */}
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={estadoRespuestaFilter}
                  onChange={(e) => setEstadoRespuestaFilter(e.target.value as typeof estadoRespuestaFilter)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="borrador">Borrador</option>
                  <option value="completado">Completado</option>
                  <option value="validado">Validado</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Lista de Respuestas */}
          {respuestasFiltradas.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {busquedaRespuesta || estadoRespuestaFilter !== 'todos'
                    ? 'No se encontraron respuestas con los filtros aplicados'
                    : 'No hay respuestas de formularios. Las respuestas aparecerán aquí.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3">
              {respuestasFiltradas.map((respuesta) => {
                const estadoBadge = {
                  borrador: { label: 'Borrador', tone: 'warn' as const },
                  completado: { label: 'Completado', tone: 'success' as const },
                  validado: { label: 'Validado', tone: 'success' as const },
                  archivado: { label: 'Archivado', tone: 'muted' as const },
                }[respuesta.estado] || { label: 'Borrador', tone: 'warn' as const };

                return (
                  <Card key={respuesta.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{respuesta.pacienteNombre}</span>
                          {respuesta.pacienteNHC && (
                            <Badge tone="muted">NHC: {respuesta.pacienteNHC}</Badge>
                          )}
                          <Badge tone={estadoBadge.tone}>{estadoBadge.label}</Badge>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            <FileText className="w-4 h-4 inline mr-1" />
                            {respuesta.formularioNombre}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(respuesta.createdAt)}</span>
                          </div>
                          {respuesta.tiempoCompletado && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{Math.round(respuesta.tiempoCompletado)} min</span>
                            </div>
                          )}
                          {respuesta.pdfGenerado && (
                            <div className="flex items-center gap-1 text-brand">
                              <FileText className="w-4 h-4" />
                              <span>PDF generado</span>
                            </div>
                          )}
                          {respuesta.validadoPor && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Validado por {respuesta.validadoPorNombre}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 ml-4">
                        <Link href={`/dashboard/formularios/respuestas/${respuesta.id}`}>
                          <Button variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {respuesta.pdfUrl && (
                          <a href={respuesta.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Contador */}
          {respuestasFiltradas.length > 0 && (
            <div className="text-center text-sm text-gray-500">
              Mostrando {respuestasFiltradas.length} de {initialRespuestas.length} respuestas
            </div>
          )}
        </div>
      )}

      {/* Vista de Estadísticas */}
      {vista === 'estadisticas' && (
        <Card>
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Estadísticas detalladas en desarrollo
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Gráficos y análisis de uso de formularios
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
