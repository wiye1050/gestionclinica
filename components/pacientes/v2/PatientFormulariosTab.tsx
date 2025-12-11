'use client';

import { useState } from 'react';
import { Plus, FileText, Calendar, Eye, Download, CheckCircle, AlertCircle } from 'lucide-react';
import type { RespuestaFormulario } from '@/types';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/helpers';

interface PatientFormulariosTabProps {
  _pacienteId: string;
  respuestas: RespuestaFormulario[];
  onNuevoFormulario?: () => void;
}

export default function PatientFormulariosTab({
  _pacienteId,
  respuestas,
  onNuevoFormulario,
}: PatientFormulariosTabProps) {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'completado' | 'validado' | 'borrador'>('todos');

  const respuestasFiltradas = respuestas.filter((respuesta) => {
    if (filtroEstado === 'todos') return true;
    return respuesta.estado === filtroEstado;
  });

  // Agrupar por tipo de formulario
  const respuestasPorTipo = respuestasFiltradas.reduce((acc, respuesta) => {
    const tipo = respuesta.formularioNombre;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(respuesta);
    return acc;
  }, {} as Record<string, RespuestaFormulario[]>);

  const totalCompletados = respuestas.filter(r => r.estado === 'completado' || r.estado === 'validado').length;
  const totalBorradores = respuestas.filter(r => r.estado === 'borrador').length;
  const totalValidados = respuestas.filter(r => r.estado === 'validado').length;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Formularios Clínicos
            </h2>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{totalCompletados} completados</span>
              <span>{totalValidados} validados</span>
              {totalBorradores > 0 && <span className="text-amber-600">{totalBorradores} borradores</span>}
            </div>
          </div>
          {onNuevoFormulario && (
            <Button variant="primary" onClick={onNuevoFormulario}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Formulario
            </Button>
          )}
        </div>
      </Card>

      {/* Filtros */}
      <Card>
        <div className="flex gap-2">
          <Button
            variant={filtroEstado === 'todos' ? 'primary' : 'outline'}
            onClick={() => setFiltroEstado('todos')}
          >
            Todos ({respuestas.length})
          </Button>
          <Button
            variant={filtroEstado === 'completado' ? 'primary' : 'outline'}
            onClick={() => setFiltroEstado('completado')}
          >
            Completados ({respuestas.filter(r => r.estado === 'completado').length})
          </Button>
          <Button
            variant={filtroEstado === 'validado' ? 'primary' : 'outline'}
            onClick={() => setFiltroEstado('validado')}
          >
            Validados ({totalValidados})
          </Button>
          {totalBorradores > 0 && (
            <Button
              variant={filtroEstado === 'borrador' ? 'primary' : 'outline'}
              onClick={() => setFiltroEstado('borrador')}
            >
              Borradores ({totalBorradores})
            </Button>
          )}
        </div>
      </Card>

      {/* Lista de formularios */}
      {respuestasFiltradas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">
              {filtroEstado !== 'todos'
                ? `No hay formularios ${filtroEstado}s`
                : 'Aun no hay formularios completados para este paciente'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {onNuevoFormulario
                ? 'Haz clic en "Nuevo Formulario" para comenzar'
                : 'Los formularios apareceran aqui cuando se completen'}
            </p>
            {onNuevoFormulario && respuestas.length === 0 && (
              <div className="mt-6">
                <Button variant="primary" onClick={onNuevoFormulario}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Formulario
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(respuestasPorTipo).map(([tipo, respuestasDelTipo]) => (
            <Card key={tipo}>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand" />
                    <h3 className="font-semibold text-gray-900">{tipo}</h3>
                    <Badge tone="muted">{respuestasDelTipo.length}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {respuestasDelTipo.map((respuesta) => {
                    const estadoBadge = {
                      borrador: { label: 'Borrador', tone: 'warn' as const, icon: AlertCircle },
                      completado: { label: 'Completado', tone: 'success' as const, icon: CheckCircle },
                      validado: { label: 'Validado', tone: 'success' as const, icon: CheckCircle },
                      archivado: { label: 'Archivado', tone: 'muted' as const, icon: FileText },
                    }[respuesta.estado] || { label: 'Borrador', tone: 'warn' as const, icon: AlertCircle };

                    const Icon = estadoBadge.icon;

                    return (
                      <div
                        key={respuesta.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(respuesta.createdAt)}
                            </span>
                            <Badge tone={estadoBadge.tone}>
                              <Icon className="w-3 h-3 mr-1 inline" />
                              {estadoBadge.label}
                            </Badge>
                            {respuesta.pdfGenerado && (
                              <Badge tone="muted">
                                <FileText className="w-3 h-3 mr-1 inline" />
                                PDF
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-xs text-gray-700">
                            {respuesta.formularioVersion && (
                              <span>v{respuesta.formularioVersion}</span>
                            )}
                            {respuesta.validadoPor && (
                              <span className="text-green-700 font-medium">
                                Validado por {respuesta.validadoPorNombre}
                              </span>
                            )}
                            {respuesta.tiempoCompletado && (
                              <span>
                                {Math.round(respuesta.tiempoCompletado)} min
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <a
                            href={`/dashboard/formularios/respuestas/${respuesta.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </a>
                          {respuesta.pdfUrl && (
                            <a
                              href={respuesta.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
