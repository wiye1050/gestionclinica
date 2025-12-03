'use client';

import { Suspense, lazy, useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useServiciosModule } from '@/lib/hooks/useServiciosModule';
import { Plus } from 'lucide-react';
import { LoadingTable } from '@/components/ui/Loading';
import type { ServicioAsignado, Profesional, GrupoPaciente, CatalogoServicio } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeInput } from '@/lib/utils/sanitize';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';
import { captureError } from '@/lib/utils/errorLogging';
import { createServicioAction, updateServicioAction, deleteServicioAction } from './actions';
import CreateServicioForm, { type NuevoServicioForm } from '@/components/servicios/CreateServicioForm';
import ServiciosTable from '@/components/servicios/ServiciosTable';

// Lazy loading del componente de exportación
const ExportButton = lazy(() => import('@/components/ui/ExportButton').then(m => ({ default: m.ExportButton })));

type TiquetValue = 'SI' | 'NO' | 'CORD' | 'ESPACH';

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
    const result = await updateServicioAction({
      id: sanitizeId(servicioId),
      ...sanitizeUpdates(updates),
    });
    if (!result.success) {
      throw new Error(result.error || 'No se pudo actualizar el servicio');
    }
    await invalidateServicios();
  };

  const deleteServicio = async (servicioId: string) => {
    const result = await deleteServicioAction(sanitizeId(servicioId));
    if (!result.success) {
      throw new Error(result.error || 'No se pudo eliminar el servicio');
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

      const result = await createServicioAction({
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
      });

      if (!result.success) {
        throw new Error(result.error || 'No se pudo crear el servicio');
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
      captureError(error, { module: 'servicios-client', action: 'create-servicio' });
      alert(error instanceof Error ? error.message : 'Error al crear servicio');
    }
  };

  // Cambiar checkbox "ACTUAL"
  const toggleActual = async (servicioId: string, valorActual: boolean) => {
    try {
      await patchServicio(servicioId, { esActual: !valorActual });
    } catch (error) {
      captureError(error, { module: 'servicios-client', action: 'update-servicio', metadata: { servicioId } });
    }
  };

  // Actualizar tiquet
  const actualizarTiquet = async (servicioId: string, nuevoTiquet: string) => {
    try {
      await patchServicio(servicioId, { tiquet: nuevoTiquet });
    } catch (error) {
      captureError(error, { module: 'servicios-client', action: 'update-tiquet', metadata: { servicioId } });
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
      captureError(error, { module: 'servicios-client', action: 'update-profesional', metadata: { servicioId, campo } });
    }
  };

  // Eliminar servicio
  const eliminarServicio = async (servicioId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;

    try {
      await deleteServicio(servicioId);
    } catch (error) {
      captureError(error, { module: 'servicios-client', action: 'delete-servicio', metadata: { servicioId } });
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
        <CreateServicioForm
          formData={nuevoServicio}
          onChange={setNuevoServicio}
          onSubmit={handleCrearServicio}
          onCancel={() => setMostrarFormulario(false)}
          catalogoServicios={catalogoServicios}
          grupos={grupos}
          profesionales={profesionales}
        />
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
        <ServiciosTable
          servicios={serviciosFiltrados}
          profesionales={profesionales}
          onToggleActual={toggleActual}
          onUpdateTiquet={actualizarTiquet}
          onUpdateProfesional={actualizarProfesional}
          onDelete={eliminarServicio}
        />
      )}
    </div>
  );
}
