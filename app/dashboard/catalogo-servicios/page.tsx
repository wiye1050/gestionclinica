'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { CatalogoServicio, Profesional } from '@/types';
import { Plus, Edit2, Trash2, Save, X, Clock, CheckSquare, Square, AlertCircle } from 'lucide-react';

export default function CatalogoServiciosPage() {
  const { user } = useAuth();
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'medicina' as 'medicina' | 'fisioterapia' | 'enfermeria',
    descripcion: '',
    tiempoEstimado: 30,
    requiereSala: true,
    salaPredeterminada: '',
    requiereSupervision: false,
    requiereApoyo: false,
    frecuenciaMensual: 0,
    cargaMensualEstimada: '',
    profesionalesHabilitados: [] as string[],
    activo: true,
  });

  // Cargar datos
  useEffect(() => {
    // Cargar servicios
    const qServicios = query(collection(db, 'catalogo-servicios'), orderBy('nombre'));
    const unsubServicios = onSnapshot(qServicios, (snapshot) => {
      const serviciosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as CatalogoServicio[];
      setServicios(serviciosData);
    });

    // Cargar profesionales
    const qProfesionales = query(collection(db, 'profesionales'), orderBy('apellidos'));
    const unsubProfesionales = onSnapshot(qProfesionales, (snapshot) => {
      const profesionalesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Profesional[];
      setProfesionales(profesionalesData.filter(p => p.activo));
    });

    return () => {
      unsubServicios();
      unsubProfesionales();
    };
  }, []);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'medicina',
      descripcion: '',
      tiempoEstimado: 30,
      requiereSala: true,
      salaPredeterminada: '',
      requiereSupervision: false,
      requiereApoyo: false,
      frecuenciaMensual: 0,
      cargaMensualEstimada: '',
      profesionalesHabilitados: [],
      activo: true,
    });
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  // Crear o actualizar servicio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const datos = {
      ...formData,
      updatedAt: new Date(),
    };

    try {
      if (editandoId) {
        await updateDoc(doc(db, 'catalogo-servicios', editandoId), datos);
      } else {
        await addDoc(collection(db, 'catalogo-servicios'), {
          ...datos,
          createdAt: new Date(),
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      alert('Error al guardar servicio');
    }
  };

  // Iniciar edición
  const iniciarEdicion = (servicio: CatalogoServicio) => {
    setFormData({
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      descripcion: servicio.descripcion || '',
      tiempoEstimado: servicio.tiempoEstimado,
      requiereSala: servicio.requiereSala,
      salaPredeterminada: servicio.salaPredeterminada || '',
      requiereSupervision: servicio.requiereSupervision,
      requiereApoyo: servicio.requiereApoyo,
      frecuenciaMensual: servicio.frecuenciaMensual || 0,
      cargaMensualEstimada: servicio.cargaMensualEstimada || '',
      profesionalesHabilitados: servicio.profesionalesHabilitados,
      activo: servicio.activo,
    });
    setEditandoId(servicio.id);
    setMostrarFormulario(true);
  };

  // Eliminar servicio
  const eliminarServicio = async (id: string) => {
    if (!confirm('¿Eliminar este servicio del catálogo? Esta acción no se puede deshacer.')) return;

    try {
      await deleteDoc(doc(db, 'catalogo-servicios', id));
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar servicio');
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
      await updateDoc(doc(db, 'catalogo-servicios', id), {
        activo: !estadoActual,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  // Filtrar servicios
  const serviciosFiltrados = servicios.filter(servicio => {
    const cumpleCategoria = filtroCategoria === 'todos' || servicio.categoria === filtroCategoria;
    return cumpleCategoria;
  });

  // Estadísticas
  const stats = {
    total: servicios.length,
    activos: servicios.filter(s => s.activo).length,
    medicina: servicios.filter(s => s.categoria === 'medicina').length,
    fisioterapia: servicios.filter(s => s.categoria === 'fisioterapia').length,
    enfermeria: servicios.filter(s => s.categoria === 'enfermeria').length,
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
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Servicios</p>
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
      </div>

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
                  onChange={(e) => setFormData({...formData, categoria: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="medicina">Medicina</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="enfermeria">Enfermería</option>
                </select>
              </div>

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
                        ? 'bg-blue-600 text-white'
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
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
          </select>
        </div>
      </div>

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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {servicio.nombre}
                  </h3>
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