'use client';

import { useState } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FormularioPlantilla, CampoFormulario } from '@/types';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { logger } from '@/lib/utils/logger';

interface FormularioRendererProps {
  plantilla: FormularioPlantilla;
  _pacienteId: string;
  pacienteNombre: string;
  pacienteNHC?: string;
  _eventoAgendaId?: string;
  _servicioId?: string;
  _episodioId?: string;
  _userId: string;
  respuestaInicial?: Record<string, string | number | boolean | string[] | null>;
  onGuardar?: (respuesta: Record<string, string | number | boolean | string[] | null>, estado: 'borrador' | 'completado') => Promise<void>;
  onCancel?: () => void;
}

export default function FormularioRenderer({
  plantilla,
  _pacienteId,
  pacienteNombre,
  pacienteNHC,
  _eventoAgendaId,
  _servicioId,
  _episodioId,
  _userId,
  respuestaInicial = {},
  onGuardar,
  onCancel,
}: FormularioRendererProps) {
  const [respuestas, setRespuestas] = useState<Record<string, string | number | boolean | string[] | null>>(respuestaInicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [_tiempoInicio] = useState(Date.now());

  // Agrupar campos por ancho para layout responsive
  const getCampoWidth = (ancho: 'full' | 'half' | 'third') => {
    switch (ancho) {
      case 'full':
        return 'col-span-12';
      case 'half':
        return 'col-span-12 md:col-span-6';
      case 'third':
        return 'col-span-12 md:col-span-4';
      default:
        return 'col-span-12';
    }
  };

  const validarCamposRequeridos = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    let valido = true;

    plantilla.campos.forEach((campo) => {
      if (campo.requerido) {
        const valor = respuestas[campo.nombre];
        if (valor === undefined || valor === null || valor === '') {
          nuevosErrores[campo.nombre] = 'Este campo es requerido';
          valido = false;
        }
      }
    });

    setErrores(nuevosErrores);
    return valido;
  };

  const handleGuardarBorrador = async () => {
    setGuardando(true);
    try {
      if (onGuardar) {
        await onGuardar(respuestas, 'borrador');
      }
      toast.success('Borrador guardado');
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar borrador');
    } finally {
      setGuardando(false);
    }
  };

  const handleCompletar = async () => {
    if (!validarCamposRequeridos()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setGuardando(true);
    try {
      if (onGuardar) {
        await onGuardar(respuestas, 'completado');
      }
      toast.success('Formulario completado');
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al completar formulario');
    } finally {
      setGuardando(false);
    }
  };

  const renderCampo = (campo: CampoFormulario) => {
    const valor = respuestas[campo.nombre];
    const error = errores[campo.nombre];
    const commonClasses = `w-full px-4 py-2 border ${
      error ? 'border-red-500' : 'border-gray-300'
    } rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent`;

    const handleChange = (newValue: string | number | boolean | string[] | null) => {
      setRespuestas({ ...respuestas, [campo.nombre]: newValue });
      if (error) {
        setErrores({ ...errores, [campo.nombre]: '' });
      }
    };

    switch (campo.tipo) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={campo.tipo}
            value={(valor as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={campo.placeholder}
            className={commonClasses}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(valor as number) || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            placeholder={campo.placeholder}
            min={campo.min}
            max={campo.max}
            className={commonClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(valor as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={campo.placeholder}
            rows={4}
            className={commonClasses}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={(valor as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={(valor as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
          />
        );

      case 'select':
        return (
          <select
            value={(valor as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
          >
            <option value="">Selecciona una opción</option>
            {campo.opciones?.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {campo.opciones?.map((opcion) => (
              <label key={opcion.valor} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={campo.nombre}
                  value={opcion.valor}
                  checked={valor === opcion.valor}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
                />
                <span className="text-sm text-gray-700">{opcion.etiqueta}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {campo.opciones?.map((opcion) => {
              const valorArray = (valor as string[]) || [];
              return (
                <label key={opcion.valor} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={opcion.valor}
                    checked={valorArray.includes(opcion.valor)}
                    onChange={(e) => {
                      const newArray = e.target.checked
                        ? [...valorArray, opcion.valor]
                        : valorArray.filter((v) => v !== opcion.valor);
                      handleChange(newArray);
                    }}
                    className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                  />
                  <span className="text-sm text-gray-700">{opcion.etiqueta}</span>
                </label>
              );
            })}
          </div>
        );

      case 'yesno':
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={campo.nombre}
                value="true"
                checked={valor === true}
                onChange={() => handleChange(true)}
                className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
              />
              <span className="text-sm text-gray-700">Sí</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={campo.nombre}
                value="false"
                checked={valor === false}
                onChange={() => handleChange(false)}
                className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={(valor as number) || 5}
              onChange={(e) => handleChange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span className="font-semibold text-brand text-lg">{(valor as number) || 5}</span>
              <span>10</span>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">
              Firma digital - Pendiente de implementación
            </p>
          </div>
        );

      case 'heading':
        return (
          <h3 className="text-lg font-semibold text-gray-900 mt-2">
            {campo.etiqueta}
          </h3>
        );

      case 'paragraph':
        return (
          <p className="text-sm text-gray-600">
            {campo.descripcion || campo.etiqueta}
          </p>
        );

      default:
        return (
          <input
            type="text"
            value={(valor as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={campo.placeholder}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{plantilla.nombre}</h2>
            <Badge tone="muted">v{plantilla.version}</Badge>
          </div>
          {plantilla.descripcion && (
            <p className="text-sm text-gray-600">{plantilla.descripcion}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Paciente:</span>
            <span className="font-medium text-gray-900">{pacienteNombre}</span>
            {pacienteNHC && <Badge tone="muted">NHC: {pacienteNHC}</Badge>}
          </div>
        </div>
      </Card>

      {/* Campos del formulario */}
      <Card>
        <div className="grid grid-cols-12 gap-4">
          {plantilla.campos.map((campo) => {
            // Los heading y paragraph ocupan siempre ancho completo
            const width = campo.tipo === 'heading' || campo.tipo === 'paragraph'
              ? 'col-span-12'
              : getCampoWidth(campo.ancho || 'full');

            return (
              <div key={campo.id} className={width}>
                {campo.tipo !== 'heading' && campo.tipo !== 'paragraph' && (
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {campo.etiqueta}
                    {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {campo.descripcion && campo.tipo !== 'paragraph' && (
                  <p className="text-xs text-gray-500 mb-2">{campo.descripcion}</p>
                )}
                {renderCampo(campo)}
                {errores[campo.nombre] && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errores[campo.nombre]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Acciones */}
      <Card>
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleGuardarBorrador}
            disabled={guardando}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button
            variant="primary"
            onClick={handleCompletar}
            disabled={guardando}
          >
            <Check className="w-4 h-4 mr-2" />
            {guardando ? 'Guardando...' : 'Completar Formulario'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
