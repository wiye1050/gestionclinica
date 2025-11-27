'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Profesional } from '@/types';
import { Plus, Edit2, Trash2, Save, X, UserCheck, Mail, Phone, Clock, Calendar } from 'lucide-react';
import { sanitizeInput, sanitizeStringArray } from '@/lib/utils/sanitize';
import ColorPicker from '@/components/shared/ColorPicker';
import { DEFAULT_COLOR } from '@/components/agenda/v2/agendaHelpers';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';

interface ProfesionalesClientProps {
  initialProfesionales: Profesional[];
}

export default function ProfesionalesClient({ initialProfesionales }: ProfesionalesClientProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profesionales = [], isLoading } = useProfesionalesManager({
    initialData: initialProfesionales,
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    especialidad: 'medicina' as 'medicina' | 'fisioterapia' | 'enfermeria',
    color: DEFAULT_COLOR,
    email: '',
    telefono: '',
    horasSemanales: 40,
    diasTrabajo: [] as string[],
    horaInicio: '09:00',
    horaFin: '18:00',
    activo: true,
  });

  const invalidateProfesionales = () =>
    queryClient.invalidateQueries({ queryKey: ['profesionales'] });

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      especialidad: 'medicina',
      color: DEFAULT_COLOR,
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

  const sanitizeProfesionalPayload = (data: typeof formData) => ({
    ...data,
    nombre: sanitizeInput(data.nombre),
    apellidos: sanitizeInput(data.apellidos),
    especialidad: data.especialidad,
    email: sanitizeInput(data.email),
    telefono: data.telefono ? sanitizeInput(data.telefono) : '',
    diasTrabajo: sanitizeStringArray(data.diasTrabajo),
    horaInicio: sanitizeInput(data.horaInicio),
    horaFin: sanitizeInput(data.horaFin),
  });

  // Crear o actualizar profesional
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const sanitizedPayload = sanitizeProfesionalPayload(formData);
      const endpoint = editandoId ? `/api/profesionales/${editandoId}` : '/api/profesionales';
      const method = editandoId ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo guardar el profesional');
      }
      resetForm();
      await invalidateProfesionales();
    } catch (error) {
      captureError(error, { module: 'profesionales-client', action: 'save-profesional', metadata: { editandoId } });
      alert(error instanceof Error ? error.message : 'Error al guardar profesional');
    }
  };

  // Iniciar edición
  const iniciarEdicion = (prof: Profesional) => {
    setFormData({
      nombre: sanitizeInput(prof.nombre),
      apellidos: sanitizeInput(prof.apellidos),
      especialidad: prof.especialidad,
      color: prof.color || DEFAULT_COLOR,
      email: sanitizeInput(prof.email),
      telefono: prof.telefono ? sanitizeInput(prof.telefono) : '',
      horasSemanales: prof.horasSemanales,
      diasTrabajo: sanitizeStringArray(prof.diasTrabajo ?? []),
      horaInicio: sanitizeInput(prof.horaInicio),
      horaFin: sanitizeInput(prof.horaFin),
      activo: prof.activo,
    });
    setEditandoId(prof.id);
    setMostrarFormulario(true);
  };

  // Eliminar profesional
  const eliminarProfesional = async (id: string) => {
    if (!confirm('¿Eliminar este profesional? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`/api/profesionales/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo eliminar profesional');
      }
      await invalidateProfesionales();
    } catch (error) {
      captureError(error, { module: 'profesionales-client', action: 'delete-profesional', metadata: { id } });
      alert(error instanceof Error ? error.message : 'Error al eliminar profesional');
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
      const response = await fetch(`/api/profesionales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estadoActual }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el estado');
      }
      await invalidateProfesionales();
    } catch (error) {
      captureError(error, { module: 'profesionales-client', action: 'toggle-estado', metadata: { id } });
      alert(error instanceof Error ? error.message : 'Error al cambiar estado');
    }
  };

  const normalizedSearch = busqueda.trim().toLowerCase();

  // Filtrar profesionales
  const profesionalesFiltrados = profesionales.filter((prof) => {
    const cumpleEspecialidad = filtroEspecialidad === 'todos' || prof.especialidad === filtroEspecialidad;
    const coincideBusqueda =
      normalizedSearch.length === 0 ||
      prof.nombre.toLowerCase().includes(normalizedSearch) ||
      prof.apellidos.toLowerCase().includes(normalizedSearch) ||
      prof.email.toLowerCase().includes(normalizedSearch);
    return cumpleEspecialidad && coincideBusqueda;
  });

  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  // Estadísticas
  const stats = {
    total: profesionales.length,
    activos: profesionales.filter((p) => p.activo).length,
    medicina: profesionales.filter((p) => p.especialidad === 'medicina').length,
    fisioterapia: profesionales.filter((p) => p.especialidad === 'fisioterapia').length,
    enfermeria: profesionales.filter((p) => p.especialidad === 'enfermeria').length,
  };

  const kpiItems = [
    { id: 'total', label: 'Total profesionales', value: stats.total, helper: 'Registrados', accent: 'brand' as const },
    { id: 'activos', label: 'Activos', value: stats.activos, helper: 'Disponibles', accent: 'green' as const },
    { id: 'med', label: 'Medicina', value: stats.medicina, helper: 'Equipo médico', accent: 'blue' as const },
    { id: 'fisio', label: 'Fisioterapia', value: stats.fisioterapia, helper: 'Equipo físico', accent: 'green' as const },
  ];

  if (isLoading && profesionales.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-text-muted">Cargando profesionales…</div>
      </div>
    );
  }

  const activeFilters: ActiveFilterChip[] = [];
  if (busqueda.trim()) {
    activeFilters.push({ id: 'search', label: 'Búsqueda', value: busqueda, onRemove: () => setBusqueda('') });
  }
  if (filtroEspecialidad !== 'todos') {
    activeFilters.push({
      id: 'especialidad',
      label: 'Especialidad',
      value: filtroEspecialidad,
      onRemove: () => setFiltroEspecialidad('todos'),
    });
  }

  const clearFilters = () => {
    setBusqueda('');
    setFiltroEspecialidad('todos');
  };

  const getColorEspecialidad = (especialidad: string) => {
    switch (especialidad) {
      case 'medicina':
        return 'bg-brand-subtle text-brand';
      case 'fisioterapia':
        return 'bg-success-bg text-success';
      case 'enfermeria':
        return 'bg-warn-bg text-warn';
      default:
        return 'bg-cardHover text-text-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 panel-block px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-text">Profesionales</h1>
          <p className="mt-1 text-sm text-text-muted">Gestión del equipo profesional de la clínica.</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="inline-flex items-center gap-2 rounded-pill bg-brand px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-brand/90 focus-visible:focus-ring"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Profesional</span>
        </button>
      </div>

      {/* Estadísticas */}
      <KPIGrid
        items={kpiItems.map((item) => ({
          ...item,
          icon: item.id === 'total' ? <UserCheck className="h-5 w-5" /> : undefined,
        }))}
      />

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="panel-block p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-text">
            {editandoId ? 'Editar Profesional' : 'Nuevo Profesional'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Apellidos *</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Especialidad *</label>
                <select
                  value={formData.especialidad}
                  onChange={(e) => setFormData({...formData, especialidad: e.target.value as 'medicina' | 'fisioterapia' | 'enfermeria'})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
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
                helpText="Color identificativo en la vista multi-profesional de la agenda"
                previewText="Dr. {nombre}"
                required
              />

              <div>
                <label className="block text-sm font-medium text-text mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Horas Semanales</label>
                <input
                  type="number"
                  value={formData.horasSemanales}
                  onChange={(e) => setFormData({...formData, horasSemanales: parseInt(e.target.value)})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                  min="0"
                  max="168"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Días de Trabajo</label>
              <div className="flex flex-wrap gap-2">
                {diasSemana.map(dia => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDia(dia)}
                    className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
                      formData.diasTrabajo.includes(dia)
                        ? 'bg-brand text-text hover:bg-brand/90'
                        : 'border border-border bg-card text-text hover:bg-cardHover'
                    }`}
                  >
                    {dia.charAt(0).toUpperCase() + dia.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 panel-block px-3 py-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              <label htmlFor="activo" className="text-sm text-text">Profesional activo</label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-pill bg-brand px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-brand/90 focus-visible:focus-ring"
              >
                <Save className="w-4 h-4" />
                <span>{editandoId ? 'Actualizar' : 'Crear'} Profesional</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-cardHover focus-visible:focus-ring"
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
        search={{ value: busqueda, onChange: setBusqueda, placeholder: 'Buscar por nombre o email' }}
        selects={[
          {
            id: 'especialidad',
            label: 'Especialidad',
            value: filtroEspecialidad,
            onChange: setFiltroEspecialidad,
            options: [
              { value: 'todos', label: 'Todas' },
              { value: 'medicina', label: 'Medicina' },
              { value: 'fisioterapia', label: 'Fisioterapia' },
              { value: 'enfermeria', label: 'Enfermería' },
            ],
          },
        ]}
        activeFilters={activeFilters}
        onClear={activeFilters.length ? clearFilters : undefined}
      />

      {/* Lista de Profesionales */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profesionalesFiltrados.length === 0 ? (
          <div className="col-span-full panel-block p-8 text-center shadow-sm">
            <p className="text-text-muted">No hay profesionales registrados.</p>
          </div>
        ) : (
          profesionalesFiltrados.map((prof) => (
            <div
              key={prof.id}
              className={`panel-block p-6 shadow-sm transition-shadow hover:shadow-md ${
                !prof.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: prof.color || '#3B82F6' }}
                      title={`Color: ${prof.color || '#3B82F6'}`}
                    />
                    <h3 className="text-lg font-semibold text-text">
                      {prof.nombre} {prof.apellidos}
                    </h3>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getColorEspecialidad(prof.especialidad)}`}>
                    {prof.especialidad.charAt(0).toUpperCase() + prof.especialidad.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => iniciarEdicion(prof)}
                    className="text-brand transition-colors hover:text-brand/80"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => eliminarProfesional(prof.id)}
                    className="text-danger transition-colors hover:text-danger/80"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{prof.email}</span>
                </div>
                {prof.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{prof.telefono}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{prof.horaInicio} - {prof.horaFin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{prof.horasSemanales}h/semana</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-1">
                  {prof.diasTrabajo.map(dia => (
                    <span
                      key={dia}
                      className="rounded-full bg-brand-subtle px-2 py-1 text-xs font-medium text-brand"
                    >
                      {dia.slice(0, 3).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => toggleActivo(prof.id, prof.activo)}
                  className={`w-full rounded-pill px-4 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
                    prof.activo
                      ? 'bg-success-bg text-success hover:bg-success-bg'
                      : 'border border-border bg-card text-text hover:bg-cardHover'
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
