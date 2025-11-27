import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimpleTooltip } from '@/components/ui/Tooltip';

/**
 * Note: The main Tooltip component relies heavily on getBoundingClientRect()
 * and dynamic positioning, which doesn't work well in jsdom test environment.
 * We test SimpleTooltip instead, which uses CSS-based positioning and is
 * more suitable for unit testing.
 *
 * The main Tooltip component should be tested via E2E tests in a real browser.
 */

describe('SimpleTooltip', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('should render tooltip with role="tooltip"', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      // SimpleTooltip is always in DOM but hidden via opacity
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Simple tooltip');
    });

    it('should be hidden by default (opacity-0 and invisible)', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('opacity-0');
      expect(tooltip).toHaveClass('invisible');
    });
  });

  describe('Positions', () => {
    it('should apply top position by default', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('bottom-full');
      expect(tooltip).toHaveClass('mb-2');
    });

    it('should apply bottom position when specified', () => {
      render(
        <SimpleTooltip content="Simple tooltip" position="bottom">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('top-full');
      expect(tooltip).toHaveClass('mt-2');
    });
  });

  describe('CSS hover behavior', () => {
    it('should have group-hover classes for showing tooltip', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('group-hover:opacity-100');
      expect(tooltip).toHaveClass('group-hover:visible');
    });

    it('should have pointer-events-none to prevent interaction', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('pointer-events-none');
    });

    it('should have whitespace-nowrap to prevent text wrapping', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('whitespace-nowrap');
    });

    it('should have z-50 for proper stacking', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('z-50');
    });
  });

  describe('Styling', () => {
    it('should have correct background and text colors', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('bg-gray-900');
      expect(tooltip).toHaveClass('text-white');
    });

    it('should have rounded corners and shadow', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('rounded-lg');
      expect(tooltip).toHaveClass('shadow-lg');
    });

    it('should have appropriate padding', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('px-3');
      expect(tooltip).toHaveClass('py-2');
    });
  });

  describe('Accessibility', () => {
    it('should be positioned absolutely for proper tooltip behavior', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('absolute');
    });

    it('should center tooltip horizontally relative to trigger', () => {
      render(
        <SimpleTooltip content="Simple tooltip">
          <button>Trigger</button>
        </SimpleTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('left-1/2');
      expect(tooltip).toHaveClass('-translate-x-1/2');
    });
  });
});
