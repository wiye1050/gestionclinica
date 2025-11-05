'use client';

import { Download } from 'lucide-react';
import { exportToExcel, exportToCSV, ExportColumn } from '@/lib/utils/export';

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
      alert('No hay datos para exportar');
      return;
    }

    if (format === 'excel') {
      exportToExcel(data, columns, filename);
    } else {
      exportToCSV(data, columns, filename);
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
