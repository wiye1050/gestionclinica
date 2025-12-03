'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { TipoFormulario, TipoCampoFormulario, CampoFormulario, FormularioPlantilla, EstadoFormularioPlantilla } from '@/types';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { logger } from '@/lib/utils/logger';

interface EditarPlantillaClientProps {
  plantilla: FormularioPlantilla;
  userId: string;
}

const TIPOS_FORMULARIO: Array<{ value: TipoFormulario; label: string }> = [
  { value: 'triaje_telefonico', label: 'Triaje Telefónico' },
  { value: 'exploracion_fisica', label: 'Exploración Física' },
  { value: 'peticion_pruebas', label: 'Petición de Pruebas' },
  { value: 'hoja_recomendaciones', label: 'Hoja de Recomendaciones' },
  { value: 'consentimiento_informado', label: 'Consentimiento Informado' },
  { value: 'citacion', label: 'Citación' },
  { value: 'valoracion_inicial', label: 'Valoración Inicial' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'alta_medica', label: 'Alta Médica' },
  { value: 'informe_clinico', label: 'Informe Clínico' },
  { value: 'receta_medica', label: 'Receta Médica' },
  { value: 'volante_derivacion', label: 'Volante de Derivación' },
  { value: 'otro', label: 'Otro' },
];

const TIPOS_CAMPO: Array<{ value: TipoCampoFormulario; label: string }> = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Teléfono' },
  { value: 'date', label: 'Fecha' },
  { value: 'time', label: 'Hora' },
  { value: 'select', label: 'Selección' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'yesno', label: 'Sí/No' },
  { value: 'scale', label: 'Escala (1-10)' },
  { value: 'signature', label: 'Firma' },
];

export default function EditarPlantillaClient({ plantilla, userId }: EditarPlantillaClientProps) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  // Estado del formulario - precargar con datos existentes
  const [nombre, setNombre] = useState(plantilla.nombre);
  const [descripcion, setDescripcion] = useState(plantilla.descripcion || '');
  const [tipo, setTipo] = useState<TipoFormulario>(plantilla.tipo);
  const [estado, setEstado] = useState<EstadoFormularioPlantilla>(plantilla.estado);
  const [requiereValidacion, setRequiereValidacion] = useState(plantilla.requiereValidacionMedica);
  const [generaPDF, setGeneraPDF] = useState(plantilla.generaPDF);
  const [notificarAlCompletar, setNotificarAlCompletar] = useState(plantilla.notificarAlCompletar || false);
  const [emailsNotificacion, setEmailsNotificacion] = useState(
    plantilla.emailsNotificacion?.join(', ') || ''
  );

  // Campos del formulario - precargar
  const [campos, setCampos] = useState<CampoFormulario[]>(plantilla.campos);
  const [mostrandoNuevoCampo, setMostrandoNuevoCampo] = useState(false);

  // Nuevo campo temporal
  const [nuevoCampo, setNuevoCampo] = useState<Partial<CampoFormulario>>({
    nombre: '',
    etiqueta: '',
    tipo: 'text',
    requerido: false,
    ancho: 'full',
    orden: campos.length,
  });

  const agregarCampo = () => {
    if (!nuevoCampo.nombre || !nuevoCampo.etiqueta) {
      toast.error('Completa el nombre y etiqueta del campo');
      return;
    }

    const campo: CampoFormulario = {
      id: `campo_${Date.now()}`,
      nombre: nuevoCampo.nombre || '',
      etiqueta: nuevoCampo.etiqueta || '',
      tipo: nuevoCampo.tipo || 'text',
      requerido: nuevoCampo.requerido || false,
      ancho: nuevoCampo.ancho || 'full',
      orden: campos.length,
    };

    setCampos([...campos, campo]);
    setNuevoCampo({
      nombre: '',
      etiqueta: '',
      tipo: 'text',
      requerido: false,
      ancho: 'full',
      orden: campos.length + 1,
    });
    setMostrandoNuevoCampo(false);
    toast.success('Campo añadido');
  };

  const eliminarCampo = (id: string) => {
    setCampos(campos.filter(c => c.id !== id));
    toast.success('Campo eliminado');
  };

  const guardarCambios = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (campos.length === 0) {
      toast.error('Añade al menos un campo al formulario');
      return;
    }

    setGuardando(true);

    try {
      const plantillaActualizada = {
        ...plantilla,
        nombre,
        descripcion,
        tipo,
        estado,
        campos,
        requiereValidacionMedica: requiereValidacion,
        generaPDF,
        templatePDF: generaPDF ? tipo : undefined,
        notificarAlCompletar,
        emailsNotificacion: notificarAlCompletar ? emailsNotificacion.split(',').map(e => e.trim()) : [],
        modificadoPor: userId,
      };

      const response = await fetch(`/api/formularios/${plantilla.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plantillaActualizada),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar plantilla');
      }

      toast.success('Plantilla actualizada correctamente');
      router.push(`/dashboard/formularios/${plantilla.id}`);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/formularios/${plantilla.id}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Plantilla de Formulario</h1>
            <p className="text-sm text-gray-500 mt-1">
              Modifica la configuración y campos del formulario
            </p>
          </div>
        </div>
      </div>

      {/* Información básica */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del formulario *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Triaje Telefónico COVID-19"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el propósito de este formulario..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de formulario *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoFormulario)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                {TIPOS_FORMULARIO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoFormularioPlantilla)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="borrador">Borrador</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="archivado">Archivado</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuración */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={requiereValidacion}
                onChange={(e) => setRequiereValidacion(e.target.checked)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Requiere validación médica</span>
                <p className="text-xs text-gray-500">Las respuestas deben ser validadas por un profesional</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={generaPDF}
                onChange={(e) => setGeneraPDF(e.target.checked)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Genera PDF automáticamente</span>
                <p className="text-xs text-gray-500">Se creará un PDF al completar el formulario</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificarAlCompletar}
                onChange={(e) => setNotificarAlCompletar(e.target.checked)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Notificar al completar</span>
                <p className="text-xs text-gray-500">Enviar notificaciones cuando se complete el formulario</p>
              </div>
            </label>

            {notificarAlCompletar && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emails para notificaciones (separados por coma)
                </label>
                <input
                  type="text"
                  value={emailsNotificacion}
                  onChange={(e) => setEmailsNotificacion(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Campos del formulario */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Campos del Formulario</h2>
            <Button
              variant="outline"
              onClick={() => setMostrandoNuevoCampo(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Campo
            </Button>
          </div>

          {/* Lista de campos */}
          {campos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay campos añadidos. Añade tu primer campo.
            </div>
          ) : (
            <div className="space-y-2">
              {campos.map((campo) => (
                <div
                  key={campo.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{campo.etiqueta}</span>
                      <Badge tone="muted">{TIPOS_CAMPO.find(t => t.value === campo.tipo)?.label}</Badge>
                      {campo.requerido && <Badge tone="warn">Requerido</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{campo.nombre}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => eliminarCampo(campo.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario de nuevo campo */}
          {mostrandoNuevoCampo && (
            <div className="p-4 border-2 border-brand rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900">Nuevo Campo</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre interno *
                  </label>
                  <input
                    type="text"
                    value={nuevoCampo.nombre}
                    onChange={(e) => setNuevoCampo({ ...nuevoCampo, nombre: e.target.value })}
                    placeholder="nombre_campo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiqueta visible *
                  </label>
                  <input
                    type="text"
                    value={nuevoCampo.etiqueta}
                    onChange={(e) => setNuevoCampo({ ...nuevoCampo, etiqueta: e.target.value })}
                    placeholder="Nombre del Campo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de campo *
                  </label>
                  <select
                    value={nuevoCampo.tipo}
                    onChange={(e) => setNuevoCampo({ ...nuevoCampo, tipo: e.target.value as TipoCampoFormulario })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  >
                    {TIPOS_CAMPO.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho
                  </label>
                  <select
                    value={nuevoCampo.ancho}
                    onChange={(e) => setNuevoCampo({ ...nuevoCampo, ancho: e.target.value as 'full' | 'half' | 'third' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  >
                    <option value="full">Ancho completo</option>
                    <option value="half">Mitad</option>
                    <option value="third">Un tercio</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={nuevoCampo.requerido}
                  onChange={(e) => setNuevoCampo({ ...nuevoCampo, requerido: e.target.checked })}
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                />
                <span className="text-sm font-medium text-gray-700">Campo requerido</span>
              </label>

              <div className="flex gap-2">
                <Button variant="primary" onClick={agregarCampo}>
                  Añadir Campo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMostrandoNuevoCampo(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Acciones finales */}
      <div className="flex gap-3 justify-end">
        <Link href={`/dashboard/formularios/${plantilla.id}`}>
          <Button variant="outline">
            Cancelar
          </Button>
        </Link>
        <Button
          variant="primary"
          onClick={guardarCambios}
          disabled={guardando}
        >
          <Save className="w-4 h-4 mr-2" />
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
