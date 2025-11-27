'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { EvaluacionSesion, ServicioAsignado, Profesional, GrupoPaciente } from '@/types';
import { Plus, Star, AlertCircle, User } from 'lucide-react';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';
import { useSupervisionModule, useCreateEvaluacion } from '@/lib/hooks/useSupervisionModule';

interface SupervisionClientProps {
  evaluaciones: EvaluacionSesion[];
  servicios: ServicioAsignado[];
  profesionales: Profesional[];
  grupos: GrupoPaciente[];
}

export default function SupervisionClient(initialData: SupervisionClientProps) {
  const { user } = useAuth();
  const initialModule = useMemo(() => initialData, [initialData]);
  const { data: moduleData = initialModule } = useSupervisionModule({ initialData: initialModule });
  const createEvaluacion = useCreateEvaluacion();

  const evaluaciones = moduleData.evaluaciones;
  const servicios = moduleData.servicios;
  const profesionales = moduleData.profesionales;
  const grupos = moduleData.grupos;
  const [vistaActual, setVistaActual] = useState<'nueva' | 'dashboard' | 'profesional'>('dashboard');
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<string | null>(null);
  const [busquedaProfesional, setBusquedaProfesional] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<'todos' | Profesional['especialidad']>('todos');

  const [formData, setFormData] = useState({
    servicioId: '',
    profesionalId: '',
    grupoId: '',
    paciente: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '',
    horaFin: '',
    tiempoEstimado: 45,
    tiempoReal: 45,
    aplicacionProtocolo: 5,
    manejoPaciente: 5,
    usoEquipamiento: 5,
    comunicacion: 5,
    dolorPostTratamiento: 0,
    confortDuranteSesion: 5,
    resultadoPercibido: 5,
    protocoloSeguido: true,
    observaciones: '',
    mejorasSugeridas: '',
    fortalezasObservadas: '',
  });

  // Crear evaluación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const servicio = servicios.find(s => s.id === formData.servicioId);
    const profesional = profesionales.find(p => p.id === formData.profesionalId);
    const grupo = grupos.find(g => g.id === formData.grupoId);

    if (!servicio || !profesional || !grupo) {
      alert('Faltan datos obligatorios');
      return;
    }

    try {
      const sanitizedForm = {
        ...formData,
        paciente: formData.paciente ? sanitizeInput(formData.paciente) : '',
        observaciones: formData.observaciones ? sanitizeHTML(formData.observaciones) : '',
        mejorasSugeridas: formData.mejorasSugeridas ? sanitizeHTML(formData.mejorasSugeridas) : '',
        fortalezasObservadas: formData.fortalezasObservadas
          ? sanitizeHTML(formData.fortalezasObservadas)
          : '',
      };

      await createEvaluacion.mutateAsync({
        servicioId: servicio.id,
        servicioNombre: servicio.catalogoServicioNombre,
        grupoId: grupo.id,
        grupoNombre: grupo.nombre,
        paciente: sanitizedForm.paciente,
        profesionalId: profesional.id,
        profesionalNombre: `${profesional.nombre} ${profesional.apellidos}`,
        fecha: sanitizedForm.fecha,
        horaInicio: sanitizedForm.horaInicio,
        horaFin: sanitizedForm.horaFin,
        tiempoEstimado: sanitizedForm.tiempoEstimado,
        tiempoReal: sanitizedForm.tiempoReal,
        aplicacionProtocolo: sanitizedForm.aplicacionProtocolo,
        manejoPaciente: sanitizedForm.manejoPaciente,
        usoEquipamiento: sanitizedForm.usoEquipamiento,
        comunicacion: sanitizedForm.comunicacion,
        dolorPostTratamiento: sanitizedForm.dolorPostTratamiento,
        confortDuranteSesion: sanitizedForm.confortDuranteSesion,
        resultadoPercibido: sanitizedForm.resultadoPercibido,
        protocoloSeguido: sanitizedForm.protocoloSeguido,
        observaciones: sanitizedForm.observaciones,
        mejorasSugeridas: sanitizedForm.mejorasSugeridas,
        fortalezasObservadas: sanitizedForm.fortalezasObservadas,
      });

      // Reset
      setFormData({
        servicioId: '',
        profesionalId: '',
        grupoId: '',
        paciente: '',
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: '',
        horaFin: '',
        tiempoEstimado: 45,
        tiempoReal: 45,
        aplicacionProtocolo: 5,
        manejoPaciente: 5,
        usoEquipamiento: 5,
        comunicacion: 5,
        dolorPostTratamiento: 0,
        confortDuranteSesion: 5,
        resultadoPercibido: 5,
        protocoloSeguido: true,
        observaciones: '',
        mejorasSugeridas: '',
        fortalezasObservadas: '',
      });
      
      setVistaActual('dashboard');
      alert('✅ Evaluación guardada correctamente');
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar evaluación');
    }
  };

  // Calcular estadísticas por profesional
  const calcularEstadisticasProfesional = (profesionalId: string) => {
    const evalsProfesional = evaluaciones.filter(e => e.profesionalId === profesionalId);
    
    if (evalsProfesional.length === 0) {
      return {
        totalEvaluaciones: 0,
        promedioGeneral: 0,
        promedioAplicacionProtocolo: 0,
        promedioManejoPaciente: 0,
        promedioUsoEquipamiento: 0,
        promedioComunicacion: 0,
        promedioSatisfaccionPaciente: 0,
        puntualidad: 0,
        desviacionTiempoPromedio: 0,
        cumplimientoProtocolos: 0,
      };
    }

    const totalEvals = evalsProfesional.length;
    
    const promedioAplicacionProtocolo = evalsProfesional.reduce((acc, e) => acc + e.aplicacionProtocolo, 0) / totalEvals;
    const promedioManejoPaciente = evalsProfesional.reduce((acc, e) => acc + e.manejoPaciente, 0) / totalEvals;
    const promedioUsoEquipamiento = evalsProfesional.reduce((acc, e) => acc + e.usoEquipamiento, 0) / totalEvals;
    const promedioComunicacion = evalsProfesional.reduce((acc, e) => acc + e.comunicacion, 0) / totalEvals;
    
    const promedioGeneral = (promedioAplicacionProtocolo + promedioManejoPaciente + promedioUsoEquipamiento + promedioComunicacion) / 4;
    
    const promedioSatisfaccionPaciente = evalsProfesional.reduce((acc, e) => acc + e.resultadoPercibido, 0) / totalEvals;
    
    const desviacionTiempoPromedio = evalsProfesional.reduce((acc, e) => acc + (e.tiempoReal - e.tiempoEstimado), 0) / totalEvals;
    
    const puntualidad = (evalsProfesional.filter(e => e.tiempoReal <= e.tiempoEstimado + 10).length / totalEvals) * 100;
    
    const cumplimientoProtocolos = (evalsProfesional.filter(e => e.protocoloSeguido).length / totalEvals) * 100;

    return {
      totalEvaluaciones: totalEvals,
      promedioGeneral: Number(promedioGeneral.toFixed(2)),
      promedioAplicacionProtocolo: Number(promedioAplicacionProtocolo.toFixed(2)),
      promedioManejoPaciente: Number(promedioManejoPaciente.toFixed(2)),
      promedioUsoEquipamiento: Number(promedioUsoEquipamiento.toFixed(2)),
      promedioComunicacion: Number(promedioComunicacion.toFixed(2)),
      promedioSatisfaccionPaciente: Number(promedioSatisfaccionPaciente.toFixed(2)),
      puntualidad: Number(puntualidad.toFixed(1)),
      desviacionTiempoPromedio: Number(desviacionTiempoPromedio.toFixed(1)),
      cumplimientoProtocolos: Number(cumplimientoProtocolos.toFixed(1)),
    };
  };

  // Métricas globales
  const metricas = useMemo(() => ({
    totalEvaluaciones: evaluaciones.length,
    cumplimientoProtocolos: evaluaciones.length > 0
      ? ((evaluaciones.filter((e) => e.protocoloSeguido).length / evaluaciones.length) * 100).toFixed(1)
      : 0,
    satisfaccionPromedio: evaluaciones.length > 0
      ? (evaluaciones.reduce((acc, e) => acc + e.resultadoPercibido, 0) / evaluaciones.length).toFixed(1)
      : 0,
    puntualidadPromedio: evaluaciones.length > 0
      ? ((evaluaciones.filter((e) => e.tiempoReal <= e.tiempoEstimado + 10).length / evaluaciones.length) * 100).toFixed(1)
      : 0,
    alertasTiempoExcedido: evaluaciones.filter((e) => e.tiempoReal > e.tiempoEstimado + 15).length,
    alertasSatisfaccionBaja: evaluaciones.filter((e) => e.resultadoPercibido < 3).length,
  }), [evaluaciones]);

  const supervisionKpis = useMemo(
    () => [
      {
        id: 'total',
        label: 'Evaluaciones',
        value: metricas.totalEvaluaciones,
        helper: 'Registradas',
        accent: 'brand' as const,
      },
      {
        id: 'protocolos',
        label: 'Cumplimiento protocolos',
        value: `${metricas.cumplimientoProtocolos}%`,
        helper: 'Sesiones alineadas',
        accent: 'green' as const,
      },
      {
        id: 'satisfaccion',
        label: 'Satisfacción',
        value: `${metricas.satisfaccionPromedio}/5`,
        helper: 'Promedio pacientes',
        accent: 'purple' as const,
      },
      {
        id: 'puntualidad',
        label: 'Puntualidad',
        value: `${metricas.puntualidadPromedio}%`,
        helper: 'Sesiones a tiempo',
        accent: 'blue' as const,
      },
    ],
    [metricas]
  );

  const profesionalesFiltrados = useMemo(() => {
    return profesionales.filter((prof) => {
      const matchesEspecialidad = filtroEspecialidad === 'todos' || prof.especialidad === filtroEspecialidad;
      const search = busquedaProfesional.trim().toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        prof.nombre.toLowerCase().includes(search) ||
        prof.apellidos.toLowerCase().includes(search) ||
        (prof.email ?? '').toLowerCase().includes(search);
      return matchesEspecialidad && matchesSearch;
    });
  }, [profesionales, filtroEspecialidad, busquedaProfesional]);

  const supervisionFilters: ActiveFilterChip[] = [];
  if (busquedaProfesional.trim()) {
    supervisionFilters.push({
      id: 'busqueda',
      label: 'Búsqueda',
      value: busquedaProfesional,
      onRemove: () => setBusquedaProfesional(''),
    });
  }
  if (filtroEspecialidad !== 'todos') {
    supervisionFilters.push({
      id: 'especialidad',
      label: 'Especialidad',
      value: filtroEspecialidad,
      onRemove: () => setFiltroEspecialidad('todos'),
    });
  }

  const resetSupervisionFilters = () => {
    setBusquedaProfesional('');
    setFiltroEspecialidad('todos');
  };

  // Renderizar estrellas
  const renderEstrellas = (valor: number, onChange?: (valor: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            className={`${onChange ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= valor 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Barra de progreso
  const renderBarraProgreso = (valor: number, maximo: number = 5, color: string = 'blue') => {
    const porcentaje = (valor / maximo) * 100;
    const colorClasses = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      yellow: 'bg-yellow-600',
      red: 'bg-red-600',
    };

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    );
  };

  // Componente Vista Profesional
  const VistaProfesional = () => {
    if (!profesionalSeleccionado) return null;
    
    const prof = profesionales.find(p => p.id === profesionalSeleccionado);
    const stats = calcularEstadisticasProfesional(profesionalSeleccionado);
    const evalsProfesional = evaluaciones.filter(e => e.profesionalId === profesionalSeleccionado);

    if (!prof) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setVistaActual('dashboard')}
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
        >
          <span>← Volver al Dashboard</span>
        </button>

        {/* Header del profesional */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {prof.nombre} {prof.apellidos}
                </h2>
                <p className="text-gray-600">{prof.especialidad}</p>
                <p className="text-sm text-gray-500">{prof.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Evaluación Promedio</p>
              <p className="text-4xl font-bold text-blue-600">{stats.promedioGeneral}/5</p>
              <p className="text-sm text-gray-500">{stats.totalEvaluaciones} evaluaciones</p>
            </div>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        {stats.totalEvaluaciones > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">Cumplimiento Protocolos</p>
                <p className="text-3xl font-bold text-green-600">{stats.cumplimientoProtocolos}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">Puntualidad</p>
                <p className="text-3xl font-bold text-blue-600">{stats.puntualidad}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">Satisfacción Pacientes</p>
                <p className="text-3xl font-bold text-purple-600">{stats.promedioSatisfaccionPaciente}/5</p>
              </div>
            </div>

            {/* Habilidades evaluadas */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Habilidades Evaluadas</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Técnica / Aplicación Protocolo</span>
                    <span className="text-sm font-bold text-gray-900">{stats.promedioAplicacionProtocolo}/5</span>
                  </div>
                  {renderBarraProgreso(stats.promedioAplicacionProtocolo, 5, 'blue')}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Manejo del Paciente</span>
                    <span className="text-sm font-bold text-gray-900">{stats.promedioManejoPaciente}/5</span>
                  </div>
                  {renderBarraProgreso(stats.promedioManejoPaciente, 5, 'green')}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Uso de Equipamiento</span>
                    <span className="text-sm font-bold text-gray-900">{stats.promedioUsoEquipamiento}/5</span>
                  </div>
                  {renderBarraProgreso(stats.promedioUsoEquipamiento, 5, 'yellow')}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Comunicación</span>
                    <span className="text-sm font-bold text-gray-900">{stats.promedioComunicacion}/5</span>
                  </div>
                  {renderBarraProgreso(stats.promedioComunicacion, 5, 'blue')}
                </div>
              </div>
            </div>

            {/* Fortalezas y áreas de mejora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-3">💪 Fortalezas</h3>
                <ul className="space-y-2">
                  {stats.promedioComunicacion >= 4.5 && (
                    <li className="text-sm text-green-700">• Excelente comunicación con pacientes</li>
                  )}
                  {stats.promedioManejoPaciente >= 4.5 && (
                    <li className="text-sm text-green-700">• Gran manejo y empatía con pacientes</li>
                  )}
                  {stats.promedioAplicacionProtocolo >= 4.5 && (
                    <li className="text-sm text-green-700">• Dominio técnico excepcional</li>
                  )}
                  {stats.cumplimientoProtocolos >= 95 && (
                    <li className="text-sm text-green-700">• Excelente adherencia a protocolos</li>
                  )}
                  {stats.puntualidad >= 95 && (
                    <li className="text-sm text-green-700">• Muy buen manejo de tiempos</li>
                  )}
                </ul>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">🎯 Áreas de Mejora</h3>
                <ul className="space-y-2">
                  {stats.promedioUsoEquipamiento < 4.5 && (
                    <li className="text-sm text-yellow-700">• Optimizar uso de equipamiento</li>
                  )}
                  {stats.puntualidad < 90 && (
                    <li className="text-sm text-yellow-700">• Mejorar gestión de tiempos</li>
                  )}
                  {stats.cumplimientoProtocolos < 95 && (
                    <li className="text-sm text-yellow-700">• Reforzar seguimiento de protocolos</li>
                  )}
                  {stats.promedioGeneral < 4.0 && (
                    <li className="text-sm text-yellow-700">• Revisar técnica general</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Historial de evaluaciones */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Historial de Evaluaciones</h3>
              <div className="space-y-3">
                {evalsProfesional.slice(0, 10).map((evaluacion) => (
                  <div key={evaluacion.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{evaluacion.servicioNombre}</h4>
                        <p className="text-sm text-gray-600">{evaluacion.paciente}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {evaluacion.fecha.toLocaleDateString('es-ES')} - {evaluacion.horaInicio}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">
                            {((evaluacion.aplicacionProtocolo + evaluacion.manejoPaciente + evaluacion.usoEquipamiento + evaluacion.comunicacion) / 4).toFixed(1)}
                          </span>
                        </div>
                        {!evaluacion.protocoloSeguido && (
                          <p className="text-xs text-red-600 mt-1">⚠️ Protocolo no seguido</p>
                        )}
                      </div>
                    </div>
                    {evaluacion.fortalezasObservadas && (
                      <p className="text-sm text-green-700 mt-2">💪 {evaluacion.fortalezasObservadas}</p>
                    )}
                    {evaluacion.mejorasSugeridas && (
                      <p className="text-sm text-yellow-700 mt-1">🎯 {evaluacion.mejorasSugeridas}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No hay evaluaciones registradas para este profesional</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏥 Supervisión Clínica</h1>
          <p className="text-gray-600 mt-1">Control de calidad asistencial y desarrollo profesional</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setVistaActual('dashboard')}
            className={`px-4 py-2 rounded-lg ${
              vistaActual === 'dashboard' 
                ? 'bg-blue-600 text-text' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setVistaActual('nueva')}
            className="flex items-center space-x-2 bg-green-600 text-text px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Evaluación</span>
          </button>
        </div>
      </div>

      {/* Vista Dashboard */}
      {vistaActual === 'dashboard' && (
        <div className="space-y-6">
          {/* Métricas clave */}
          <KPIGrid items={supervisionKpis} />

          {/* Alertas */}
          {(metricas.alertasTiempoExcedido > 0 || metricas.alertasSatisfaccionBaja > 0) && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Alertas de Calidad</h3>
                  <div className="mt-2 text-sm text-yellow-700 space-y-1">
                    {metricas.alertasTiempoExcedido > 0 && (
                      <p>• {metricas.alertasTiempoExcedido} sesión(es) con tiempo excedido esta semana</p>
                    )}
                    {metricas.alertasSatisfaccionBaja > 0 && (
                      <p>• {metricas.alertasSatisfaccionBaja} caso(s) con satisfacción baja (revisar)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <CompactFilters
            search={{
              value: busquedaProfesional,
              onChange: setBusquedaProfesional,
              placeholder: 'Buscar profesional o correo',
            }}
            selects={[
              {
                id: 'especialidad',
                label: 'Especialidad',
                value: filtroEspecialidad,
                onChange: (value) => setFiltroEspecialidad(value as typeof filtroEspecialidad),
                options: [
                  { value: 'todos', label: 'Todas las especialidades' },
                  { value: 'medicina', label: 'Medicina' },
                  { value: 'fisioterapia', label: 'Fisioterapia' },
                  { value: 'enfermeria', label: 'Enfermería' },
                ],
              },
            ]}
            activeFilters={supervisionFilters}
            onClear={supervisionFilters.length ? resetSupervisionFilters : undefined}
          />

          {/* Rendimiento por profesional */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Rendimiento por Profesional</h2>
            <div className="space-y-4">
              {profesionalesFiltrados.map((prof) => {
                const stats = calcularEstadisticasProfesional(prof.id);
                
                return (
                  <div 
                    key={prof.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setProfesionalSeleccionado(prof.id);
                      setVistaActual('profesional');
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-8 h-8 text-gray-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{prof.nombre} {prof.apellidos}</h3>
                          <p className="text-sm text-gray-500">{prof.especialidad}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{stats.promedioGeneral}/5</p>
                        <p className="text-xs text-gray-500">{stats.totalEvaluaciones} evaluaciones</p>
                      </div>
                    </div>
                    
                    {stats.totalEvaluaciones > 0 && (
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Técnica</p>
                          {renderBarraProgreso(stats.promedioAplicacionProtocolo)}
                          <p className="text-xs text-gray-500 mt-1">{stats.promedioAplicacionProtocolo}/5</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Manejo</p>
                          {renderBarraProgreso(stats.promedioManejoPaciente)}
                          <p className="text-xs text-gray-500 mt-1">{stats.promedioManejoPaciente}/5</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Equipamiento</p>
                          {renderBarraProgreso(stats.promedioUsoEquipamiento)}
                          <p className="text-xs text-gray-500 mt-1">{stats.promedioUsoEquipamiento}/5</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Comunicación</p>
                          {renderBarraProgreso(stats.promedioComunicacion)}
                          <p className="text-xs text-gray-500 mt-1">{stats.promedioComunicacion}/5</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Últimas evaluaciones */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Últimas Evaluaciones</h2>
            {evaluaciones.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay evaluaciones registradas</p>
            ) : (
              <div className="space-y-3">
                {evaluaciones.slice(0, 5).map((evaluacion) => (
                  <div key={evaluacion.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{evaluacion.servicioNombre}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {evaluacion.profesionalNombre}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {evaluacion.grupoNombre} - {evaluacion.paciente}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {evaluacion.fecha.toLocaleDateString('es-ES')} - {evaluacion.horaInicio}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-lg">
                            {((evaluacion.aplicacionProtocolo + evaluacion.manejoPaciente + evaluacion.usoEquipamiento + evaluacion.comunicacion) / 4).toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Satisfacción: {evaluacion.resultadoPercibido}/5</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista Nueva Evaluación */}
      {vistaActual === 'nueva' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-6">📝 Nueva Evaluación de Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Sesión</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servicio *</label>
                  <select
                    value={formData.servicioId}
                    onChange={(e) => {
                      const servicio = servicios.find(s => s.id === e.target.value);
                      setFormData({
                        ...formData, 
                        servicioId: e.target.value,
                        tiempoEstimado: servicio?.tiempoReal || 45,
                        tiempoReal: servicio?.tiempoReal || 45,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar servicio...</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.catalogoServicioNombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profesional *</label>
                  <select
                    value={formData.profesionalId}
                    onChange={(e) => setFormData({...formData, profesionalId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar profesional...</option>
                    {profesionales.map(prof => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nombre} {prof.apellidos} - {prof.especialidad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                  <select
                    value={formData.grupoId}
                    onChange={(e) => setFormData({...formData, grupoId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar grupo...</option>
                    {grupos.map(grupo => (
                      <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                  <input
                    type="text"
                    value={formData.paciente}
                    onChange={(e) => setFormData({...formData, paciente: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nombre del paciente"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={formData.horaFin}
                      onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tiempos */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Tiempos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo Estimado (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.tiempoEstimado}
                    onChange={(e) => setFormData({...formData, tiempoEstimado: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo Real (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.tiempoReal}
                    onChange={(e) => setFormData({...formData, tiempoReal: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
              </div>
              {formData.tiempoReal > formData.tiempoEstimado + 10 && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Tiempo excedido en {formData.tiempoReal - formData.tiempoEstimado} minutos
                </p>
              )}
            </div>

            {/* Evaluación de técnica y habilidad */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Técnica y Habilidad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Aplicación de Protocolo</label>
                  {renderEstrellas(formData.aplicacionProtocolo, (val) => 
                    setFormData({...formData, aplicacionProtocolo: val})
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Manejo del Paciente</label>
                  {renderEstrellas(formData.manejoPaciente, (val) => 
                    setFormData({...formData, manejoPaciente: val})
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Uso de Equipamiento</label>
                  {renderEstrellas(formData.usoEquipamiento, (val) => 
                    setFormData({...formData, usoEquipamiento: val})
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Comunicación</label>
                  {renderEstrellas(formData.comunicacion, (val) => 
                    setFormData({...formData, comunicacion: val})
                  )}
                </div>
              </div>
            </div>

            {/* Satisfacción del paciente */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">😊 Satisfacción del Paciente</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dolor Post-Tratamiento (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.dolorPostTratamiento}
                    onChange={(e) => setFormData({...formData, dolorPostTratamiento: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Sin dolor</span>
                    <span className="font-bold text-lg">{formData.dolorPostTratamiento}</span>
                    <span>Máximo dolor</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Confort Durante Sesión</label>
                  {renderEstrellas(formData.confortDuranteSesion, (val) => 
                    setFormData({...formData, confortDuranteSesion: val})
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Resultado Percibido</label>
                  {renderEstrellas(formData.resultadoPercibido, (val) => 
                    setFormData({...formData, resultadoPercibido: val})
                  )}
                </div>
              </div>
            </div>

            {/* Protocolo y observaciones */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="protocolo"
                  checked={formData.protocoloSeguido}
                  onChange={(e) => setFormData({...formData, protocoloSeguido: e.target.checked})}
                  className="w-4 h-4 mr-2"
                />
                <label htmlFor="protocolo" className="text-sm font-medium text-gray-700">
                  ✅ Protocolo seguido correctamente
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fortalezas Observadas</label>
                <textarea
                  value={formData.fortalezasObservadas}
                  onChange={(e) => setFormData({...formData, fortalezasObservadas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="¿Qué hizo especialmente bien?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mejoras Sugeridas</label>
                <textarea
                  value={formData.mejorasSugeridas}
                  onChange={(e) => setFormData({...formData, mejorasSugeridas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="¿Qué podría mejorar?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Generales</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Cualquier otra observación relevante..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-text px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                ✅ Guardar Evaluación
              </button>
              <button
                type="button"
                onClick={() => setVistaActual('dashboard')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vista Detalle Profesional */}
      {vistaActual === 'profesional' && <VistaProfesional />}
    </div>
  );
}
