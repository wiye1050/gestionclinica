import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Drawer, DrawerFooter } from '@/components/ui/Drawer';

describe('Drawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Drawer isOpen={false} onClose={mockOnClose}>
          <div>Drawer Content</div>
        </Drawer>
      );

      expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <div>Drawer Content</div>
        </Drawer>
      );

      expect(screen.getByText('Drawer Content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} title="Test Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    });

    it('should render close button by default', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} title="Test">
          <div>Content</div>
        </Drawer>
      );

      const closeButton = screen.getByLabelText('Cerrar drawer');
      expect(closeButton).toBeInTheDocument();
    });

    it('should not render close button when showCloseButton is false', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Content</div>
        </Drawer>
      );

      expect(screen.queryByLabelText('Cerrar drawer')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should apply correct size classes', () => {
      const { rerender } = render(
        <Drawer isOpen={true} onClose={mockOnClose} size="sm">
          <div>Content</div>
        </Drawer>
      );

      let dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-xs');

      rerender(
        <Drawer isOpen={true} onClose={mockOnClose} size="lg">
          <div>Content</div>
        </Drawer>
      );

      dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });
  });

  describe('Positions', () => {
    it('should apply right position by default', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Drawer>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('right-0');
    });

    it('should apply left position when specified', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} position="left">
          <div>Content</div>
        </Drawer>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('left-0');
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} title="Test">
          <div>Content</div>
        </Drawer>
      );

      const closeButton = screen.getByLabelText('Cerrar drawer');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked and closeOnOverlayClick is true', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <div>Content</div>
        </Drawer>
      );

      // Click on backdrop (first child of body with bg-black class)
      const backdrop = document.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();

      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onClose when overlay is clicked and closeOnOverlayClick is false', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <div>Content</div>
        </Drawer>
      );

      const backdrop = document.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });

    it('should call onClose when Escape key is pressed', async () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Drawer>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Body scroll lock', () => {
    it('should lock body scroll when drawer is open', () => {
      const { rerender } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Drawer>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Drawer isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Drawer>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Drawer>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should link title with aria-labelledby', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} title="Test Title">
          <div>Content</div>
        </Drawer>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-title');
      expect(screen.getByText('Test Title')).toHaveAttribute('id', 'drawer-title');
    });
  });
});

describe('DrawerFooter', () => {
  it('should render children', () => {
    render(
      <DrawerFooter>
        <button>Cancel</button>
        <button>Confirm</button>
      </DrawerFooter>
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DrawerFooter className="custom-class">
        <button>Action</button>
      </DrawerFooter>
    );

    const footer = container.firstChild;
    expect(footer).toHaveClass('custom-class');
  });
});
