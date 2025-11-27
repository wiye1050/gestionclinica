/* eslint-disable react/no-unescaped-entities */
'use client';

import { Suspense, lazy, useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useServiciosModule } from '@/lib/hooks/useServiciosModule';
import { Plus, CheckSquare, Square, Trash2 } from 'lucide-react';
import { LoadingTable } from '@/components/ui/Loading';
import type { ServicioAsignado, Profesional, GrupoPaciente, CatalogoServicio } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeInput } from '@/lib/utils/sanitize';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';

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

interface ServiciosClientProps {
  initialServicios: ServicioAsignado[];
  initialProfesionales: Profesional[];
  initialGrupos: GrupoPaciente[];
  initialCatalogo: CatalogoServicio[];
}

export default function ServiciosClient({
  initialServicios,
  initialProfesionales,
  initialGrupos,
  initialCatalogo,
}: ServiciosClientProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const initialModule = useMemo(
    () => ({
      servicios: initialServicios,
      profesionales: initialProfesionales,
      grupos: initialGrupos,
      catalogo: initialCatalogo,
    }),
    [initialServicios, initialProfesionales, initialGrupos, initialCatalogo]
  );

  const { data: moduleData = initialModule, isLoading: loadingModule } = useServiciosModule({
    initialData: initialModule,
  });

  const servicios = moduleData.servicios;
  const profesionales = moduleData.profesionales;
  const grupos = moduleData.grupos;
  const catalogoServicios = moduleData.catalogo;

  const invalidateServicios = () =>
    queryClient.invalidateQueries({ queryKey: ['servicios-module'] });

  const sanitizeId = (value: string) => sanitizeInput(value);

  const allowedTiquetValues: TiquetValue[] = ['SI', 'NO', 'CORD', 'ESPACH'];
  const sanitizeTiquetValue = (value: string): TiquetValue => {
    const normalized = sanitizeInput(value).toUpperCase() as TiquetValue;
    return allowedTiquetValues.includes(normalized) ? normalized : 'NO';
  };

  const sanitizeUpdates = (updates: Record<string, unknown>) => {
    const sanitized: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'tiquet' && typeof value === 'string') {
        sanitized[key] = sanitizeTiquetValue(value);
      } else {
        sanitized[key] = typeof value === 'string' ? sanitizeInput(value) : value;
      }
    });
    return sanitized;
  };

  const patchServicio = async (servicioId: string, updates: Record<string, unknown>) => {
    const response = await fetch(`/api/servicios/${sanitizeId(servicioId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizeUpdates(updates)),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'No se pudo actualizar el servicio');
    }
    await invalidateServicios();
  };

  const deleteServicio = async (servicioId: string) => {
    const response = await fetch(`/api/servicios/${sanitizeId(servicioId)}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'No se pudo eliminar el servicio');
    }
    await invalidateServicios();
  };

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [soloActuales, setSoloActuales] = useState(false);

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
    esActual: false});

  const loading = loadingModule;

  // Crear servicio
  const handleCrearServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const catalogoServicio = catalogoServicios.find(s => s.id === nuevoServicio.catalogoServicioId);
    const grupo = grupos.find(g => g.id === nuevoServicio.grupoId);
    const profPrincipal = profesionales.find(p => p.id === nuevoServicio.profesionalPrincipalId);

    if (!catalogoServicio || !grupo || !profPrincipal) {
      alert('Faltan datos obligatorios');
      return;
    }

    try {
      const sanitizedNuevoServicio: NuevoServicioForm = {
        catalogoServicioId: sanitizeInput(nuevoServicio.catalogoServicioId),
        grupoId: sanitizeInput(nuevoServicio.grupoId),
        tiquet: sanitizeTiquetValue(nuevoServicio.tiquet),
        profesionalPrincipalId: sanitizeInput(nuevoServicio.profesionalPrincipalId),
        profesionalSegundaOpcionId: nuevoServicio.profesionalSegundaOpcionId
          ? sanitizeInput(nuevoServicio.profesionalSegundaOpcionId)
          : '',
        profesionalTerceraOpcionId: nuevoServicio.profesionalTerceraOpcionId
          ? sanitizeInput(nuevoServicio.profesionalTerceraOpcionId)
          : '',
        requiereApoyo: nuevoServicio.requiereApoyo,
        sala: nuevoServicio.sala ? sanitizeInput(nuevoServicio.sala) : '',
        supervision: nuevoServicio.supervision,
        esActual: nuevoServicio.esActual,
      };

      const response = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogoServicioId: catalogoServicio.id,
          grupoId: grupo.id,
          tiquet: sanitizedNuevoServicio.tiquet,
          profesionalPrincipalId: profPrincipal.id,
          profesionalSegundaOpcionId: sanitizedNuevoServicio.profesionalSegundaOpcionId || null,
          profesionalTerceraOpcionId: sanitizedNuevoServicio.profesionalTerceraOpcionId || null,
          requiereApoyo: sanitizedNuevoServicio.requiereApoyo || catalogoServicio.requiereApoyo,
          sala: sanitizeInput(
            sanitizedNuevoServicio.sala || catalogoServicio.salaPredeterminada || ''
          ),
          supervision: sanitizedNuevoServicio.supervision || catalogoServicio.requiereSupervision,
          esActual: sanitizedNuevoServicio.esActual,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo crear el servicio');
      }

      await queryClient.invalidateQueries({ queryKey: ['servicios-asignados'] });

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
      alert(error instanceof Error ? error.message : 'Error al crear servicio');
    }
  };

  // Cambiar checkbox "ACTUAL"
  const toggleActual = async (servicioId: string, valorActual: boolean) => {
    try {
      await patchServicio(servicioId, { esActual: !valorActual });
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  // Actualizar tiquet
  const actualizarTiquet = async (servicioId: string, nuevoTiquet: string) => {
    try {
      await patchServicio(servicioId, { tiquet: nuevoTiquet });
    } catch (error) {
      console.error('Error al actualizar tiquet:', error);
    }
  };

  // Actualizar profesional
  const actualizarProfesional = async (servicioId: string, campo: string, profesionalId: string) => {
    if (!profesionalId && campo === 'profesionalPrincipalId') {
      alert('El profesional principal es obligatorio');
      return;
    }
    try {
      await patchServicio(servicioId, {
        [campo]: profesionalId ? sanitizeInput(profesionalId) : null,
      });
    } catch (error) {
      console.error('Error al actualizar profesional:', error);
    }
  };

  // Eliminar servicio
  const eliminarServicio = async (servicioId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    
    try {
      await deleteServicio(servicioId);
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  // Filtrar servicios (memoizado para rendimiento)
  const normalizedSearch = busqueda.trim().toLowerCase();

  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((servicio) => {
      const cumpleGrupo = filtroGrupo === 'todos' || servicio.grupoId === filtroGrupo;
      const cumpleEstado = filtroEstado === 'todos' || servicio.tiquet === filtroEstado;
      const cumpleActual = !soloActuales || servicio.esActual;
      const coincideBusqueda =
        normalizedSearch.length === 0 ||
        servicio.catalogoServicioNombre.toLowerCase().includes(normalizedSearch) ||
        servicio.grupoNombre.toLowerCase().includes(normalizedSearch) ||
        servicio.profesionalPrincipalNombre.toLowerCase().includes(normalizedSearch);
      return cumpleGrupo && cumpleEstado && cumpleActual && coincideBusqueda;
    });
  }, [servicios, filtroGrupo, filtroEstado, soloActuales, normalizedSearch]);

  const stats = {
    total: servicios.length,
    actuales: servicios.filter((s) => s.esActual).length,
    conApoyo: servicios.filter((s) => s.requiereApoyo).length,
    conSupervision: servicios.filter((s) => s.supervision).length,
    tiquetSi: servicios.filter((s) => s.tiquet === 'SI').length,
  };

  const kpiItems = [
    { id: 'total', label: 'Servicios asignados', value: stats.total, helper: 'Totales', accent: 'brand' as const },
    { id: 'actuales', label: 'Actuales', value: stats.actuales, helper: 'Vigentes', accent: 'green' as const },
    { id: 'apoyo', label: 'Con apoyo', value: stats.conApoyo, helper: 'Requieren apoyo', accent: 'purple' as const },
    { id: 'supervision', label: 'Con supervisión', value: stats.conSupervision, helper: 'Vigilados', accent: 'blue' as const },
    { id: 'tiquet', label: 'Ticket SI', value: stats.tiquetSi, helper: 'Con ticket activo', accent: 'green' as const },
  ];

  const activeFilters: ActiveFilterChip[] = [];
  if (busqueda.trim()) {
    activeFilters.push({ id: 'busqueda', label: 'Búsqueda', value: busqueda, onRemove: () => setBusqueda('') });
  }
  if (filtroGrupo !== 'todos') {
    const groupLabel = grupos.find((g) => g.id === filtroGrupo)?.nombre ?? filtroGrupo;
    activeFilters.push({ id: 'grupo', label: 'Grupo', value: groupLabel, onRemove: () => setFiltroGrupo('todos') });
  }
  if (filtroEstado !== 'todos') {
    activeFilters.push({ id: 'tiquet', label: 'Ticket', value: filtroEstado, onRemove: () => setFiltroEstado('todos') });
  }
  if (soloActuales) {
    activeFilters.push({ id: 'actuales', label: 'Estado', value: 'Solo actuales', onRemove: () => setSoloActuales(false) });
  }

  const clearFilters = () => {
    setBusqueda('');
    setFiltroGrupo('todos');
    setFiltroEstado('todos');
    setSoloActuales(false);
  };

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
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 px-6 py-5">
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
            className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Asignar Servicio</span>
          </button>
        </div>
      </div>

      <KPIGrid items={kpiItems} />

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
        <div className="panel-block p-6 shadow-sm">
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
              <button type="submit" className="btn-gradient px-6 py-2.5 text-sm">
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

      <CompactFilters
        search={{ value: busqueda, onChange: setBusqueda, placeholder: 'Buscar por servicio o grupo' }}
        selects={[
          {
            id: 'grupo',
            label: 'Grupo',
            value: filtroGrupo,
            onChange: setFiltroGrupo,
            options: [
              { value: 'todos', label: 'Todos los grupos' },
              ...grupos.map((grupo) => ({ value: grupo.id, label: grupo.nombre })),
            ],
          },
          {
            id: 'tiquet',
            label: 'Ticket',
            value: filtroEstado,
            onChange: setFiltroEstado,
            options: [
              { value: 'todos', label: 'Todos' },
              { value: 'SI', label: 'SI' },
              { value: 'NO', label: 'NO' },
              { value: 'CORD', label: 'CORD' },
              { value: 'ESPACH', label: 'ESPACH' },
            ],
          },
        ]}
        activeFilters={activeFilters}
        onClear={activeFilters.length ? clearFilters : undefined}
      >
        <button
          type="button"
          onClick={() => setSoloActuales((prev) => !prev)}
          className={`rounded-pill border px-4 py-2 text-xs font-semibold transition-colors focus-visible:focus-ring ${
            soloActuales ? 'border-brand bg-brand-subtle text-brand' : 'border-border bg-card text-text'
          }`}
        >
          {soloActuales ? 'Mostrando actuales' : 'Incluir históricos'}
        </button>
      </CompactFilters>

      {/* Tabla de Servicios */}
      {loading ? (
        <LoadingTable rows={10} />
      ) : (
        <div className="overflow-hidden panel-block shadow-sm">
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
