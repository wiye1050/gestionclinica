'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { TratamientosModule, Tratamiento } from '@/lib/utils/tratamientos';
import { useTratamientosModule, useInvalidateTratamientosModule } from '@/lib/hooks/useTratamientosModule';
import { Plus, Edit2, Trash2, Save, X, List, Clock } from 'lucide-react';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';

interface Props {
  initialModule: TratamientosModule;
}

export default function TratamientosClient({ initialModule }: Props) {
  const { user } = useAuth();
  const { data: moduleData = initialModule } = useTratamientosModule({ initialData: initialModule });
  const invalidateModule = useInvalidateTratamientosModule();
  const tratamientos = moduleData.tratamientos;
  const catalogoServicios = moduleData.catalogo;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'mixto' as 'medicina' | 'fisioterapia' | 'enfermeria' | 'mixto',
    serviciosIncluidos: [] as {
      servicioId: string;
      servicioNombre: string;
      orden: number;
      opcional: boolean;
    }[],
    activo: true,
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: 'mixto',
      serviciosIncluidos: [],
      activo: true,
    });
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  const calcularTiempoTotal = (serviciosIds: string[]) =>
    serviciosIds.reduce((total, servicioId) => {
      const servicio = catalogoServicios.find((s) => s.id === servicioId);
      return total + (servicio?.tiempoEstimado || 0);
    }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (formData.serviciosIncluidos.length === 0) {
      alert('Debes añadir al menos un servicio al tratamiento');
      return;
    }

    const tiempoTotal = calcularTiempoTotal(formData.serviciosIncluidos.map((s) => s.servicioId));
    const sanitizedForm = {
      ...formData,
      nombre: sanitizeInput(formData.nombre),
      descripcion: formData.descripcion ? sanitizeHTML(formData.descripcion) : '',
      serviciosIncluidos: formData.serviciosIncluidos.map((servicio) => ({
        ...servicio,
        servicioNombre: sanitizeInput(servicio.servicioNombre),
      })),
    };
    const payload = {
      ...sanitizedForm,
      tiempoTotalEstimado: tiempoTotal,
      updatedAt: new Date(),
    };

    try {
      const endpoint = editandoId ? `/api/tratamientos/${editandoId}` : '/api/tratamientos';
      const method = editandoId ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo guardar el tratamiento');
      }
      resetForm();
      invalidateModule();
    } catch (error) {
      console.error('Error al guardar tratamiento:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar tratamiento');
    }
  };

  const iniciarEdicion = (tratamiento: Tratamiento) => {
    setFormData({
      nombre: sanitizeInput(tratamiento.nombre),
      descripcion: tratamiento.descripcion ? sanitizeHTML(tratamiento.descripcion) : '',
      categoria: tratamiento.categoria,
      serviciosIncluidos: tratamiento.serviciosIncluidos.map((servicio) => ({
        ...servicio,
        servicioNombre: sanitizeInput(servicio.servicioNombre),
      })),
      activo: tratamiento.activo,
    });
    setEditandoId(tratamiento.id);
    setMostrarFormulario(true);
  };

  const eliminarTratamiento = async (id: string) => {
    if (!confirm('¿Eliminar este tratamiento? Esta acción no se puede deshacer.')) return;
    try {
      const response = await fetch(`/api/tratamientos/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo eliminar');
      }
      invalidateModule();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar tratamiento');
    }
  };

  const añadirServicio = (servicioId: string) => {
    const servicio = catalogoServicios.find((s) => s.id === servicioId);
    if (!servicio) return;
    if (formData.serviciosIncluidos.some((s) => s.servicioId === servicioId)) {
      alert('Este servicio ya está incluido en el tratamiento');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      serviciosIncluidos: [
        ...prev.serviciosIncluidos,
        {
          servicioId: servicio.id,
          servicioNombre: sanitizeInput(servicio.nombre),
          orden: prev.serviciosIncluidos.length + 1,
          opcional: false,
        },
      ],
    }));
  };

  const eliminarServicioDelTratamiento = (servicioId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviciosIncluidos: prev.serviciosIncluidos
        .filter((s) => s.servicioId !== servicioId)
        .map((s, index) => ({ ...s, orden: index + 1 })),
    }));
  };

  const moverServicio = (index: number, direccion: 'arriba' | 'abajo') => {
    setFormData((prev) => {
      const nuevosServicios = [...prev.serviciosIncluidos];
      const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
      if (nuevoIndex < 0 || nuevoIndex >= nuevosServicios.length) return prev;
      [nuevosServicios[index], nuevosServicios[nuevoIndex]] = [
        nuevosServicios[nuevoIndex],
        nuevosServicios[index],
      ];
      nuevosServicios.forEach((s, i) => {
        s.orden = i + 1;
      });
      return { ...prev, serviciosIncluidos: nuevosServicios };
    });
  };

  const toggleOpcional = (servicioId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviciosIncluidos: prev.serviciosIncluidos.map((s) =>
        s.servicioId === servicioId ? { ...s, opcional: !s.opcional } : s
      ),
    }));
  };

  const toggleActivo = async (id: string, estadoActual: boolean) => {
    try {
      const response = await fetch(`/api/tratamientos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estadoActual }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el estado');
      }
      invalidateModule();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(error instanceof Error ? error.message : 'No se pudo cambiar el estado');
    }
  };

  const exportarAExcel = async (lista: Tratamiento[]) => {
    const XLSX = await import('xlsx');
    const datosExcel = lista.map((tratamiento) => ({
      Nombre: tratamiento.nombre,
      Categoría: tratamiento.categoria,
      Servicios: tratamiento.serviciosIncluidos.length,
      'Tiempo Estimado (min)': tratamiento.tiempoTotalEstimado,
      Estado: tratamiento.activo ? 'Activo' : 'Inactivo',
      Descripción: tratamiento.descripcion ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tratamientos');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Tratamientos_${fecha}.xlsx`);
  };

  const tratamientosFiltrados = useMemo(() => {
    return tratamientos.filter((tratamiento) => {
      const cumpleCategoria =
        filtroCategoria === 'todos' || tratamiento.categoria === filtroCategoria;
      return cumpleCategoria;
    });
  }, [tratamientos, filtroCategoria]);

  const stats = {
    total: tratamientos.length,
    activos: tratamientos.filter((t) => t.activo).length,
    medicina: tratamientos.filter((t) => t.categoria === 'medicina').length,
    fisioterapia: tratamientos.filter((t) => t.categoria === 'fisioterapia').length,
    enfermeria: tratamientos.filter((t) => t.categoria === 'enfermeria').length,
    mixtos: tratamientos.filter((t) => t.categoria === 'mixto').length,
  };

  const getColorCategoria = (categoria: string) => {
    switch (categoria) {
      case 'medicina':
        return 'bg-blue-100 text-blue-800';
      case 'fisioterapia':
        return 'bg-green-100 text-green-800';
      case 'enfermeria':
        return 'bg-purple-100 text-purple-800';
      case 'mixto':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tratamientos</h1>
          <p className="text-gray-600 mt-1">Protocolos completos combinando múltiples servicios</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportarAExcel(tratamientosFiltrados)}
            className="flex items-center space-x-2 bg-green-600 text-text px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <List className="w-5 h-5" />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center space-x-2 bg-blue-600 text-text px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Tratamiento</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Activos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.activos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Medicina</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.medicina}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Fisioterapia</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.fisioterapia}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Enfermería</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.enfermeria}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Mixtos</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.mixtos}</p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editandoId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Tratamiento *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Tratamiento Completo Grupo 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoria: e.target.value as 'medicina' | 'fisioterapia' | 'enfermeria' | 'mixto',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="medicina">Medicina</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="enfermeria">Enfermería</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Descripción del tratamiento..."
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="activo" className="text-sm text-gray-700">
                Tratamiento activo
              </label>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicios Incluidos en el Tratamiento
              </label>
              <div className="mb-4">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      añadirServicio(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar servicio para añadir...</option>
                  {catalogoServicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} ({servicio.tiempoEstimado}min)
                    </option>
                  ))}
                </select>
              </div>

              {formData.serviciosIncluidos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay servicios añadidos. Selecciona uno arriba.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.serviciosIncluidos.map((servicio, index) => (
                    <div
                      key={servicio.servicioId}
                      className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-600 w-8">{servicio.orden}.</span>
                      <span className="flex-1 text-sm text-gray-900">{servicio.servicioNombre}</span>
                      <button
                        type="button"
                        onClick={() => toggleOpcional(servicio.servicioId)}
                        className={`text-xs px-2 py-1 rounded ${
                          servicio.opcional ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {servicio.opcional ? 'Opcional' : 'Obligatorio'}
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moverServicio(index, 'arriba')}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moverServicio(index, 'abajo')}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarServicioDelTratamiento(servicio.servicioId)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 text-text px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>{editandoId ? 'Actualizar' : 'Crear'} Tratamiento</span>
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

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por categoría:</span>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todos">Todas</option>
            <option value="medicina">Medicina</option>
            <option value="fisioterapia">Fisioterapia</option>
            <option value="enfermeria">Enfermería</option>
            <option value="mixto">Mixto</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tratamientosFiltrados.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No hay tratamientos registrados</p>
          </div>
        ) : (
          tratamientosFiltrados.map((tratamiento) => (
            <div
              key={tratamiento.id}
              className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow ${
                !tratamiento.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tratamiento.nombre}</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getColorCategoria(
                      tratamiento.categoria
                    )}`}
                  >
                    {tratamiento.categoria.charAt(0).toUpperCase() + tratamiento.categoria.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => iniciarEdicion(tratamiento)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => eliminarTratamiento(tratamiento.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {tratamiento.descripcion && (
                <p className="text-sm text-gray-600 mb-3">{tratamiento.descripcion}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <List className="w-4 h-4" />
                  <span>{tratamiento.serviciosIncluidos.length} servicios</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{tratamiento.tiempoTotalEstimado} minutos</span>
                </div>
              </div>

              <div className="border-t pt-3 mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Servicios incluidos:</p>
                <ol className="space-y-1">
                  {tratamiento.serviciosIncluidos.map((servicio) => (
                    <li key={servicio.servicioId} className="text-sm text-gray-600 flex items-center space-x-2">
                      <span className="font-medium">{servicio.orden}.</span>
                      <span className="flex-1">{servicio.servicioNombre}</span>
                      {servicio.opcional && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Opcional</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <button
                onClick={() => toggleActivo(tratamiento.id, tratamiento.activo)}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
                  tratamiento.activo
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tratamiento.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
