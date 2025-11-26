'use client';

import { useState } from 'react';

// Paleta de colores predefinidos
const PRESET_COLORS = [
  '#3B82F6', // Azul (brand)
  '#10B981', // Verde
  '#F59E0B', // Naranja/Amarillo
  '#EF4444', // Rojo
  '#8B5CF6', // Morado
  '#06B6D4', // Cyan
  '#EC4899', // Rosa
  '#14B8A6', // Teal
];

/**
 * Valida si un string es un color hexadecimal válido
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * Calcula el color de texto óptimo (negro o blanco) basado en el contraste
 * del color de fondo usando el algoritmo de luminancia relativa
 */
export const getContrastTextColor = (hexColor: string): string => {
  // Validar formato
  if (!isValidHexColor(hexColor)) return '#000';

  // Convertir hex a RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calcular luminancia relativa (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retornar negro para fondos claros, blanco para fondos oscuros
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
  helpText: string;
  showPreview?: boolean;
  previewText?: string;
  showPresets?: boolean;
  required?: boolean;
}

/**
 * Componente ColorPicker con paleta predefinida, validación y preview con contraste automático
 */
export default function ColorPicker({
  value,
  onChange,
  label,
  helpText,
  showPreview = true,
  previewText = 'Vista previa',
  showPresets = true,
  required = false,
}: ColorPickerProps) {
  const [isValid, setIsValid] = useState(true);

  const handleColorChange = (newColor: string) => {
    const valid = isValidHexColor(newColor);
    setIsValid(valid);
    if (valid) {
      onChange(newColor);
    }
  };

  const textColor = getContrastTextColor(value);

  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1">
        {label} {required && '*'}
      </label>

      {/* Paleta de colores predefinidos */}
      {showPresets && (
        <div className="mb-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              onClick={() => handleColorChange(presetColor)}
              className={`h-8 w-8 rounded-lg border-2 transition-all hover:scale-110 ${
                value.toUpperCase() === presetColor
                  ? 'border-brand ring-2 ring-brand/30'
                  : 'border-border hover:border-brand/50'
              }`}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
              aria-label={`Seleccionar color ${presetColor}`}
            />
          ))}
        </div>
      )}

      {/* Color picker nativo + preview */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          className="h-10 w-20 cursor-pointer rounded border border-border"
          required={required}
          title="Selector de color personalizado"
        />

        {showPreview && (
          <div className="flex flex-1 items-center gap-2">
            {/* Preview del color en un evento de agenda */}
            <div className="flex-1">
              <div
                className="flex h-10 items-center justify-center rounded border border-border px-3 text-xs font-medium shadow-sm"
                style={{
                  backgroundColor: `${value}15`, // 15% opacity
                  borderLeftWidth: '4px',
                  borderLeftColor: value,
                  color: textColor === '#FFFFFF' ? '#000' : '#666',
                }}
              >
                {previewText}
              </div>
            </div>

            {/* Código hexadecimal */}
            <span className="font-mono text-xs text-text-muted">{value.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Mensaje de error si el color no es válido */}
      {!isValid && (
        <p className="mt-1 text-xs text-danger">Color inválido. Use formato hexadecimal (#RRGGBB)</p>
      )}

      {/* Texto de ayuda */}
      <p className="mt-1 text-xs text-text-muted">{helpText}</p>
    </div>
  );
}
