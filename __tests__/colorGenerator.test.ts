import { describe, it, expect } from 'vitest';
import {
  hslToHex,
  generateColorFromIndex,
  generateColorPalette,
  getExtendedPaletteColor,
} from '@/lib/utils/colorGenerator';

describe('colorGenerator utilities', () => {
  describe('hslToHex', () => {
    it('should convert pure colors correctly', () => {
      expect(hslToHex(0, 100, 50)).toBe('#FF0000'); // Pure red
      expect(hslToHex(120, 100, 50)).toBe('#00FF00'); // Pure green
      expect(hslToHex(240, 100, 50)).toBe('#0000FF'); // Pure blue
    });

    it('should handle edge cases', () => {
      expect(hslToHex(0, 0, 0)).toBe('#000000'); // Black
      expect(hslToHex(0, 0, 100)).toBe('#FFFFFF'); // White
      expect(hslToHex(0, 0, 50)).toBe('#808080'); // Gray
    });

    it('should normalize hue values', () => {
      expect(hslToHex(360, 100, 50)).toBe(hslToHex(0, 100, 50)); // 360° = 0°
      expect(hslToHex(480, 100, 50)).toBe(hslToHex(120, 100, 50)); // 480° = 120°
    });

    it('should clamp saturation and lightness', () => {
      expect(hslToHex(0, 150, 50)).toBe(hslToHex(0, 100, 50)); // Clamp S to 100
      expect(hslToHex(0, 50, 150)).toBe(hslToHex(0, 50, 100)); // Clamp L to 100
      expect(hslToHex(0, -10, 50)).toBe(hslToHex(0, 0, 50)); // Clamp S to 0
    });
  });

  describe('generateColorFromIndex', () => {
    it('should generate valid hex colors', () => {
      for (let i = 0; i < 10; i++) {
        const color = generateColorFromIndex(i);
        expect(color).toMatch(/^#[0-9A-F]{6}$/);
      }
    });

    it('should generate different colors for different indices', () => {
      const color0 = generateColorFromIndex(0);
      const color1 = generateColorFromIndex(1);
      const color2 = generateColorFromIndex(2);

      expect(color0).not.toBe(color1);
      expect(color1).not.toBe(color2);
      expect(color0).not.toBe(color2);
    });

    it('should distribute evenly when total is provided', () => {
      const colors = [];
      const total = 10;
      for (let i = 0; i < total; i++) {
        colors.push(generateColorFromIndex(i, total));
      }
      // All colors should be unique
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(total);
    });

    it('should respect custom saturation and lightness', () => {
      // Very low saturation should produce grayish colors
      const grayish = generateColorFromIndex(0, 1, 10, 50);
      expect(grayish).toMatch(/^#[0-9A-F]{6}$/);

      // High lightness should produce lighter colors
      const light = generateColorFromIndex(0, 1, 70, 80);
      expect(light).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  describe('generateColorPalette', () => {
    it('should generate correct number of colors', () => {
      expect(generateColorPalette(5)).toHaveLength(5);
      expect(generateColorPalette(10)).toHaveLength(10);
      expect(generateColorPalette(20)).toHaveLength(20);
    });

    it('should generate unique colors', () => {
      const palette = generateColorPalette(15);
      const uniqueColors = new Set(palette);
      expect(uniqueColors.size).toBe(15);
    });

    it('should generate valid hex colors', () => {
      const palette = generateColorPalette(8);
      palette.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/);
      });
    });
  });

  describe('getExtendedPaletteColor', () => {
    it('should return fixed palette colors for first 8 indices', () => {
      const fixedPalette = [
        '#3B82F6', // 0: Azul
        '#10B981', // 1: Verde
        '#F59E0B', // 2: Naranja
        '#EF4444', // 3: Rojo
        '#8B5CF6', // 4: Morado
        '#06B6D4', // 5: Cyan
        '#EC4899', // 6: Rosa
        '#14B8A6', // 7: Teal
      ];

      fixedPalette.forEach((expected, index) => {
        expect(getExtendedPaletteColor(index)).toBe(expected);
      });
    });

    it('should generate dynamic colors for indices >= 8', () => {
      const color8 = getExtendedPaletteColor(8);
      const color9 = getExtendedPaletteColor(9);
      const color15 = getExtendedPaletteColor(15);

      // Should be valid hex colors
      expect(color8).toMatch(/^#[0-9A-F]{6}$/);
      expect(color9).toMatch(/^#[0-9A-F]{6}$/);
      expect(color15).toMatch(/^#[0-9A-F]{6}$/);

      // Should be different from each other
      expect(color8).not.toBe(color9);
      expect(color9).not.toBe(color15);

      // Should be different from fixed palette
      expect(color8).not.toBe('#3B82F6');
      expect(color8).not.toBe('#10B981');
    });

    it('should handle large indices gracefully', () => {
      const color50 = getExtendedPaletteColor(50);
      const color100 = getExtendedPaletteColor(100);

      expect(color50).toMatch(/^#[0-9A-F]{6}$/);
      expect(color100).toMatch(/^#[0-9A-F]{6}$/);
      expect(color50).not.toBe(color100);
    });

    it('should generate visually distinct colors', () => {
      // Generate colors for a large clinic with 30 professionals
      const colors = [];
      for (let i = 0; i < 30; i++) {
        colors.push(getExtendedPaletteColor(i));
      }

      // All should be unique
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(30);
    });
  });
});
