'use client';

import { useState, useRef, ReactNode, cloneElement, isValidElement } from 'react';
import { clsx } from 'clsx';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * Tooltip component - Muestra información contextual al hover
 *
 * @example
 * ```tsx
 * <Tooltip content="Información adicional" position="top">
 *   <button>Hover me</button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    timeoutRef.current = setTimeout(() => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect() || { width: 0, height: 0 };

      let x = 0;
      let y = 0;

      const offset = 8; // Distancia del tooltip al elemento
      const tooltipWidth = tooltipRect.width || 0;
      const tooltipHeight = tooltipRect.height || 0;

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - offset;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + offset;
          break;
        case 'left':
          x = rect.left - offset;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + offset;
          y = rect.top + rect.height / 2;
          break;
      }

      setCoords({ x, y });
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full mb-2',
    bottom: '-translate-x-1/2 mt-2',
    left: '-translate-x-full -translate-y-1/2 mr-2',
    right: 'translate-x-0 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
  };

  // Clone child with event handlers
  const trigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })
    : children;

  return (
    <>
      {trigger}

      {/* Portal-style tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={clsx(
            'fixed z-[200] pointer-events-none',
            positionClasses[position],
            className
          )}
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
          }}
        >
          <div className="relative bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs">
            {content}

            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-4',
                arrowClasses[position]
              )}
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * SimpleTooltip - Versión simplificada sin posicionamiento dinámico
 *
 * Útil cuando se necesita un tooltip básico sin cálculos de posición complejos
 */
export function SimpleTooltip({
  content,
  children,
  position = 'top',
}: {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}) {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        role="tooltip"
        className={clsx(
          'absolute left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50',
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        )}
      >
        {content}
        <div
          className={clsx(
            'absolute left-1/2 -translate-x-1/2 w-0 h-0 border-4',
            position === 'top'
              ? 'top-full border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent'
              : 'bottom-full border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent'
          )}
        />
      </div>
    </div>
  );
}
