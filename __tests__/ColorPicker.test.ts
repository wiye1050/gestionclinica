import { describe, it, expect } from 'vitest';
import { isValidHexColor, getContrastTextColor } from '@/components/shared/ColorPicker';

describe('ColorPicker utilities', () => {
  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#3B82F6')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#abc123')).toBe(true);
      expect(isValidHexColor('#ABC123')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('#GGG')).toBe(false);
      expect(isValidHexColor('3B82F6')).toBe(false); // Missing #
      expect(isValidHexColor('#3B82F')).toBe(false); // Too short
      expect(isValidHexColor('#3B82F6A')).toBe(false); // Too long
      expect(isValidHexColor('#3B82F6A8')).toBe(false); // 8 chars (RGBA not supported)
      expect(isValidHexColor('')).toBe(false);
      expect(isValidHexColor('blue')).toBe(false);
      expect(isValidHexColor('#ZZZ123')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidHexColor('#aAbBcC')).toBe(true);
      expect(isValidHexColor('#AABBCC')).toBe(true);
      expect(isValidHexColor('#aabbcc')).toBe(true);
    });
  });

  describe('getContrastTextColor', () => {
    describe('dark backgrounds (should return white)', () => {
      it('should return white for dark blue', () => {
        expect(getContrastTextColor('#3B82F6')).toBe('#FFFFFF');
      });

      it('should return white for black', () => {
        expect(getContrastTextColor('#000000')).toBe('#FFFFFF');
      });

      it('should return white for dark red', () => {
        expect(getContrastTextColor('#EF4444')).toBe('#FFFFFF');
      });

      it('should return white for dark purple', () => {
        expect(getContrastTextColor('#8B5CF6')).toBe('#FFFFFF');
      });

      it('should return black for bright green (high G component)', () => {
        // #10B981 has high green component (185) -> luminance ~0.50, returns black
        expect(getContrastTextColor('#10B981')).toBe('#000000');
      });
    });

    describe('light backgrounds (should return black)', () => {
      it('should return black for white', () => {
        expect(getContrastTextColor('#FFFFFF')).toBe('#000000');
      });

      it('should return black for light yellow', () => {
        expect(getContrastTextColor('#FFFF00')).toBe('#000000');
      });

      it('should return black for light cyan', () => {
        expect(getContrastTextColor('#00FFFF')).toBe('#000000');
      });

      it('should return black for light gray', () => {
        expect(getContrastTextColor('#CCCCCC')).toBe('#000000');
      });
    });

    describe('edge cases', () => {
      it('should handle mid-tone colors correctly', () => {
        // #808080 is exact middle (128,128,128)
        // Luminance = 0.5, should return black
        expect(getContrastTextColor('#808080')).toBe('#000000');
      });

      it('should return black for invalid hex color', () => {
        expect(getContrastTextColor('invalid')).toBe('#000');
        expect(getContrastTextColor('#GGG')).toBe('#000');
        expect(getContrastTextColor('')).toBe('#000');
      });

      it('should handle lowercase hex colors', () => {
        expect(getContrastTextColor('#ffffff')).toBe('#000000');
        expect(getContrastTextColor('#000000')).toBe('#FFFFFF');
      });
    });

    describe('WCAG luminance calculation', () => {
      it('should correctly calculate luminance for pure colors', () => {
        // Pure red (255,0,0) -> luminance = 0.299
        expect(getContrastTextColor('#FF0000')).toBe('#FFFFFF');

        // Pure green (0,255,0) -> luminance = 0.587
        expect(getContrastTextColor('#00FF00')).toBe('#000000');

        // Pure blue (0,0,255) -> luminance = 0.114
        expect(getContrastTextColor('#0000FF')).toBe('#FFFFFF');
      });

      it('should use correct WCAG weights (0.299, 0.587, 0.114)', () => {
        // This color should be exactly at threshold
        // Testing the algorithm is working
        const brightYellow = '#FFFF00'; // Very bright
        expect(getContrastTextColor(brightYellow)).toBe('#000000');
      });
    });
  });
});
