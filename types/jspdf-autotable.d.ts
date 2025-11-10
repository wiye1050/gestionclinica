// Type definitions for jsPDF with autoTable plugin
import { jsPDF } from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
      startY: number;
      endY: number;
    };
  }
}
