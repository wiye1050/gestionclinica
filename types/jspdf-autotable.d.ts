// Type definitions for jsPDF with autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
      startY: number;
      endY: number;
    };
  }
}
