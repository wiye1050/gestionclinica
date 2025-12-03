'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  BarChart3,
  Calendar,
  User,
  Clock,
  Download,
  Archive,
} from 'lucide-react';
import type { FormularioPlantilla, RespuestaFormulario } from '@/types';
import { Badge } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { KPIGrid } from '@/components/shared/KPIGrid';
import { formatDate } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface DetallePlantillaClientProps {
  plantilla: FormularioPlantilla;
  respuestas: RespuestaFormulario[];
}

const TIPOS_FORMULARIO: Record<string, string> = {
  triaje_telefonico: 'Triaje Telefónico',
  exploracion_fisica: 'Exploración Física',
  peticion_pruebas: 'Petición de Pruebas',
  hoja_recomendaciones: 'Recomendaciones',
  consentimiento_informado: 'Consentimiento',
  citacion: 'Citación',
  valoracion_inicial: 'Valoración Inicial',
  seguimiento: 'Seguimiento',
  alta_medica: 'Alta Médica',
  informe_clinico: 'Informe Clínico',
  receta_medica: 'Receta',
  volante_derivacion: 'Volante',
  otro: 'Otro',
};

const ESTADOS_PLANTILLA: Record<string, { label: string; tone: 'success' | 'warn' | 'danger' | 'muted' }> = {
  activo: { label: 'Activo', tone: 'success' },
  inactivo: { label: 'Inactivo', tone: 'muted' },
  borrador: { label: 'Borrador', tone: 'warn' },
  archivado: { label: 'Archivado', tone: 'danger' },
};

const TIPOS_CAMPO: Record<string, string> = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  number: 'Número',
  email: 'Email',
  tel: 'Teléfono',
  date: 'Fecha',
  time: 'Hora',
  datetime: 'Fecha y hora',
  select: 'Selector',
  radio: 'Opción única',
  checkbox: 'Casillas',
  file: 'Archivo',
  signature: 'Firma',
  heading: 'Encabezado',
  paragraph: 'Párrafo',
};

export default function DetallePlantillaClient({
  plantilla,
  respuestas,
}: DetallePlantillaClientProps) {
  const router = useRouter();
  const [mostrarTodosCampos, setMostrarTodosCampos] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const estadoConfig = ESTADOS_PLANTILLA[plantilla.estado] || ESTADOS_PLANTILLA.activo;

  const handleDuplicate = async () => {
    if (isDuplicating) return;

    const confirmed = confirm(
      `¿Deseas duplicar la plantilla "${plantilla.nombre}"?\n\nSe creará una copia como borrador.`
    );
    if (!confirmed) return;

    setIsDuplicating(true);
    try {
      const duplicada = {
        nombre: `${plantilla.nombre} (Copia)`,
        descripcion: plantilla.descripcion,
        tipo: plantilla.tipo,
        estado: 'borrador' as const,
        campos: plantilla.campos,
        secciones: plantilla.secciones,
        requiereValidacionMedica: plantilla.requiereValidacionMedica,
        generaPDF: plantilla.generaPDF,
        templatePDF: plantilla.templatePDF,
        rolesPermitidos: plantilla.rolesPermitidos,
        especialidadesPermitidas: plantilla.especialidadesPermitidas,
        notificarAlCompletar: plantilla.notificarAlCompletar,
        emailsNotificacion: plantilla.emailsNotificacion,
        creadoPor: plantilla.creadoPor,
        metadatos: plantilla.metadatos,
      };

      const response = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicada),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al duplicar plantilla');
      }

      const result = await response.json();
      toast.success('Plantilla duplicada correctamente');
      router.push(`/dashboard/formularios/${result.id}/editar`);
    } catch (error) {
      logger.error('Error duplicando plantilla:', error);
      toast.error(error instanceof Error ? error.message : 'Error al duplicar plantilla');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleArchive = async () => {
    if (isArchiving) return;

    const confirmed = confirm(
      `¿Archivar la plantilla "${plantilla.nombre}"?\n\nLa plantilla no se eliminará, pero dejará de estar activa.`
    );
    if (!confirmed) return;

    setIsArchiving(true);
    try {
      const response = await fetch(`/api/formularios/${plantilla.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'archivado' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al archivar plantilla');
      }

      toast.success('Plantilla archivada correctamente');
      router.refresh();
    } catch (error) {
      logger.error('Error archivando plantilla:', error);
      toast.error(error instanceof Error ? error.message : 'Error al archivar plantilla');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmed = confirm(
      `⚠️ ¿ELIMINAR PERMANENTEMENTE la plantilla "${plantilla.nombre}"?\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `Si tiene respuestas asociadas, no podrá eliminarse (solo archivar).\n\n` +
      `¿Estás completamente seguro?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/formularios/${plantilla.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.suggestion) {
          toast.error(`${errorData.error}\n\n${errorData.suggestion}`);
        } else {
          throw new Error(errorData.error || 'Error al eliminar plantilla');
        }
        return;
      }

      toast.success('Plantilla eliminada correctamente');
      router.push('/dashboard/formularios');
    } catch (error) {
      logger.error('Error eliminando plantilla:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar plantilla');
    } finally {
      setIsDeleting(false);
    }
  };

  // KPIs
  const respuestasCompletadas = respuestas.filter(r => r.estado === 'completado').length;
  const tiempoPromedioMinutos = respuestas
    .filter(r => r.tiempoCompletado)
    .reduce((sum, r) => sum + (r.tiempoCompletado || 0), 0) / (respuestas.length || 1);

  const kpis = [
    {
      label: 'Total Vistas',
      value: plantilla.totalVistas,
      helper: 'Formulario visualizado',
      accent: 'blue' as const,
    },
    {
      label: 'Respuestas',
      value: plantilla.totalRespuestas,
      helper: `${respuestasCompletadas} completadas`,
      accent: 'brand' as const,
    },
    {
      label: 'Conversión',
      value: `${plantilla.tasaConversion.toFixed(1)}%`,
      helper: 'Completados / Vistos',
      accent: 'green' as const,
    },
    {
      label: 'Tiempo Promedio',
      value: `${Math.round(tiempoPromedioMinutos)}min`,
      helper: 'Para completar',
      accent: 'purple' as const,
    },
  ];

  const camposMostrados = mostrarTodosCampos ? plantilla.campos : plantilla.campos.slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/formularios">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{plantilla.nombre}</h1>
              <Badge tone={estadoConfig.tone}>{estadoConfig.label}</Badge>
              <Badge tone="muted">v{plantilla.version}</Badge>
            </div>
            <p className="text-sm text-gray-500">
              {TIPOS_FORMULARIO[plantilla.tipo]} • Creado {formatDate(plantilla.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/formularios/${plantilla.id}/editar`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isDuplicating ? 'Duplicando...' : 'Duplicar'}
          </Button>
          {plantilla.estado !== 'archivado' && (
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={isArchiving}
            >
              <Archive className="w-4 h-4 mr-2" />
              {isArchiving ? 'Archivando...' : 'Archivar'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2 text-red-500" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>

      {/* Descripción */}
      {plantilla.descripcion && (
        <Card>
          <p className="text-gray-700">{plantilla.descripcion}</p>
        </Card>
      )}

      {/* KPIs */}
      <KPIGrid items={kpis} />

      {/* Configuración */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Validación Médica</p>
            <p className="font-medium text-gray-900">
              {plantilla.requiereValidacionMedica ? 'Requerida' : 'No requerida'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Genera PDF</p>
            <p className="font-medium text-gray-900">
              {plantilla.generaPDF ? 'Sí' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Notificaciones</p>
            <p className="font-medium text-gray-900">
              {plantilla.notificarAlCompletar ? 'Activadas' : 'Desactivadas'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Campos</p>
            <p className="font-medium text-gray-900">
              {plantilla.campos.length} campos
            </p>
          </div>
        </div>

        {plantilla.notificarAlCompletar && plantilla.emailsNotificacion && plantilla.emailsNotificacion.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Emails de notificación:</p>
            <div className="flex flex-wrap gap-2">
              {plantilla.emailsNotificacion.map((email, idx) => (
                <Badge key={idx} tone="muted">{email}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Campos del Formulario */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Campos del Formulario ({plantilla.campos.length})
          </h2>
          {plantilla.campos.length > 10 && (
            <Button
              variant="outline"
              onClick={() => setMostrarTodosCampos(!mostrarTodosCampos)}
            >
              {mostrarTodosCampos ? 'Ver menos' : 'Ver todos'}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {camposMostrados.map((campo) => (
            <div
              key={campo.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">{campo.etiqueta}</p>
                  {campo.requerido && (
                    <Badge tone="danger">Requerido</Badge>
                  )}
                  <Badge tone="muted">{TIPOS_CAMPO[campo.tipo]}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Campo: <code className="text-xs bg-white px-1 py-0.5 rounded">{campo.nombre}</code>
                </p>
                {campo.descripcion && (
                  <p className="text-sm text-gray-500 mt-1">{campo.descripcion}</p>
                )}
                {campo.placeholder && (
                  <p className="text-xs text-gray-400 mt-1">
                    Placeholder: &quot;{campo.placeholder}&quot;
                  </p>
                )}
                {campo.opciones && campo.opciones.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {campo.opciones.map((opcion, idx) => (
                      <Badge key={idx} tone="muted">{opcion.etiqueta}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Orden: {campo.orden + 1}
              </div>
            </div>
          ))}
        </div>

        {!mostrarTodosCampos && plantilla.campos.length > 10 && (
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-500">
              Mostrando {camposMostrados.length} de {plantilla.campos.length} campos
            </p>
          </div>
        )}
      </Card>

      {/* Respuestas Recientes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Respuestas Recientes ({respuestas.length})
          </h2>
          {respuestas.length > 0 && (
            <Link href={`/dashboard/formularios/${plantilla.id}/respuestas`}>
              <Button variant="outline">
                Ver todas
              </Button>
            </Link>
          )}
        </div>

        {respuestas.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Aún no hay respuestas para este formulario
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Las respuestas completadas aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {respuestas.slice(0, 10).map((respuesta) => {
              const estadoRespuesta = respuesta.estado;
              const estadoBadge = {
                borrador: { label: 'Borrador', tone: 'warn' as const },
                completado: { label: 'Completado', tone: 'success' as const },
                validado: { label: 'Validado', tone: 'success' as const },
                archivado: { label: 'Archivado', tone: 'muted' as const },
              }[estadoRespuesta] || { label: 'Borrador', tone: 'warn' as const };

              return (
                <div
                  key={respuesta.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{respuesta.pacienteNombre}</p>
                      {respuesta.pacienteNHC && (
                        <Badge tone="muted">NHC: {respuesta.pacienteNHC}</Badge>
                      )}
                      <Badge tone={estadoBadge.tone}>{estadoBadge.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(respuesta.createdAt)}</span>
                      </div>
                      {respuesta.tiempoCompletado && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.round(respuesta.tiempoCompletado)} min</span>
                        </div>
                      )}
                      {respuesta.pdfGenerado && (
                        <div className="flex items-center gap-1 text-brand">
                          <FileText className="w-4 h-4" />
                          <span>PDF generado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link href={`/dashboard/formularios/respuestas/${respuesta.id}`}>
                      <Button variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    {respuesta.pdfUrl && (
                      <a href={respuesta.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {respuestas.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Mostrando las 10 respuestas más recientes de {respuestas.length}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
