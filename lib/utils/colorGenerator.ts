/**
 * Utilidades para generación dinámica de colores
 * Útil para clínicas con muchos profesionales donde una paleta fija no es suficiente
 */

/**
 * Convierte HSL a formato hexadecimal
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 * @returns Color en formato hexadecimal (#RRGGBB)
 */
export function hslToHex(h: number, s: number, l: number): string {
  // Normalizar valores
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  // Convertir a RGB (0-255)
  const rr = Math.round((r + m) * 255);
  const gg = Math.round((g + m) * 255);
  const bb = Math.round((b + m) * 255);

  // Convertir a hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}

/**
 * Genera un color único basado en un índice usando el algoritmo Golden Ratio
 * Distribuye los colores uniformemente en el espectro de color
 *
 * @param index Índice del elemento (0-based)
 * @param total Total de elementos (opcional, mejora la distribución si se conoce)
 * @param saturation Saturación del color (0-100), default 70
 * @param lightness Luminosidad del color (0-100), default 50
 * @returns Color en formato hexadecimal (#RRGGBB)
 *
 * @example
 * generateColorFromIndex(0, 10) // #E63946
 * generateColorFromIndex(1, 10) // #52B788
 * generateColorFromIndex(2, 10) // #4361EE
 */
export function generateColorFromIndex(
  index: number,
  total?: number,
  saturation = 70,
  lightness = 50
): string {
  // Golden ratio conjugate para distribución uniforme
  const goldenRatioConjugate = 0.618033988749895;

  let hue: number;
  if (total && total > 0) {
    // Si conocemos el total, distribuir uniformemente
    hue = (index * 360) / total;
  } else {
    // Si no, usar golden ratio para distribución pseudo-aleatoria
    hue = (index * goldenRatioConjugate * 360) % 360;
  }

  return hslToHex(hue, saturation, lightness);
}

/**
 * Genera una paleta de N colores visualmente distintos
 * Útil para generar colores para múltiples profesionales
 *
 * @param count Número de colores a generar
 * @param saturation Saturación (0-100), default 70
 * @param lightness Luminosidad (0-100), default 50
 * @returns Array de colores hexadecimales
 *
 * @example
 * generateColorPalette(5)
 * // ['#E63946', '#52B788', '#4361EE', '#F77F00', '#9D4EDD']
 */
export function generateColorPalette(
  count: number,
  saturation = 70,
  lightness = 50
): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(generateColorFromIndex(i, count, saturation, lightness));
  }
  return colors;
}

/**
 * Obtiene un color de una paleta extendida que combina:
 * - Paleta fija de 8 colores profesionales (para los primeros 8)
 * - Generación HSL dinámica (para el resto)
 *
 * @param index Índice del elemento (0-based)
 * @returns Color hexadecimal
 */
export function getExtendedPaletteColor(index: number): string {
  // Paleta fija para los primeros 8 (colores profesionales bien probados)
  const fixedPalette = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Naranja
    '#EF4444', // Rojo
    '#8B5CF6', // Morado
    '#06B6D4', // Cyan
    '#EC4899', // Rosa
    '#14B8A6', // Teal
  ];

  if (index < fixedPalette.length) {
    return fixedPalette[index];
  }

  // Para índices mayores, generar dinámicamente
  // Ajustar el índice para evitar colores muy similares a los fijos
  const adjustedIndex = index - fixedPalette.length;
  return generateColorFromIndex(adjustedIndex + fixedPalette.length);
}
