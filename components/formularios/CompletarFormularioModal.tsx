'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Search, ChevronRight } from 'lucide-react';
import type { FormularioPlantilla, Paciente } from '@/types';
import { Button } from '@/components/ui';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface CompletarFormularioModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  userId: string;
}

const TIPOS_FORMULARIO: Record<string, string> = {
  triaje_telefonico: 'Triaje Telefonico',
  exploracion_fisica: 'Exploracion Fisica',
  peticion_pruebas: 'Peticion de Pruebas',
  hoja_recomendaciones: 'Recomendaciones',
  consentimiento_informado: 'Consentimiento',
  citacion: 'Citacion',
  valoracion_inicial: 'Valoracion Inicial',
  seguimiento: 'Seguimiento',
  alta_medica: 'Alta Medica',
  informe_clinico: 'Informe Clinico',
  receta_medica: 'Receta',
  volante_derivacion: 'Volante',
  otro: 'Otro',
};

const ESTADOS_BADGE: Record<string, { label: string; tone: 'success' | 'warn' | 'muted' }> = {
  activo: { label: 'Activo', tone: 'success' },
  borrador: { label: 'Borrador', tone: 'warn' },
  inactivo: { label: 'Inactivo', tone: 'muted' },
  archivado: { label: 'Archivado', tone: 'muted' },
};

export default function CompletarFormularioModal({
  isOpen,
  onClose,
  paciente,
  userId,
}: CompletarFormularioModalProps) {
  const router = useRouter();
  const [plantillas, setPlantillas] = useState<FormularioPlantilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebounce(busqueda, 300); // Debounce search for better performance
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');

  useEffect(() => {
    if (isOpen) {
      cargarPlantillas();
    }
  }, [isOpen]);

  const cargarPlantillas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/formularios?estado=activo');
      if (!response.ok) throw new Error('Error al cargar plantillas');
      const data = await response.json();
      setPlantillas(data);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      toast.error('Error al cargar formularios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPlantilla = async (plantilla: FormularioPlantilla) => {
    try {
      // Crear una respuesta en estado borrador
      const nuevaRespuesta = {
        formularioPlantillaId: plantilla.id,
        formularioNombre: plantilla.nombre,
        formularioTipo: plantilla.tipo,
        formularioVersion: plantilla.version,
        pacienteId: paciente.id,
        pacienteNombre: `${paciente.nombre} ${paciente.apellidos}`,
        pacienteNHC: paciente.numeroHistoria,
        respuestas: {},
        estado: 'borrador' as const,
        requiereSeguimiento: false,
        creadoPor: userId,
      };

      const response = await fetch('/api/formularios/respuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaRespuesta),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear formulario');
      }

      const result = await response.json();
      toast.success('Formulario iniciado correctamente');

      // Redirigir a una pagina de completar formulario
      router.push(`/dashboard/formularios/completar/${result.id}?pacienteId=${paciente.id}`);
    } catch (error) {
      console.error('Error al seleccionar plantilla:', error);
      toast.error(error instanceof Error ? error.message : 'Error al iniciar formulario');
    }
  };

  const plantillasFiltradas = plantillas.filter((plantilla) => {
    const matchBusqueda = busquedaDebounced === '' ||
      plantilla.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
      plantilla.descripcion?.toLowerCase().includes(busquedaDebounced.toLowerCase());

    const matchTipo = tipoFiltro === 'todos' || plantilla.tipo === tipoFiltro;

    return matchBusqueda && matchTipo;
  });

  // Obtener tipos unicos de las plantillas
  const tiposDisponibles = Array.from(new Set(plantillas.map(p => p.tipo)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Completar Formulario
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Paciente: {paciente.nombre} {paciente.apellidos} ({paciente.numeroHistoria})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Busqueda y filtros */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar formularios..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={tipoFiltro === 'todos' ? 'primary' : 'outline'}
              onClick={() => setTipoFiltro('todos')}
            >
              Todos ({plantillas.length})
            </Button>
            {tiposDisponibles.map((tipo) => {
              const count = plantillas.filter(p => p.tipo === tipo).length;
              return (
                <Button
                  key={tipo}
                  variant={tipoFiltro === tipo ? 'primary' : 'outline'}
                  onClick={() => setTipoFiltro(tipo)}
                >
                  {TIPOS_FORMULARIO[tipo]} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Lista de plantillas */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Cargando formularios...</p>
            </div>
          ) : plantillasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {busqueda || tipoFiltro !== 'todos'
                  ? 'No se encontraron formularios con los filtros seleccionados'
                  : 'No hay formularios activos disponibles'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {plantillasFiltradas.map((plantilla) => {
                const estadoConfig = ESTADOS_BADGE[plantilla.estado] || ESTADOS_BADGE.activo;

                return (
                  <Card
                    key={plantilla.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleSeleccionarPlantilla(plantilla)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-brand shrink-0" />
                          <h3 className="font-semibold text-gray-900">
                            {plantilla.nombre}
                          </h3>
                          <Badge tone={estadoConfig.tone}>
                            {estadoConfig.label}
                          </Badge>
                          <Badge tone="muted">
                            {TIPOS_FORMULARIO[plantilla.tipo]}
                          </Badge>
                        </div>

                        {plantilla.descripcion && (
                          <p className="text-sm text-gray-600 mb-3 ml-8">
                            {plantilla.descripcion}
                          </p>
                        )}

                        <div className="flex gap-4 text-xs text-gray-500 ml-8">
                          <span>{plantilla.campos.length} campos</span>
                          {plantilla.requiereValidacionMedica && (
                            <span className="text-amber-600">Requiere validacion medica</span>
                          )}
                          {plantilla.generaPDF && (
                            <span className="text-green-600">Genera PDF</span>
                          )}
                          <span>v{plantilla.version}</span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
