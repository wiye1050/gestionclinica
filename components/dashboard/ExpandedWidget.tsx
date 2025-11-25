'use client';

import { ReactNode } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface ExpandedWidgetProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

/**
 * Modal/Drawer para mostrar un widget expandido con más detalles
 * Muestra contenido adicional que no cabe en la vista compacta
 */
export function ExpandedWidget({ title, icon: Icon, children, onClose, footer }: ExpandedWidgetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] animate-fade-in-scale">
        <div className="surface-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">Vista expandida</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-4">
            {children}
          </div>

          {/* Footer (opcional) */}
          {footer && (
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Botón para expandir un widget
 * Se puede añadir a cualquier widget para permitir vista expandida
 */
interface ExpandButtonProps {
  onClick: () => void;
}

export function ExpandButton({ onClick }: ExpandButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 hover:scale-110"
      aria-label="Expandir widget"
      title="Ver detalles completos"
    >
      <Maximize2 className="h-4 w-4" />
    </button>
  );
}
