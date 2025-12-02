'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface TabErrorBoundaryProps {
  children: React.ReactNode;
  tabName: string;
  onRetry?: () => void;
}

/**
 * Error Boundary específico para tabs del módulo de pacientes
 * Proporciona UI optimizada para errores dentro de tabs individuales
 */
export function TabErrorBoundary({ children, tabName, onRetry }: TabErrorBoundaryProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Forzar re-renderizado del componente padre
      window.location.reload();
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error en la pestaña {tabName}
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
            No se pudo cargar el contenido de esta pestaña. Intenta recargarla o contacta con soporte si el problema persiste.
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
