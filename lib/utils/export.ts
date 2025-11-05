import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) {
  // Preparar datos
  const exportData = data.map((row) => {
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = (row as Record<string, unknown>)[col.key];
      newRow[col.header] = value ?? '';
    });
    return newRow;
  });

  // Crear workbook
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  // Ajustar anchos de columna
  ws['!cols'] = columns.map((col) => ({ wch: col.width || 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  // Descargar
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) {
  // Preparar datos
  const exportData = data.map((row) => {
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = (row as Record<string, unknown>)[col.key];
      newRow[col.header] = value ?? '';
    });
    return newRow;
  });

  // Crear CSV
  const ws = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
