'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Profesional } from '@/types';
import { Plus, Edit2, Trash2, Save, X, UserCheck, Mail, Phone, Clock, Calendar } from 'lucide-react';

export default function ProfesionalesPage() {
  const { user } = useAuth();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('todos');

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    especialidad: 'medicina' as 'medicina' | 'fisioterapia' | 'enfermeria',
    email: '',
    telefono: '',
    horasSemanales: 40,
    diasTrabajo: [] as string[],
    horaInicio: '09:00',
    horaFin: '18:00',
    activo: true,
  });

  // Cargar profesionales
  useEffect(() => {
    const q = query(collection(db, 'profesionales'), orderBy('apellidos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profesionalesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Profesional[];
      setProfesionales(profesionalesData);
    });

    return () => unsubscribe();
  }, []);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      especialidad: 'medicina',
      email: '',
      telefono: '',
      horasSemanales: 40,
      diasTrabajo: [],
      horaInicio: '09:00',
      horaFin: '18:00',
      activo: true,
    });
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  // Crear o actualizar profesional
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const datos = {
      ...formData,
      serviciosAsignados: 0,
      cargaTrabajo: 0,
      updatedAt: new Date(),
    };

    try {
      if (editandoId) {
        // Actualizar
        await updateDoc(doc(db, 'profesionales', editandoId), datos);
      } else {
        // Crear nuevo
        await addDoc(collection(db, 'profesionales'), {
          ...datos,
          createdAt: new Date(),
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error al guardar profesional:', error);
      alert('Error al guardar profesional');
    }
  };

  // Iniciar edición
  const iniciarEdicion = (prof: Profesional) => {
    setFormData({
      nombre: prof.nombre,
      apellidos: prof.apellidos,
      especialidad: prof.especialidad,
      email: prof.email,
      telefono: prof.telefono || '',
      horasSemanales: prof.horasSemanales,
      diasTrabajo: prof.diasTrabajo,
      horaInicio: prof.horaInicio,
      horaFin: prof.horaFin,
      activo: prof.activo,
    });
    setEditandoId(prof.id);
    setMostrarFormulario(true);
  };

  // Eliminar profesional
  const eliminarProfesional = async (id: string) => {
    if (!confirm('¿Eliminar este profesional? Esta acción no se puede deshacer.')) return;

    try {
      await deleteDoc(doc(db, 'profesionales', id));
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar profesional');
    }
  };

  // Toggle día de trabajo
  const toggleDia = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      diasTrabajo: prev.diasTrabajo.includes(dia)
        ? prev.diasTrabajo.filter(d => d !== dia)
        : [...prev.diasTrabajo, dia]
    }));
  };

  // Cambiar estado activo/inactivo
  const toggleActivo = async (id: string, estadoActual: boolean) => {
    try {
      await updateDoc(doc(db, 'profesionales', id), {
        activo: !estadoActual,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  // Filtrar profesionales
  const profesionalesFiltrados = profesionales.filter(prof => {
    const cumpleEspecialidad = filtroEspecialidad === 'todos' || prof.especialidad === filtroEspecialidad;
    return cumpleEspecialidad;
  });

  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  // Estadísticas
  const stats = {
    total: profesionales.length,
    activos: profesionales.filter(p => p.activo).length,
    medicina: profesionales.filter(p => p.especialidad === 'medicina').length,
    fisioterapia: profesionales.filter(p => p.especialidad === 'fisioterapia').length,
    enfermeria: profesionales.filter(p => p.especialidad === 'enfermeria').length,
  };

  const getColorEspecialidad = (especialidad: string) => {
    switch (especialidad) {
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
          <h1 className="text-3xl font-bold text-gray-900">Profesionales</h1>
          <p className="text-gray-600 mt-1">Gestión del equipo profesional de la clínica</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Profesional</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-gray-600" />
            <p className="text-sm text-gray-600">Total</p>
          </div>
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
            {editandoId ? 'Editar Profesional' : 'Nuevo Profesional'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad *</label>
                <select
                  value={formData.especialidad}
                  onChange={(e) => setFormData({...formData, especialidad: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="medicina">Medicina</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="enfermeria">Enfermería</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas Semanales</label>
                <input
                  type="number"
                  value={formData.horasSemanales}
                  onChange={(e) => setFormData({...formData, horasSemanales: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="168"
                />
              </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Días de Trabajo</label>
              <div className="flex flex-wrap gap-2">
                {diasSemana.map(dia => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDia(dia)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      formData.diasTrabajo.includes(dia)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {dia.charAt(0).toUpperCase() + dia.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="activo" className="text-sm text-gray-700">Profesional activo</label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>{editandoId ? 'Actualizar' : 'Crear'} Profesional</span>
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
          <span className="text-sm font-medium text-gray-700">Filtrar por especialidad:</span>
          <select
            value={filtroEspecialidad}
            onChange={(e) => setFiltroEspecialidad(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todos">Todas</option>
            <option value="medicina">Medicina</option>
            <option value="fisioterapia">Fisioterapia</option>
            <option value="enfermeria">Enfermería</option>
          </select>
        </div>
      </div>

      {/* Lista de Profesionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profesionalesFiltrados.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No hay profesionales registrados</p>
          </div>
        ) : (
          profesionalesFiltrados.map((prof) => (
            <div
              key={prof.id}
              className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow ${
                !prof.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {prof.nombre} {prof.apellidos}
                  </h3>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getColorEspecialidad(prof.especialidad)}`}>
                    {prof.especialidad.charAt(0).toUpperCase() + prof.especialidad.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => iniciarEdicion(prof)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => eliminarProfesional(prof.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{prof.email}</span>
                </div>
                {prof.telefono && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{prof.telefono}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{prof.horaInicio} - {prof.horaFin}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{prof.horasSemanales}h/semana</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {prof.diasTrabajo.map(dia => (
                    <span
                      key={dia}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {dia.slice(0, 3).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => toggleActivo(prof.id, prof.activo)}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
                    prof.activo
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {prof.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}