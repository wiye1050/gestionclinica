'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel, exportToCSV, ExportColumn } from '@/lib/utils/export';
import { logger } from '@/lib/utils/logger';

interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn[];
  filename: string;
  format?: 'excel' | 'csv';
  disabled?: boolean;
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  format = 'excel',
  disabled = false
}: ExportButtonProps<T>) {
  const handleExport = () => {
    if (data.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      if (format === 'excel') {
        exportToExcel(data, columns, filename);
        toast.success('Exportación a Excel completada');
      } else {
        exportToCSV(data, columns, filename);
        toast.success('Exportación a CSV completada');
      }
    } catch (error) {
      logger.error('Error exportando:', error);
      toast.error('Error al exportar. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      Exportar {format === 'excel' ? 'Excel' : 'CSV'}
    </button>
  );
}
