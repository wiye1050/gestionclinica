'use client';

import { Suspense, lazy, useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  useServicios, 
  useProfesionales, 
  useGruposPacientes, 
  useCatalogoServicios 
} from '@/lib/hooks/useQueries';
import CompactFilters from '@/components/shared/CompactFilters';
import { Plus, Users, CheckSquare, Square, Trash2, CheckCircle, Package } from 'lucide-react';
import { LoadingTable } from '@/components/ui/Loading';
import type { ServicioAsignado, Profesional, GrupoPaciente, CatalogoServicio } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeInput } from '@/lib/utils/sanitize';

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
  
  const { data: servicios = [], isLoading: loadingServicios } = useServicios({
    initialData: initialServicios,
  });
  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionales({
    initialData: initialProfesionales,
  });
  const { data: grupos = [], isLoading: loadingGrupos } = useGruposPacientes({
    initialData: initialGrupos,
  });
  const { data: catalogoServicios = [], isLoading: loadingCatalogo } = useCatalogoServicios({
    initialData: initialCatalogo,
  });
  const invalidateServicios = () =>
    queryClient.invalidateQueries({ queryKey: ['servicios-asignados'] });

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
  const [filtroTiquet, setFiltroTiquet] = useState<string>('todos');

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

  const loading = loadingServicios || loadingProfesionales || loadingGrupos || loadingCatalogo;

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

  const toggleActual = async (servicioId: string, valorActual: boolean) => {
    try {
      await patchServicio(servicioId, { esActual: !valorActual });
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  const actualizarTiquet = async (servicioId: string, nuevoTiquet: string) => {
    try {
      await patchServicio(servicioId, { tiquet: nuevoTiquet });
    } catch (error) {
      console.error('Error al actualizar tiquet:', error);
    }
  };

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

  const eliminarServicio = async (servicioId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    
    try {
      await deleteServicio(servicioId);
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(servicio => {
      const cumpleGrupo = filtroGrupo === 'todos' || servicio.grupoId === filtroGrupo;
      const cumpleTiquet = filtroTiquet === 'todos' || servicio.tiquet === filtroTiquet;
      return cumpleGrupo && cumpleTiquet;
    });
  }, [servicios, filtroGrupo, filtroTiquet]);

  const kpis = useMemo(() => {
    return {
      total: servicios.length,
      actuales: servicios.filter(s => s.esActual).length,
      grupos: grupos.length,
      profesionales: profesionales.length
    };
  }, [servicios, grupos, profesionales]);

  const getColorTiquet = (tiquet: string) => {
    switch (tiquet) {
      case 'SI':
        return 'bg-green-100 text-green-700';
      case 'NO':
        return 'bg-red-100 text-red-700';
      case 'CORD':
        return 'bg-yellow-100 text-yellow-700';
      case 'ESPACH':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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

  const activeFiltersCount = [
    filtroGrupo !== 'todos',
    filtroTiquet !== 'todos'
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header compacto */}
      <div className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Servicios Asignados</h1>
              <p className="text-sm text-gray-500">Gestión de servicios por grupo</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />}>
              <ExportButton
                data={exportData}
                columns={exportColumns}
                filename={`Servicios_${new Date().toISOString().split('T')[0]}`}
                format="excel"
                disabled={loading}
              />
            </Suspense>
            
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Asignar
            </button>
          </div>
        </div>

        {/* KPIs integrados */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Actuales</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.actuales}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Grupos</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.grupos}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Profesionales</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.profesionales}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso si faltan datos */}
      {!loading && (catalogoServicios.length === 0 || grupos.length === 0 || profesionales.length === 0) && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">⚠️ Faltan datos necesarios:</p>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            {catalogoServicios.length === 0 && <li>• Crea servicios en el Catálogo de Servicios</li>}
            {profesionales.length === 0 && <li>• Añade profesionales en la sección Profesionales</li>}
            {grupos.length === 0 && <li>• Crea grupos de pacientes</li>}
          </ul>
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="surface-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Asignar servicio a grupo</h2>
          <form onSubmit={handleCrearServicio} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio *</label>
                <select
                  value={nuevoServicio.catalogoServicioId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, catalogoServicioId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {catalogoServicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                <select
                  value={nuevoServicio.grupoId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, grupoId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiquet</label>
                <select
                  value={nuevoServicio.tiquet}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, tiquet: e.target.value as TiquetValue})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="CORD">CORD</option>
                  <option value="ESPACH">ESPACH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profesional *</label>
                <select
                  value={nuevoServicio.profesionalPrincipalId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, profesionalPrincipalId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {profesionales.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} {prof.apellidos}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={nuevoServicio.esActual}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, esActual: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Es actual</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Asignar
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <CompactFilters
        filters={[
          {
            label: 'Grupo',
            value: filtroGrupo,
            options: grupos.map(g => ({ label: g.nombre, value: g.id })),
            onChange: setFiltroGrupo
          },
          {
            label: 'Tiquet',
            value: filtroTiquet,
            options: [
              { label: 'SI', value: 'SI' },
              { label: 'NO', value: 'NO' },
              { label: 'CORD', value: 'CORD' },
              { label: 'ESPACH', value: 'ESPACH' }
            ],
            onChange: setFiltroTiquet
          }
        ]}
        activeFiltersCount={activeFiltersCount}
        onClearAll={() => {
          setFiltroGrupo('todos');
          setFiltroTiquet('todos');
        }}
      />

      {/* Tabla */}
      {loading ? (
        <LoadingTable rows={10} />
      ) : (
        <div className="overflow-hidden surface-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Actual</th>
                  <th className="px-4 py-3 text-left font-semibold">Servicio</th>
                  <th className="px-4 py-3 text-left font-semibold">Grupo</th>
                  <th className="px-4 py-3 text-left font-semibold">Tiquet</th>
                  <th className="px-4 py-3 text-left font-semibold">Profesional</th>
                  <th className="px-4 py-3 text-left font-semibold">Sala</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
                {serviciosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No hay servicios asignados
                    </td>
                  </tr>
                ) : (
                  serviciosFiltrados.map((servicio) => (
                    <tr key={servicio.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActual(servicio.id, servicio.esActual)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          {servicio.esActual ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {servicio.catalogoServicioNombre}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {servicio.grupoNombre}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={servicio.tiquet}
                          onChange={(e) => actualizarTiquet(servicio.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getColorTiquet(servicio.tiquet)}`}
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
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900"
                        >
                          {profesionales.map(prof => (
                            <option key={prof.id} value={prof.id}>
                              {prof.nombre} {prof.apellidos}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {servicio.sala || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => eliminarServicio(servicio.id)}
                          className="text-red-600 transition-colors hover:text-red-700"
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
