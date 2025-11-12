'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { CatalogoServicio } from '@/types';
import { Plus, Edit2, Trash2, Save, X, List, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Tratamiento {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: 'medicina' | 'fisioterapia' | 'enfermeria' | 'mixto';
  serviciosIncluidos: {
    servicioId: string;
    servicioNombre: string;
    orden: number;
    opcional: boolean;
  }[];
  tiempoTotalEstimado: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type TratamientoApi = Omit<Tratamiento, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CatalogoServicioApi = Omit<CatalogoServicio, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | null;
  updatedAt?: string | null;
};

const safeDate = (value?: string | null) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const parseTratamiento = (item: TratamientoApi): Tratamiento => ({
  ...item,
  createdAt: safeDate(item.createdAt),
  updatedAt: safeDate(item.updatedAt),
});

const parseCatalogoServicio = (item: CatalogoServicioApi): CatalogoServicio => {
  const categorias: CatalogoServicio['categoria'][] = ['medicina', 'fisioterapia', 'enfermeria'];
  const categoria = categorias.includes(item.categoria as CatalogoServicio['categoria'])
    ? (item.categoria as CatalogoServicio['categoria'])
    : 'medicina';

  return {
    id: item.id,
    nombre: item.nombre ?? 'Servicio',
    categoria,
    descripcion: item.descripcion,
    protocolosRequeridos: Array.isArray(item.protocolosRequeridos) ? (item.protocolosRequeridos as string[]) : undefined,
    tiempoEstimado: Number(item.tiempoEstimado ?? 0),
    requiereSala: Boolean(item.requiereSala),
    salaPredeterminada: item.salaPredeterminada ?? undefined,
    requiereSupervision: Boolean(item.requiereSupervision),
    requiereApoyo: Boolean(item.requiereApoyo),
    frecuenciaMensual: item.frecuenciaMensual ?? undefined,
    cargaMensualEstimada: item.cargaMensualEstimada ?? undefined,
    profesionalesHabilitados: Array.isArray(item.profesionalesHabilitados)
      ? (item.profesionalesHabilitados as string[])
      : [],
    activo: Boolean(item.activo ?? true),
    createdAt: safeDate(item.createdAt),
    updatedAt: safeDate(item.updatedAt),
  } as CatalogoServicio;
};

export default function TratamientosPage() {
  const { user } = useAuth();
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [catalogoServicios, setCatalogoServicios] = useState<CatalogoServicio[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

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

  const requestJson = useCallback(async <T = unknown>(input: RequestInfo, init?: RequestInit) => {
    const response = await fetch(input, init);
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload && 'error' in payload
          ? String((payload as { error?: unknown }).error)
          : 'Operación no disponible';
      throw new Error(message);
    }

    return (payload as T) ?? ({} as T);
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setErrorMensaje(null);
    try {
      const [tratamientosData, serviciosData] = await Promise.all([
        requestJson<TratamientoApi[]>('/api/tratamientos'),
        requestJson<CatalogoServicioApi[]>('/api/catalogo-servicios?limit=500&incluirInactivos=true'),
      ]);
      setTratamientos(tratamientosData.map(parseTratamiento));
      setCatalogoServicios(serviciosData.filter((servicio) => servicio.activo).map(parseCatalogoServicio));
    } catch (error) {
      console.error('Error cargando tratamientos:', error);
      setErrorMensaje(error instanceof Error ? error.message : 'No se pudieron cargar los tratamientos.');
    } finally {
      setLoading(false);
    }
  }, [requestJson]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para gestionar tratamientos.');
      return;
    }

    if (formData.serviciosIncluidos.length === 0) {
      toast.error('Añade al menos un servicio al tratamiento');
      return;
    }

    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion || undefined,
      categoria: formData.categoria,
      serviciosIncluidos: formData.serviciosIncluidos,
      activo: formData.activo,
    };

    setSaving(true);
    try {
      if (editandoId) {
        await requestJson(`/api/tratamientos/${editandoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Tratamiento actualizado correctamente');
      } else {
        await requestJson('/api/tratamientos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Tratamiento creado correctamente');
      }

      resetForm();
      await cargarDatos();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el tratamiento.';
      setErrorMensaje(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const iniciarEdicion = (tratamiento: Tratamiento) => {
    setFormData({
      nombre: tratamiento.nombre,
      descripcion: tratamiento.descripcion || '',
      categoria: tratamiento.categoria,
      serviciosIncluidos: tratamiento.serviciosIncluidos,
      activo: tratamiento.activo,
    });
    setEditandoId(tratamiento.id);
    setMostrarFormulario(true);
  };

  const eliminarTratamiento = async (id: string) => {
    if (!confirm('¿Eliminar este tratamiento? Esta acción no se puede deshacer.')) return;
    try {
      await requestJson(`/api/tratamientos/${id}`, { method: 'DELETE' });
      toast.success('Tratamiento eliminado');
      await cargarDatos();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el tratamiento.';
      setErrorMensaje(message);
      toast.error(message);
    }
  };

  const añadirServicio = (servicioId: string) => {
    const servicio = catalogoServicios.find((s) => s.id === servicioId);
    if (!servicio) return;
    if (formData.serviciosIncluidos.some((s) => s.servicioId === servicioId)) {
      toast.error('Este servicio ya está incluido en el tratamiento');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      serviciosIncluidos: [
        ...prev.serviciosIncluidos,
        {
          servicioId: servicio.id,
          servicioNombre: servicio.nombre,
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
    const nuevosServicios = [...formData.serviciosIncluidos];
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (nuevoIndex < 0 || nuevoIndex >= nuevosServicios.length) return;
    [nuevosServicios[index], nuevosServicios[nuevoIndex]] = [nuevosServicios[nuevoIndex], nuevosServicios[index]];
    nuevosServicios.forEach((servicio, i) => (servicio.orden = i + 1));
    setFormData((prev) => ({ ...prev, serviciosIncluidos: nuevosServicios }));
  };

  const toggleOpcional = (servicioId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviciosIncluidos: prev.serviciosIncluidos.map((servicio) =>
        servicio.servicioId === servicioId ? { ...servicio, opcional: !servicio.opcional } : servicio
      ),
    }));
  };

  const toggleActivo = async (id: string, estadoActual: boolean) => {
    try {
      await requestJson(`/api/tratamientos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estadoActual }),
      });
      await cargarDatos();
      toast.success('Estado actualizado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el estado.';
      setErrorMensaje(message);
      toast.error(message);
    }
  };

  const tratamientosFiltrados = useMemo(
    () =>
      tratamientos.filter((tratamiento) =>
        filtroCategoria === 'todos' ? true : tratamiento.categoria === filtroCategoria
      ),
    [tratamientos, filtroCategoria]
  );

  const stats = useMemo(
    () => ({
      total: tratamientos.length,
      activos: tratamientos.filter((t) => t.activo).length,
      medicina: tratamientos.filter((t) => t.categoria === 'medicina').length,
      fisioterapia: tratamientos.filter((t) => t.categoria === 'fisioterapia').length,
      enfermeria: tratamientos.filter((t) => t.categoria === 'enfermeria').length,
      mixtos: tratamientos.filter((t) => t.categoria === 'mixto').length,
    }),
    [tratamientos]
  );

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
        <div className="flex items-center gap-3">
          {loading && <span className="text-sm text-gray-500">Actualizando…</span>}
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Tratamiento</span>
          </button>
        </div>
      </div>

      {errorMensaje && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMensaje}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Activos" value={stats.activos} accent="text-green-600" />
        <StatCard label="Medicina" value={stats.medicina} accent="text-blue-600" />
        <StatCard label="Fisioterapia" value={stats.fisioterapia} accent="text-green-600" />
        <StatCard label="Enfermería" value={stats.enfermeria} accent="text-purple-600" />
        <StatCard label="Mixtos" value={stats.mixtos} accent="text-orange-600" />
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{editandoId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Tratamiento *</label>
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
                >
                  <option value="mixto">Mixto</option>
                  <option value="medicina">Medicina</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="enfermeria">Enfermería</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Notas internas o contexto del protocolo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicios incluidos</label>
              <div className="flex gap-3">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  onChange={(e) => {
                    if (e.target.value) añadirServicio(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                >
                  <option value="">Añadir servicio…</option>
                  {catalogoServicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  onClick={() => setFormData({ ...formData, serviciosIncluidos: [] })}
                >
                  Limpiar
                </button>
              </div>

              {formData.serviciosIncluidos.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {formData.serviciosIncluidos.map((servicio, index) => (
                    <li key={servicio.servicioId} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{servicio.servicioNombre}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-sm text-gray-500 hover:text-gray-700"
                            onClick={() => moverServicio(index, 'arriba')}
                            title="Mover arriba"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="text-sm text-gray-500 hover:text-gray-700"
                            onClick={() => moverServicio(index, 'abajo')}
                            title="Mover abajo"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="text-sm text-gray-500 hover:text-gray-700"
                            onClick={() => toggleOpcional(servicio.servicioId)}
                          >
                            {servicio.opcional ? 'Opcional' : 'Obligatorio'}
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 text-sm"
                            onClick={() => eliminarServicioDelTratamiento(servicio.servicioId)}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Orden: {servicio.orden}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Tratamiento activo
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium text-gray-700">Filtrar por categoría:</p>
        <div className="flex flex-wrap gap-2">
          {['todos', 'medicina', 'fisioterapia', 'enfermeria', 'mixto'].map((categoria) => (
            <button
              key={categoria}
              onClick={() => setFiltroCategoria(categoria)}
              className={`px-3 py-1 rounded-full text-sm border ${
                filtroCategoria === categoria ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'
              }`}
            >
              {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tratamientosFiltrados.map((tratamiento) => (
          <div key={tratamiento.id} className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900">{tratamiento.nombre}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorCategoria(tratamiento.categoria)}`}>
                    {tratamiento.categoria}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tratamiento.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tratamiento.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {tratamiento.descripcion && <p className="text-sm text-gray-600 mt-1">{tratamiento.descripcion}</p>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActivo(tratamiento.id, tratamiento.activo)}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <List className="w-4 h-4" />
                  {tratamiento.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => iniciarEdicion(tratamiento)}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => eliminarTratamiento(tratamiento.id)}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {tratamiento.tiempoTotalEstimado} min. estimados
              </span>
              <span>
                Actualizado:{' '}
                {tratamiento.updatedAt
                  ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(tratamiento.updatedAt)
                  : '---'}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Servicios incluidos</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {tratamiento.serviciosIncluidos.map((servicio) => (
                  <div key={`${tratamiento.id}-${servicio.servicioId}`} className="rounded border border-gray-200 px-3 py-2 text-sm">
                    <p className="font-medium text-gray-900">{servicio.servicioNombre}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>Orden {servicio.orden}</span>
                      <span>{servicio.opcional ? 'Opcional' : 'Obligatorio'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {!loading && tratamientosFiltrados.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No hay tratamientos que coincidan con el filtro seleccionado.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
