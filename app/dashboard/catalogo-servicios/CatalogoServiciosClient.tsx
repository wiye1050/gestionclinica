'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCatalogoServicios } from '@/lib/hooks/useQueries';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';
import { CatalogoServicio, Profesional } from '@/types';
import { Plus, Edit2, Trash2, Save, X, Clock } from 'lucide-react';
import { sanitizeHTML, sanitizeInput, sanitizeStringArray } from '@/lib/utils/sanitize';
import ColorPicker from '@/components/shared/ColorPicker';
import { DEFAULT_COLOR } from '@/components/agenda/v2/agendaHelpers';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';

interface Props {
  initialServicios: CatalogoServicio[];
  initialProfesionales: Profesional[];
}

export default function CatalogoServiciosClient({ initialServicios, initialProfesionales }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: servicios = [] } = useCatalogoServicios({ initialData: initialServicios });
  const { data: profesionales = [] } = useProfesionalesManager({ initialData: initialProfesionales });
  const invalidateCatalogo = () => queryClient.invalidateQueries({ queryKey: ['catalogo-servicios'] });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'medicina' as 'medicina' | 'fisioterapia' | 'enfermeria',
    color: DEFAULT_COLOR,
    descripcion: '',
    tiempoEstimado: 30,
    requiereSala: true,
    salaPredeterminada: '',
    requiereSupervision: false,
    requiereApoyo: false,
    frecuenciaMensual: 0,
    cargaMensualEstimada: '',
    profesionalesHabilitados: [] as string[],
    activo: true});

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'medicina',
      color: DEFAULT_COLOR,
      descripcion: '',
      tiempoEstimado: 30,
      requiereSala: true,
      salaPredeterminada: '',
      requiereSupervision: false,
      requiereApoyo: false,
      frecuenciaMensual: 0,
      cargaMensualEstimada: '',
      profesionalesHabilitados: [],
      activo: true});
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  // Crear o actualizar servicio
  const sanitizeServicioPayload = (data: typeof formData) => ({
    ...data,
    nombre: sanitizeInput(data.nombre),
    descripcion: data.descripcion ? sanitizeHTML(data.descripcion) : '',
    salaPredeterminada: data.salaPredeterminada ? sanitizeInput(data.salaPredeterminada) : '',
    cargaMensualEstimada: data.cargaMensualEstimada ? sanitizeInput(data.cargaMensualEstimada) : '',
    profesionalesHabilitados: sanitizeStringArray(data.profesionalesHabilitados),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const datos = {
      ...sanitizeServicioPayload(formData),
      updatedAt: new Date()};

    try {
      const endpoint = editandoId ? `/api/catalogo-servicios/${editandoId}` : '/api/catalogo-servicios';
      const method = editandoId ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo guardar el servicio');
      }
      resetForm();
      invalidateCatalogo();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar servicio');
    }
  };

  // Iniciar edición
  const iniciarEdicion = (servicio: CatalogoServicio) => {
    setFormData({
      nombre: sanitizeInput(servicio.nombre),
      categoria: servicio.categoria,
      color: servicio.color || DEFAULT_COLOR,
      descripcion: servicio.descripcion ? sanitizeHTML(servicio.descripcion) : '',
      tiempoEstimado: servicio.tiempoEstimado,
      requiereSala: servicio.requiereSala,
      salaPredeterminada: servicio.salaPredeterminada ? sanitizeInput(servicio.salaPredeterminada) : '',
      requiereSupervision: servicio.requiereSupervision,
      requiereApoyo: servicio.requiereApoyo,
      frecuenciaMensual: servicio.frecuenciaMensual || 0,
      cargaMensualEstimada: servicio.cargaMensualEstimada
        ? sanitizeInput(servicio.cargaMensualEstimada)
        : '',
      profesionalesHabilitados: sanitizeStringArray(servicio.profesionalesHabilitados ?? []),
      activo: servicio.activo});
    setEditandoId(servicio.id);
    setMostrarFormulario(true);
  };

  // Eliminar servicio
  const eliminarServicio = async (id: string) => {
    if (!confirm('¿Eliminar este servicio del catálogo? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`/api/catalogo-servicios/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo eliminar el servicio');
      }
      invalidateCatalogo();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar servicio');
    }
  };

  // Toggle profesional habilitado
  const toggleProfesional = (profesionalId: string) => {
    setFormData(prev => ({
      ...prev,
      profesionalesHabilitados: prev.profesionalesHabilitados.includes(profesionalId)
        ? prev.profesionalesHabilitados.filter(id => id !== profesionalId)
        : [...prev.profesionalesHabilitados, profesionalId]
    }));
  };

  // Cambiar estado activo
  const toggleActivo = async (id: string, estadoActual: boolean) => {
    try {
      const response = await fetch(`/api/catalogo-servicios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estadoActual }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el estado');
      }
      invalidateCatalogo();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(error instanceof Error ? error.message : 'Error al cambiar estado');
    }
  };

  // Filtrar servicios
  const normalizedSearch = busqueda.trim().toLowerCase();

  const serviciosFiltrados = servicios.filter(servicio => {
    const cumpleCategoria = filtroCategoria === 'todos' || servicio.categoria === filtroCategoria;
    const coincideBusqueda =
      normalizedSearch.length === 0 ||
      servicio.nombre.toLowerCase().includes(normalizedSearch) ||
      (servicio.descripcion?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (servicio.cargaMensualEstimada?.toLowerCase().includes(normalizedSearch) ?? false);
    return cumpleCategoria && coincideBusqueda;
  });

  // Estadísticas
  const stats = {
    total: servicios.length,
    activos: servicios.filter(s => s.activo).length,
    medicina: servicios.filter(s => s.categoria === 'medicina').length,
    fisioterapia: servicios.filter(s => s.categoria === 'fisioterapia').length,
    enfermeria: servicios.filter(s => s.categoria === 'enfermeria').length,
  };

  const kpiItems = [
    {
      id: 'total',
      label: 'Total servicios',
      value: stats.total,
      helper: 'Registrados en el catálogo',
      accent: 'brand' as const,
    },
    {
      id: 'activos',
      label: 'Activos',
      value: stats.activos,
      helper: 'Disponibles para asignar',
      accent: 'green' as const,
    },
    {
      id: 'medicina',
      label: 'Medicina',
      value: stats.medicina,
      helper: 'Servicios clínicos',
      accent: 'blue' as const,
    },
    {
      id: 'fisio',
      label: 'Fisioterapia',
      value: stats.fisioterapia,
      helper: 'Modalidades físicas',
      accent: 'green' as const,
    },
    {
      id: 'enfermeria',
      label: 'Enfermería',
      value: stats.enfermeria,
      helper: 'Soporte y cuidados',
      accent: 'purple' as const,
    },
  ];

  const activeFilters: ActiveFilterChip[] = [];
  if (busqueda.trim()) {
    activeFilters.push({ id: 'search', label: 'Búsqueda', value: busqueda, onRemove: () => setBusqueda('') });
  }
  if (filtroCategoria !== 'todos') {
    activeFilters.push({
      id: 'categoria',
      label: 'Categoría',
      value: filtroCategoria,
      onRemove: () => setFiltroCategoria('todos'),
    });
  }

  const handleClearFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('todos');
  };

  const getColorCategoria = (categoria: string) => {
    switch (categoria) {
      case 'medicina': return 'bg-blue-100 text-blue-800';
      case 'fisioterapia': return 'bg-green-100 text-green-800';
      case 'enfermeria': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Servicios</h1>
          <p className="text-gray-600 mt-1">Servicios base disponibles en la clínica</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center space-x-2 bg-blue-600 text-text px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Estadísticas */}
      <KPIGrid items={kpiItems} />

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editandoId ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Consulta médica"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value as 'medicina' | 'fisioterapia' | 'enfermeria'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="medicina">Medicina</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="enfermeria">Enfermería</option>
                </select>
              </div>

              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData({...formData, color})}
                label="Color en Agenda"
                helpText="Este color se usará para identificar el servicio en la agenda"
                previewText="Servicio de ejemplo"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Estimado (minutos) *</label>
                <input
                  type="number"
                  value={formData.tiempoEstimado}
                  onChange={(e) => setFormData({...formData, tiempoEstimado: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sala Predeterminada</label>
                <input
                  type="text"
                  value={formData.salaPredeterminada}
                  onChange={(e) => setFormData({...formData, salaPredeterminada: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Sala 8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia Mensual</label>
                <input
                  type="number"
                  value={formData.frecuenciaMensual}
                  onChange={(e) => setFormData({...formData, frecuenciaMensual: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  placeholder="¿Cuántas veces al mes?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carga Mensual Estimada</label>
                <input
                  type="text"
                  value={formData.cargaMensualEstimada}
                  onChange={(e) => setFormData({...formData, cargaMensualEstimada: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: 5,68%"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Descripción detallada del servicio..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiereSala}
                  onChange={(e) => setFormData({...formData, requiereSala: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Requiere sala</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiereSupervision}
                  onChange={(e) => setFormData({...formData, requiereSupervision: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Requiere supervisión</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiereApoyo}
                  onChange={(e) => setFormData({...formData, requiereApoyo: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Requiere apoyo</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Servicio activo</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profesionales Habilitados
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {profesionales.map(prof => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => toggleProfesional(prof.id)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      formData.profesionalesHabilitados.includes(prof.id)
                        ? 'bg-blue-600 text-text hover:bg-blue-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {prof.nombre} {prof.apellidos}
                  </button>
                ))}
              </div>
              {profesionales.length === 0 && (
                <p className="text-sm text-gray-500">No hay profesionales disponibles. Créalos primero.</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 text-text px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>{editandoId ? 'Actualizar' : 'Crear'} Servicio</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <CompactFilters
        search={{ value: busqueda, placeholder: 'Buscar por nombre o descripción', onChange: setBusqueda }}
        selects={[
          {
            id: 'categoria',
            label: 'Categoría',
            value: filtroCategoria,
            onChange: setFiltroCategoria,
            options: [
              { value: 'todos', label: 'Todas' },
              { value: 'medicina', label: 'Medicina' },
              { value: 'fisioterapia', label: 'Fisioterapia' },
              { value: 'enfermeria', label: 'Enfermería' },
            ],
          },
        ]}
        activeFilters={activeFilters}
        onClear={activeFilters.length > 0 ? handleClearFiltros : undefined}
      />

      {/* Lista de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviciosFiltrados.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No hay servicios en el catálogo</p>
          </div>
        ) : (
          serviciosFiltrados.map((servicio) => (
            <div
              key={servicio.id}
              className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow ${
                !servicio.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: servicio.color || '#3B82F6' }}
                      title={`Color: ${servicio.color || '#3B82F6'}`}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {servicio.nombre}
                    </h3>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getColorCategoria(servicio.categoria)}`}>
                    {servicio.categoria.charAt(0).toUpperCase() + servicio.categoria.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => iniciarEdicion(servicio)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => eliminarServicio(servicio.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {servicio.descripcion && (
                <p className="text-sm text-gray-600 mb-3">{servicio.descripcion}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{servicio.tiempoEstimado} minutos</span>
                </div>

                {servicio.salaPredeterminada && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="font-medium">Sala:</span>
                    <span>{servicio.salaPredeterminada}</span>
                  </div>
                )}

                {servicio.frecuenciaMensual && servicio.frecuenciaMensual > 0 && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="font-medium">Frecuencia:</span>
                    <span>{servicio.frecuenciaMensual}x/mes</span>
                  </div>
                )}

                {servicio.cargaMensualEstimada && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="font-medium">Carga:</span>
                    <span>{servicio.cargaMensualEstimada}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 pt-2">
                  {servicio.requiereSala && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Sala</span>
                  )}
                  {servicio.requiereSupervision && (
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">Supervisión</span>
                  )}
                  {servicio.requiereApoyo && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">Apoyo</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  {servicio.profesionalesHabilitados.length} profesional(es) habilitado(s)
                </p>
                <button
                  onClick={() => toggleActivo(servicio.id, servicio.activo)}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
                    servicio.activo
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {servicio.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
