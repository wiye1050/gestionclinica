'use client';

import { Loader2 } from 'lucide-react';

interface TabLoadingFallbackProps {
  message?: string;
}

/**
 * Loading fallback component for patient tabs
 * Used with Suspense boundaries for async data loading
 */
export function TabLoadingFallback({ message = 'Cargando datos...' }: TabLoadingFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

/**
 * Smaller inline loading indicator
 */
export function InlineLoadingIndicator({ message = 'Cargando...' }: TabLoadingFallbackProps) {
  return (
    <div className="flex items-center gap-2 p-4">
      <Loader2 className="w-4 h-4 text-brand animate-spin" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}
