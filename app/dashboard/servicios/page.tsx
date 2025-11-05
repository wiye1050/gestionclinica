/* eslint-disable react/no-unescaped-entities */
'use client';

import { Suspense, lazy, useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
  useServicios, 
  useProfesionales, 
  useGruposPacientes, 
  useCatalogoServicios 
} from '@/lib/hooks/useQueries';
import { Plus, Filter, Users, UserCheck, CheckSquare, Square, Trash2 } from 'lucide-react';
import { LoadingTable } from '@/components/ui/Loading';

// Lazy loading del componente de exportación
const ExportButton = lazy(() => import('@/components/ui/ExportButton').then(m => ({ default: m.ExportButton })));

type TiquetValue = 'SI' | 'NO' | 'CORD' | 'ESPACH';

type NuevoServicioForm = {
  catalogoServicioId: string;
  grupoId: string;
  tiquet: TiquetValue;
  profesionalPrincipalId: string;
  profesionalSegundaOpcionId: string;
  profesionalTerceraOpcionId: string;
  requiereApoyo: boolean;
  sala: string;
  supervision: boolean;
  esActual: boolean;
};

function ServiciosSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-3xl border border-border bg-card"></div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl border border-border bg-card"></div>)}
      </div>
      <LoadingTable rows={8} />
    </div>
  );
}

function ServiciosContent() {
  const { user } = useAuth();
  
  // React Query hooks - caché automático
  const { data: servicios = [], isLoading: loadingServicios } = useServicios();
  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionales();
  const { data: grupos = [], isLoading: loadingGrupos } = useGruposPacientes();
  const { data: catalogoServicios = [], isLoading: loadingCatalogo } = useCatalogoServicios();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Estado del formulario
  const [nuevoServicio, setNuevoServicio] = useState<NuevoServicioForm>({
    catalogoServicioId: '',
    grupoId: '',
    tiquet: 'NO',
    profesionalPrincipalId: '',
    profesionalSegundaOpcionId: '',
    profesionalTerceraOpcionId: '',
    requiereApoyo: false,
    sala: '',
    supervision: false,
    esActual: false,
  });

  const loading = loadingServicios || loadingProfesionales || loadingGrupos || loadingCatalogo;

  // Crear servicio
  const handleCrearServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const catalogoServicio = catalogoServicios.find(s => s.id === nuevoServicio.catalogoServicioId);
    const grupo = grupos.find(g => g.id === nuevoServicio.grupoId);
    const profPrincipal = profesionales.find(p => p.id === nuevoServicio.profesionalPrincipalId);
    const profSegunda = profesionales.find(p => p.id === nuevoServicio.profesionalSegundaOpcionId);
    const profTercera = profesionales.find(p => p.id === nuevoServicio.profesionalTerceraOpcionId);

    if (!catalogoServicio || !grupo || !profPrincipal) {
      alert('Faltan datos obligatorios');
      return;
    }

    try {
      await addDoc(collection(db, 'servicios-asignados'), {
        catalogoServicioId: catalogoServicio.id,
        catalogoServicioNombre: catalogoServicio.nombre,
        grupoId: grupo.id,
        grupoNombre: grupo.nombre,
        esActual: nuevoServicio.esActual,
        estado: 'activo',
        tiquet: nuevoServicio.tiquet,
        profesionalPrincipalId: profPrincipal.id,
        profesionalPrincipalNombre: `${profPrincipal.nombre} ${profPrincipal.apellidos}`,
        profesionalSegundaOpcionId: nuevoServicio.profesionalSegundaOpcionId || null,
        profesionalSegundaOpcionNombre: profSegunda ? `${profSegunda.nombre} ${profSegunda.apellidos}` : '',
        profesionalTerceraOpcionId: nuevoServicio.profesionalTerceraOpcionId || null,
        profesionalTerceraOpcionNombre: profTercera ? `${profTercera.nombre} ${profTercera.apellidos}` : '',
        requiereApoyo: nuevoServicio.requiereApoyo || catalogoServicio.requiereApoyo,
        sala: nuevoServicio.sala || catalogoServicio.salaPredeterminada || '',
        tiempoReal: catalogoServicio.tiempoEstimado,
        supervision: nuevoServicio.supervision || catalogoServicio.requiereSupervision,
        vecesRealizadoMes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creadoPor: user.email,
      });

      // Reset form
      setNuevoServicio({
        catalogoServicioId: '',
        grupoId: '',
        tiquet: 'NO',
        profesionalPrincipalId: '',
        profesionalSegundaOpcionId: '',
        profesionalTerceraOpcionId: '',
        requiereApoyo: false,
        sala: '',
        supervision: false,
        esActual: false,
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al crear servicio:', error);
    }
  };

  // Cambiar checkbox "ACTUAL"
  const toggleActual = async (servicioId: string, valorActual: boolean) => {
    try {
      await updateDoc(doc(db, 'servicios-asignados', servicioId), {
        esActual: !valorActual,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  // Actualizar tiquet
  const actualizarTiquet = async (servicioId: string, nuevoTiquet: string) => {
    try {
      await updateDoc(doc(db, 'servicios-asignados', servicioId), {
        tiquet: nuevoTiquet,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al actualizar tiquet:', error);
    }
  };

  // Actualizar profesional
  const actualizarProfesional = async (servicioId: string, campo: string, profesionalId: string) => {
    const prof = profesionales.find(p => p.id === profesionalId);
    const nombreCompleto = prof ? `${prof.nombre} ${prof.apellidos}` : '';
    
    try {
      await updateDoc(doc(db, 'servicios-asignados', servicioId), {
        [campo]: profesionalId,
        [`${campo}Nombre`]: nombreCompleto,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al actualizar profesional:', error);
    }
  };

  // Eliminar servicio
  const eliminarServicio = async (servicioId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    
    try {
      await deleteDoc(doc(db, 'servicios-asignados', servicioId));
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  // Filtrar servicios (memoizado para rendimiento)
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(servicio => {
      const cumpleGrupo = filtroGrupo === 'todos' || servicio.grupoId === filtroGrupo;
      const cumpleEstado = filtroEstado === 'todos' || servicio.tiquet === filtroEstado;
      return cumpleGrupo && cumpleEstado;
    });
  }, [servicios, filtroGrupo, filtroEstado]);

  // Obtener color del tiquet
  const getColorTiquet = (tiquet: string) => {
    switch (tiquet) {
      case 'SI':
        return 'bg-success-bg text-success';
      case 'NO':
        return 'bg-danger-bg text-danger';
      case 'CORD':
        return 'bg-warn-bg text-warn';
      case 'ESPACH':
        return 'bg-brand-subtle text-brand';
      default:
        return 'bg-cardHover text-text-muted';
    }
  };

  // Datos para exportar
  const exportData = useMemo(() => serviciosFiltrados.map(servicio => ({
    'Servicio': servicio.catalogoServicioNombre,
    'Grupo': servicio.grupoNombre,
    'Actual': servicio.esActual ? 'Sí' : 'No',
    'Tiquet': servicio.tiquet,
    'Profesional Principal': servicio.profesionalPrincipalNombre,
    'Segunda Opción': servicio.profesionalSegundaOpcionNombre || '-',
    'Tercera Opción': servicio.profesionalTerceraOpcionNombre || '-',
    'Sala': servicio.sala || '-',
    'Tiempo': servicio.tiempoReal ? `${servicio.tiempoReal} min` : '-',
    'Requiere Apoyo': servicio.requiereApoyo ? 'Sí' : 'No',
    'Supervisión': servicio.supervision ? 'Sí' : 'No',
  })), [serviciosFiltrados]);

  const exportColumns = [
    { header: 'Servicio', key: 'Servicio', width: 30 },
    { header: 'Grupo', key: 'Grupo', width: 25 },
    { header: 'Actual', key: 'Actual', width: 8 },
    { header: 'Tiquet', key: 'Tiquet', width: 10 },
    { header: 'Profesional Principal', key: 'Profesional Principal', width: 25 },
    { header: 'Segunda Opción', key: 'Segunda Opción', width: 25 },
    { header: 'Tercera Opción', key: 'Tercera Opción', width: 25 },
    { header: 'Sala', key: 'Sala', width: 15 },
    { header: 'Tiempo', key: 'Tiempo', width: 10 },
    { header: 'Requiere Apoyo', key: 'Requiere Apoyo', width: 15 },
    { header: 'Supervisión', key: 'Supervisión', width: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-text">Servicios asignados</h1>
          <p className="mt-1 text-sm text-text-muted">Asignación de servicios del catálogo a grupos específicos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-pill border border-border bg-card" />}>
            <ExportButton
              data={exportData}
              columns={exportColumns}
              filename={`Servicios_Asignados_${new Date().toISOString().split('T')[0]}`}
              format="excel"
              disabled={loading}
            />
          </Suspense>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="inline-flex items-center gap-2 rounded-pill bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:focus-ring"
          >
            <Plus className="w-5 h-5" />
            <span>Asignar Servicio</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand" />
            <p className="text-sm text-text-muted">Total servicios</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-text">{loading ? '—' : servicios.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            <p className="text-sm text-text-muted">Grupos activos</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-text">{loading ? '—' : grupos.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-success" />
            <p className="text-sm text-text-muted">Profesionales</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-text">{loading ? '—' : profesionales.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-warn" />
            <p className="text-sm text-text-muted">Actuales</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-text">
            {loading ? '—' : servicios.filter(s => s.esActual).length}
          </p>
        </div>
      </div>

      {/* Aviso si faltan datos */}
      {!loading && (catalogoServicios.length === 0 || grupos.length === 0 || profesionales.length === 0) && (
        <div className="rounded-2xl border border-warn bg-warn-bg p-4">
          <p className="font-medium text-warn">⚠️ Faltan datos necesarios:</p>
          <ul className="mt-2 space-y-1 text-sm text-warn">
            {catalogoServicios.length === 0 && <li>• Crea servicios en el Catálogo de Servicios</li>}
            {profesionales.length === 0 && <li>• Añade profesionales en la sección Profesionales</li>}
            {grupos.length === 0 && <li>• Crea grupos de pacientes</li>}
          </ul>
        </div>
      )}

      {/* Formulario Asignar Servicio */}
      {mostrarFormulario && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-text">Asignar servicio a grupo</h2>
          <form onSubmit={handleCrearServicio} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Servicio del Catálogo *</label>
                <select
                  value={nuevoServicio.catalogoServicioId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, catalogoServicioId: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-text"
                  required
                >
                  <option value="">Seleccionar servicio...</option>
                  {catalogoServicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} ({servicio.tiempoEstimado} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Grupo *</label>
                <select
                  value={nuevoServicio.grupoId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, grupoId: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                  required
                >
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Tiquet CRM</label>
                <select
                  value={nuevoServicio.tiquet}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, tiquet: e.target.value as TiquetValue})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                >
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="CORD">CORD</option>
                  <option value="ESPACH">ESPACH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Citar con (Principal) *</label>
                <select
                  value={nuevoServicio.profesionalPrincipalId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, profesionalPrincipalId: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                  required
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionales.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} {prof.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Segunda Opción</label>
                <select
                  value={nuevoServicio.profesionalSegundaOpcionId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, profesionalSegundaOpcionId: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionales.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} {prof.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Tercera Opción</label>
                <select
                  value={nuevoServicio.profesionalTerceraOpcionId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, profesionalTerceraOpcionId: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionales.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} {prof.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Sala (opcional)</label>
                <input
                  type="text"
                  value={nuevoServicio.sala}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, sala: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                  placeholder="Sobreescribir sala predeterminada"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={nuevoServicio.esActual}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, esActual: e.target.checked})}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm text-text">Es actual</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={nuevoServicio.requiereApoyo}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, requiereApoyo: e.target.checked})}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm text-text">Requiere apoyo</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={nuevoServicio.supervision}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, supervision: e.target.checked})}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm text-text">Supervisión</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-pill bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:focus-ring">
                Asignar Servicio
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="rounded-pill border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-cardHover focus-visible:focus-ring"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-muted" />
            <span className="text-sm font-medium text-text">Filtros:</span>
          </div>
          
          <select
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            className="rounded-pill border border-border bg-card px-3 py-1 text-sm text-text focus-visible:focus-ring"
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map(grupo => (
              <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-pill border border-border bg-card px-3 py-1 text-sm text-text focus-visible:focus-ring"
          >
            <option value="todos">Todos los tickets</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="CORD">CORD</option>
            <option value="ESPACH">ESPACH</option>
          </select>
        </div>
      </div>

      {/* Tabla de Servicios */}
      {loading ? (
        <LoadingTable rows={10} />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-cardHover">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Servicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Grupo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Tiquet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Citar con</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">2ª Opción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">3ª Opción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Apoyo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Sala</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Tiempo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {serviciosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-text-muted">
                      No hay servicios asignados. Usa el botón "Asignar Servicio"
                    </td>
                  </tr>
                ) : (
                  serviciosFiltrados.map((servicio) => (
                    <tr key={servicio.id} className="hover:bg-cardHover">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActual(servicio.id, servicio.esActual)}
                          className="text-text-muted hover:text-brand"
                        >
                          {servicio.esActual ? (
                            <CheckSquare className="h-5 w-5 text-brand" />
                          ) : (
                            <Square className="h-5 w-5 text-text-muted" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {servicio.catalogoServicioNombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {servicio.grupoNombre}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={servicio.tiquet}
                          onChange={(e) => actualizarTiquet(servicio.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium ${getColorTiquet(servicio.tiquet)}`}
                        >
                          <option value="SI">SI</option>
                          <option value="NO">NO</option>
                          <option value="CORD">CORD</option>
                          <option value="ESPACH">ESPACH</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={servicio.profesionalPrincipalId}
                          onChange={(e) => actualizarProfesional(servicio.id, 'profesionalPrincipalId', e.target.value)}
                          className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-text focus-visible:focus-ring"
                        >
                          <option value="">Seleccionar...</option>
                          {profesionales.map(prof => (
                            <option key={prof.id} value={prof.id}>
                              {prof.nombre} {prof.apellidos}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={servicio.profesionalSegundaOpcionId || ''}
                          onChange={(e) => actualizarProfesional(servicio.id, 'profesionalSegundaOpcionId', e.target.value)}
                          className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-text focus-visible:focus-ring"
                        >
                          <option value="">-</option>
                          {profesionales.map(prof => (
                            <option key={prof.id} value={prof.id}>
                              {prof.nombre} {prof.apellidos}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={servicio.profesionalTerceraOpcionId || ''}
                          onChange={(e) => actualizarProfesional(servicio.id, 'profesionalTerceraOpcionId', e.target.value)}
                          className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-text focus-visible:focus-ring"
                        >
                          <option value="">-</option>
                          {profesionales.map(prof => (
                            <option key={prof.id} value={prof.id}>
                              {prof.nombre} {prof.apellidos}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {servicio.requiereApoyo && <span className="text-warn">✓</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {servicio.sala || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {servicio.tiempoReal ? `${servicio.tiempoReal}min` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => eliminarServicio(servicio.id)}
                          className="text-danger transition-colors hover:text-danger/80"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiciosPage() {
  return (
    <Suspense fallback={<ServiciosSkeleton />}>
      <ServiciosContent />
    </Suspense>
  );
}
