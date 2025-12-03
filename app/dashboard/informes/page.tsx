'use client';

import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logger } from '@/lib/utils/logger';

export default function InformesPage() {
  const [loading, setLoading] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth());
  const [año, setAño] = useState(new Date().getFullYear());

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const generarPDF = async () => {
    setLoading(true);
    
    try {
      const inicioMes = new Date(año, mes, 1);
      const finMes = new Date(año, mes + 1, 0, 23, 59, 59);

      const profesionales = await getDocs(collection(db, 'profesionales'));
      const servicios = await getDocs(collection(db, 'servicios-asignados'));
      const evaluaciones = await getDocs(
        query(
          collection(db, 'evaluaciones-sesion'),
          where('fecha', '>=', Timestamp.fromDate(inicioMes)),
          where('fecha', '<=', Timestamp.fromDate(finMes))
        )
      );
      const proyectos = await getDocs(collection(db, 'proyectos'));
      const reportes = await getDocs(
        query(
          collection(db, 'daily-reports'),
          where('fecha', '>=', Timestamp.fromDate(inicioMes)),
          where('fecha', '<=', Timestamp.fromDate(finMes))
        )
      );
      const inventario = await getDocs(collection(db, 'inventario-productos'));

      const profActivos = profesionales.docs.filter(d => d.data().activo).length;
      const serviciosActivos = servicios.docs.filter(d => d.data().estado === 'activo').length;
      const evaluacionesMes = evaluaciones.docs.length;
      const proyectosActivos = proyectos.docs.filter(d => d.data().estado === 'en-curso').length;
      const reportesMes = reportes.docs.length;
      const productosBajoStock = inventario.docs.filter(d => d.data().alertaStockBajo).length;

      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORME MENSUAL', 105, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(`${meses[mes]} ${año}`, 105, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, yPos, { align: 'center' });

      yPos += 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN EJECUTIVO', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const resumen = [
        `• Profesionales activos: ${profActivos}`,
        `• Servicios activos: ${serviciosActivos}`,
        `• Evaluaciones realizadas: ${evaluacionesMes}`,
        `• Proyectos en curso: ${proyectosActivos}`,
        `• Reportes diarios: ${reportesMes}`,
        `• Productos con stock bajo: ${productosBajoStock}`
      ];

      resumen.forEach(linea => {
        doc.text(linea, 25, yPos);
        yPos += 7;
      });

      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESIONALES', 20, yPos);
      yPos += 7;

      const profData = profesionales.docs
        .filter(d => d.data().activo)
        .map(d => {
          const data = d.data();
          return [
            `${data.nombre} ${data.apellidos}`,
            data.especialidad,
            data.serviciosAsignados || 0
          ];
        });

      autoTable(doc, {
        startY: yPos,
        head: [['Nombre', 'Especialidad', 'Servicios']],
        body: profData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });

      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 10;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SERVICIOS ASIGNADOS', 20, yPos);
      yPos += 7;

      const serviciosData = servicios.docs.slice(0, 15).map(d => {
        const data = d.data();
        return [
          data.catalogoServicioNombre || 'Sin nombre',
          data.grupoNombre || 'Sin grupo',
          data.estado,
          data.tiquet || 'N/A'
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Servicio', 'Grupo', 'Estado', 'Ticket']],
        body: serviciosData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });

      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 10;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SUPERVISIÓN Y CALIDAD', 20, yPos);
      yPos += 7;

      if (evaluacionesMes > 0) {
        const evalData = evaluaciones.docs.slice(0, 10).map(d => {
          const data = d.data();
          const promedio = (
            (data.aplicacionProtocolo || 0) +
            (data.manejoPaciente || 0) +
            (data.usoEquipamiento || 0) +
            (data.comunicacion || 0)
          ) / 4;
          
          return [
            data.profesionalNombre || 'Sin nombre',
            data.servicioNombre || 'Sin servicio',
            promedio.toFixed(1),
            data.protocoloSeguido ? 'Sí' : 'No'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Profesional', 'Servicio', 'Promedio', 'Protocolo']],
          body: evalData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] }
        });
      } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('No hay evaluaciones en este período', 25, yPos);
      }

      yPos = (doc.lastAutoTable?.finalY ?? yPos - 3) + 10;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ALERTAS DE INVENTARIO', 20, yPos);
      yPos += 7;

      if (productosBajoStock > 0) {
        const inventarioData = inventario.docs
          .filter(d => d.data().alertaStockBajo)
          .slice(0, 10)
          .map(d => {
            const data = d.data();
            return [
              data.nombre,
              data.categoria,
              data.cantidadActual,
              data.cantidadMinima
            ];
          });

        autoTable(doc, {
          startY: yPos,
          head: [['Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo']],
          body: inventarioData,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] }
        });
      } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('✓ No hay productos con stock bajo', 25, yPos);
      }

      doc.save(`Informe_${meses[mes]}_${año}.pdf`);

      toast.success('Informe generado correctamente');

    } catch (error) {
      logger.error('Error al generar PDF:', error);
      toast.error('Error al generar el informe. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Informes Mensuales</h1>
          <p className="text-gray-600 mt-2">Genera informes en PDF consolidados</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Generar Informe Mensual</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {meses.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={año}
              onChange={(e) => setAño(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">El informe incluirá:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Resumen ejecutivo con KPIs principales
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Estado de profesionales y carga de trabajo
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Servicios asignados y tickets CRM
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Evaluaciones de supervisión y calidad
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Alertas de inventario
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Estado de proyectos
            </li>
          </ul>
        </div>

        <button
          onClick={generarPDF}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Generando informe...</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              <span>Generar Informe PDF</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Período seleccionado:</p>
            <p>{meses[mes]} {año}</p>
          </div>
        </div>
      </div>
    </div>
  );
}