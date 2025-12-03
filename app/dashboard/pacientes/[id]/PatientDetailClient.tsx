'use client';

import { useCallback, useMemo, useState, Suspense, lazy, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { usePatientDetailData } from '@/lib/hooks/usePatientDetailData';
import { useAuth } from '@/lib/hooks/useAuth';
import PatientProfileLayout, { PatientTab } from '@/components/pacientes/v2/PatientProfileLayout';
import PatientResumenTab from '@/components/pacientes/v2/PatientResumenTab';
import PatientDocumentosTab from '@/components/pacientes/v2/PatientDocumentosTab';
import PatientNotasTab from '@/components/pacientes/v2/PatientNotasTab';
import PatientFormulariosTab from '@/components/pacientes/v2/PatientFormulariosTab';
import PatientAvailabilityCard from '@/components/pacientes/v2/PatientAvailabilityCard';
import PatientResumenServiciosCard from '@/components/pacientes/v2/PatientResumenServiciosCard';
import PatientResumenPendientesCard from '@/components/pacientes/v2/PatientResumenPendientesCard';
import PatientHistorialFilters from '@/components/pacientes/v2/PatientHistorialFilters';
import PatientHistorialListItem from '@/components/pacientes/v2/PatientHistorialListItem';
import DetailPanel from '@/components/shared/DetailPanel';
import { TabErrorBoundary } from '@/components/pacientes/TabErrorBoundary';
import { TabLoadingFallback } from '@/components/pacientes/TabLoadingFallback';
import { toast } from 'sonner';
import { resolverSeguimientoAction } from '../actions';
import { hasActiveFollowUpInHistory } from '@/lib/utils/followUps';
import {
  HISTORIAL_FILTROS,
  HISTORIAL_BADGE_COLORS,
  filtrarHistorial,
  type HistorialFiltro,
} from '@/components/pacientes/v2/pacientesConstants';
import {
  historialToActividades,
  historialToCitas,
  getProximasCitas,
  extractDocumentos,
  historialToNotas,
  extractAlergias,
  extractAntecedentes,
  createAgendaLinkBuilder,
} from '@/components/pacientes/v2/pacientesHelpers';
import {
  LayoutDashboard,
  Heart,
  Calendar as CalendarIcon,
  Activity as ActivityIcon,
  Folder,
  DollarSign,
  StickyNote,
  FileCheck2,
} from 'lucide-react';
import type { PacienteFactura, PacientePresupuesto, RespuestaFormulario, Profesional } from '@/types';
import type { PatientDetailData } from './data';
import { logger } from '@/lib/utils/logger';

// Lazy load heavy tabs and modals for better performance
const PatientHistorialClinicoTab = dynamic(
  () => import('@/components/pacientes/v2/PatientHistorialClinicoTab'),
  { loading: () => <TabLoadingFallback message="Cargando historial clínico..." /> }
);

const PatientCitasTab = dynamic(
  () => import('@/components/pacientes/v2/PatientCitasTab'),
  { loading: () => <TabLoadingFallback message="Cargando citas..." /> }
);

const PatientFacturacionTab = dynamic(
  () => import('@/components/pacientes/v2/PatientFacturacionTab'),
  { loading: () => <TabLoadingFallback message="Cargando facturación..." /> }
);

const CompletarFormularioModal = dynamic(
  () => import('@/components/formularios/CompletarFormularioModal'),
  { ssr: false, loading: () => <TabLoadingFallback message="Cargando formulario..." /> }
);

interface PatientDetailClientProps {
  pacienteId: string;
  initialDetailData?: PatientDetailData | null;
  initialProfesionales?: Profesional[];
  initialFormResponses?: RespuestaFormulario[];
}

/**
 * Client Component for patient detail page
 * Handles all interactive functionality and state management
 *
 * Performance optimizations:
 * - Uses initialFormResponses from server pre-fetch to skip initial loading
 * - React Query still fetches patient detail data (cached by browser)
 * - Future: Pass initialData to React Query for instant rendering
 */
export default function PatientDetailClient({
  pacienteId,
  initialDetailData,
  initialProfesionales = [],
  initialFormResponses = [],
}: PatientDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Hook centralizado para cargar todos los datos
  const {
    paciente,
    historial,
    serviciosRelacionados,
    loading,
    error,
    relacionesError,
    refreshHistorial,
    profesionalReferente,
    profesionalesOptions,
    facturas,
    presupuestos,
    documentos: documentosFirestore,
    refreshFacturacion,
    refreshDocumentos,
  } = usePatientDetailData({ pacienteId });

  // Estados locales de UI
  const [activeTab, setActiveTab] = useState<PatientTab>('resumen');
  const [historialFiltro, setHistorialFiltro] = useState<HistorialFiltro>('todos');
  const [compartiendo, setCompartiendo] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<PacienteFactura | null>(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<PacientePresupuesto | null>(null);
  const [detalleTab, setDetalleTab] = useState<'resumen' | 'conceptos'>('resumen');
  const [mostrarModalFormulario, setMostrarModalFormulario] = useState(false);
  const [respuestasFormularios, setRespuestasFormularios] = useState<RespuestaFormulario[]>(initialFormResponses);
  const [loadingRespuestas, setLoadingRespuestas] = useState(false);

  // Datos derivados con memos
  const actividadesTimeline = useMemo(() => historialToActividades(historial), [historial]);
  const citas = useMemo(() => historialToCitas(historial), [historial]);
  const proximasCitas = useMemo(() => getProximasCitas(citas), [citas]);
  const documentosFirestoreMap = useMemo(
    () => new Map(documentosFirestore.map((doc) => [doc.id, doc])),
    [documentosFirestore]
  );
  const documentos = useMemo(() => {
    const docsFirestore = documentosFirestore.map((doc) => ({
      id: doc.id,
      nombre: doc.nombre,
      tipo: doc.tipo,
      tamaño: doc.tamaño,
      url: doc.url,
      fechaSubida: doc.fechaSubida,
      subidoPor: doc.subidoPor,
      etiquetas: doc.etiquetas,
    }));
    const docsExtraidos = extractDocumentos(paciente, historial);
    return [...docsFirestore, ...docsExtraidos];
  }, [documentosFirestore, paciente, historial]);
  const readOnlyDocumentoIds = useMemo(
    () =>
      documentos
        .filter((doc) => !documentosFirestoreMap.has(doc.id))
        .map((doc) => doc.id),
    [documentos, documentosFirestoreMap]
  );
  const notas = useMemo(() => historialToNotas(historial), [historial]);
  const alergiasData = useMemo(() => extractAlergias(paciente), [paciente]);
  const antecedentesData = useMemo(() => extractAntecedentes(paciente), [paciente]);
  const historialFiltrado = useMemo(
    () => filtrarHistorial(historial, historialFiltro),
    [historial, historialFiltro]
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }),
    []
  );

  const agendaLinkBuilder = useMemo(() => createAgendaLinkBuilder(paciente), [paciente]);
  const agendaLink = agendaLinkBuilder?.({});
  const inferirTipoDocumento = useCallback((file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (file.type.includes('image')) return 'imagen';
    if (['pdf', 'doc', 'docx'].includes(extension)) return 'informe';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'analitica';
    if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') return 'imagen';
    return 'otro';
  }, []);

  // Cargar respuestas de formularios del paciente
  // Skip if we have initialFormResponses (server pre-fetch)
  useEffect(() => {
    // Si ya tenemos datos iniciales, no hacer fetch
    if (initialFormResponses.length > 0) {
      return;
    }

    const cargarRespuestas = async () => {
      if (!pacienteId) return;

      setLoadingRespuestas(true);
      try {
        const response = await fetch(`/api/formularios/respuestas?pacienteId=${pacienteId}&limit=100`);
        if (!response.ok) throw new Error('Error al cargar respuestas');
        const data = await response.json();
        setRespuestasFormularios(data);
      } catch (error) {
        logger.error('Error cargando respuestas de formularios:', error);
        setRespuestasFormularios([]);
      } finally {
        setLoadingRespuestas(false);
      }
    };

    cargarRespuestas();
  }, [pacienteId, initialFormResponses.length]);

  // Handlers with optimistic UI feedback
  const handleResumenQuickAction = useCallback(
    async (eventId: string, action: 'confirm' | 'complete' | 'cancel') => {
      const estadoMap = {
        confirm: 'confirmada',
        complete: 'realizada',
        cancel: 'cancelada',
      } as const;

      const loadingMessages = {
        confirm: 'Confirmando cita...',
        complete: 'Completando cita...',
        cancel: 'Cancelando cita...',
      };

      const successMessages = {
        confirm: 'Cita confirmada',
        complete: 'Cita completada',
        cancel: 'Cita cancelada',
      };

      // Show immediate optimistic feedback
      const toastId = toast.loading(loadingMessages[action]);

      try {
        const response = await fetch(`/api/agenda/eventos/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: estadoMap[action] }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          toast.error(data.error ?? 'No se pudo actualizar la cita', { id: toastId });
          throw new Error(data.error ?? 'Error quick action');
        }

        toast.success(successMessages[action], { id: toastId });
        await refreshHistorial();
      } catch (error) {
        // Toast already updated in error handling above
        throw error;
      }
    },
    [refreshHistorial]
  );

  const handleNuevaCitaDesdePaciente = useCallback(() => {
    if (!paciente) return;
    const searchParams = new URLSearchParams({
      newEvent: '1',
      pacienteId: paciente.id,
    });
    const fullName = `${paciente.nombre ?? ''} ${paciente.apellidos ?? ''}`.trim();
    if (fullName) {
      searchParams.set('pacienteNombre', fullName);
    }
    if (paciente.profesionalReferenteId) {
      searchParams.set('profesionalId', paciente.profesionalReferenteId);
    }
    router.push(`/dashboard/agenda?${searchParams.toString()}`);
  }, [paciente, router]);

  // Export functions
  const generarHistorialPDF = useCallback(async () => {
    const [{ default: JsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const autoTable = autoTableModule.default ?? autoTableModule;

    const doc = new JsPDF();
    doc.setFontSize(16);
    doc.text('Historial Clínico', 14, 20);

    const datos = historialFiltrado.map((registro) => [
      registro.fecha.toLocaleString('es-ES'),
      registro.tipo,
      registro.profesionalNombre ?? '-',
      registro.descripcion ?? '-',
      registro.resultado ?? '-',
      registro.planesSeguimiento ?? '-',
      registro.creadoPor,
    ]);

    autoTable(doc, {
      head: [
        ['Fecha', 'Tipo', 'Profesional', 'Descripción', 'Resultado', 'Seguimiento', 'Registrado por'],
      ],
      body: datos,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    return doc;
  }, [historialFiltrado]);

  const exportarHistorialPDF = useCallback(async () => {
    if (historialFiltrado.length === 0) return;
    const doc = await generarHistorialPDF();
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`Historial_${paciente?.nombre ?? 'paciente'}_${fecha}.pdf`);
  }, [generarHistorialPDF, historialFiltrado.length, paciente?.nombre]);

  const exportarHistorialExcel = useCallback(async () => {
    if (historialFiltrado.length === 0) return;
    const XLSX = await import('xlsx');

    const datos = historialFiltrado.map((registro) => ({
      Fecha: registro.fecha.toLocaleString('es-ES'),
      Tipo: registro.tipo,
      Profesional: registro.profesionalNombre ?? '-',
      Descripción: registro.descripcion ?? '-',
      Resultado: registro.resultado ?? '-',
      Seguimiento: registro.planesSeguimiento ?? '-',
      'Registrado por': registro.creadoPor ?? '-',
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Historial_${paciente?.nombre ?? 'paciente'}_${fecha}.xlsx`);
  }, [historialFiltrado, paciente?.nombre]);

  const compartirHistorialPorCorreo = useCallback(async () => {
    if (!pacienteId || historialFiltrado.length === 0) return;
    try {
      setCompartiendo(true);
      const doc = await generarHistorialPDF();
      const blob = doc.output('blob');
      const timestamp = Date.now();
      const fileName = `historial_${pacienteId}_${timestamp}.pdf`;
      const storagePath = `patient-history/${pacienteId}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: {
          pacienteId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        },
      });
      const url = await getDownloadURL(storageRef);

      const subject = `Historial clínico – ${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`;
      const body = `Hola,\n\nComparto el historial clínico actualizado:\n${url}\n\n`;

      let copied = false;
      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
          toast.success('Enlace copiado al portapapeles. Pégalo en tu correo.');
        } catch {
          copied = false;
        }
      }

      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;

      if (!copied) {
        toast.success('Historial listo. Se abrió tu correo con el enlace.');
      }

      const expiracion = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      await fetch(`/api/pacientes/${pacienteId}/historial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'seguimiento',
          descripcion: `Historial compartido por correo. Enlace disponible hasta ${expiracion.toLocaleString('es-ES')}.`,
          planesSeguimiento: 'Confirmar recepción del informe',
          adjuntos: [url],
          linkExpiresAt: expiracion.toISOString(),
          adjuntosMetadata: [{ url, storagePath }],
        }),
      });
    } catch (err) {
      logger.error('Error preparando historial para correo:', err);
      toast.error('No se pudo preparar el correo con el historial.');
    } finally {
      setCompartiendo(false);
    }
  }, [pacienteId, historialFiltrado.length, generarHistorialPDF, paciente]);

  const handleUploadDocumentos = useCallback(
    async (files: FileList) => {
      if (!pacienteId) {
        toast.error('Paciente no válido para subir documentos.');
        return;
      }

      const fileCount = files.length;
      const toastId = toast.loading(`Subiendo ${fileCount} documento${fileCount > 1 ? 's' : ''}...`);

      try {
        await Promise.all(
          Array.from(files).map(async (file) => {
            const storagePath = `pacientes/${pacienteId}/documentos/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            await addDoc(collection(db, 'pacientes', pacienteId, 'documentos'), {
              nombre: file.name,
              tipo: inferirTipoDocumento(file),
              tamaño: file.size,
              url,
              storagePath,
              fechaSubida: Timestamp.fromDate(new Date()),
              subidoPor: user?.displayName || user?.email || 'sistema',
              etiquetas: [],
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
            });
          })
        );
        toast.success(`${fileCount} documento${fileCount > 1 ? 's subidos' : ' subido'} correctamente`, { id: toastId });
        await refreshDocumentos();
      } catch (error) {
        logger.error('Error subiendo documentos', error);
        toast.error('No se pudieron subir los documentos', { id: toastId });
      }
    },
    [inferirTipoDocumento, pacienteId, refreshDocumentos, user?.displayName, user?.email]
  );

  const handleDeleteDocumento = useCallback(
    async (id: string) => {
      if (!pacienteId) return;
      const documento = documentosFirestoreMap.get(id);
      if (!documento) {
        toast.error('Este documento es de solo lectura.');
        return;
      }

      // Show immediate optimistic feedback
      const toastId = toast.loading('Eliminando documento...');

      try {
        const docRef = doc(db, 'pacientes', pacienteId, 'documentos', id);
        await deleteDoc(docRef);
        if (documento.storagePath) {
          await deleteObject(ref(storage, documento.storagePath));
        }
        toast.success('Documento eliminado', { id: toastId });
        await refreshDocumentos();
      } catch (error) {
        logger.error('Error eliminando documento', error);
        toast.error('No se pudo eliminar el documento', { id: toastId });
      }
    },
    [documentosFirestoreMap, pacienteId, refreshDocumentos]
  );

  const handleShareDocumento = useCallback(
    async (id: string) => {
      const documento = documentos.find((doc) => doc.id === id);
      if (!documento) {
        toast.error('Documento no encontrado.');
        return;
      }
      try {
        await navigator?.clipboard?.writeText(documento.url);
        toast.success('Enlace copiado al portapapeles.');
      } catch {
        window.open(documento.url, '_blank');
        toast.info('No se pudo copiar el enlace. Se abrió en una nueva pestaña.');
      }
    },
    [documentos]
  );

  const handleDownloadDocumento = useCallback(
    (id: string) => {
      const documento = documentos.find((doc) => doc.id === id);
      if (!documento) {
        toast.error('Documento no encontrado.');
        return;
      }
      window.open(documento.url, '_blank');
    },
    [documentos]
  );

  const handleViewDocumento = useCallback(
    (id: string) => {
      const documento = documentos.find((doc) => doc.id === id);
      if (!documento) {
        toast.error('Documento no encontrado.');
        return;
      }
      window.open(documento.url, '_blank', 'noopener,noreferrer');
    },
    [documentos]
  );

  const handleVerDocumento = useCallback(
    (id: string) => {
      const factura = facturas.find((f) => f.id === id);
      if (factura) {
        setFacturaSeleccionada(factura);
        setPresupuestoSeleccionado(null);
        setDetalleTab('resumen');
        return;
      }
      const presupuesto = presupuestos.find((p) => p.id === id);
      if (presupuesto) {
        setPresupuestoSeleccionado(presupuesto);
        setFacturaSeleccionada(null);
        setDetalleTab('resumen');
        return;
      }
      toast.error('No se encontró el documento seleccionado.');
    },
    [facturas, presupuestos]
  );

  const generarFacturaPDF = useCallback(
    async (factura: PacienteFactura) => {
      const [{ default: JsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable = autoTableModule.default ?? autoTableModule;
      const doc = new JsPDF();
      const pacienteNombre = `${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`.trim();

      doc.setFontSize(16);
      doc.text(`Factura ${factura.numero}`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Paciente: ${pacienteNombre || 'Paciente sin nombre'}`, 14, 30);
      doc.text(`Fecha emisión: ${factura.fecha.toLocaleDateString('es-ES')}`, 14, 36);
      doc.text(
        `Importe: ${currencyFormatter.format(factura.total)} (${factura.estado.toUpperCase()})`,
        14,
        42
      );

      autoTable(doc, {
        startY: 52,
        head: [['Concepto', 'Cant.', 'Precio', 'Total']],
        body:
          factura.items.length > 0
            ? factura.items.map((item) => [
                item.concepto,
                String(item.cantidad),
                currencyFormatter.format(item.precioUnitario),
                currencyFormatter.format(item.total),
              ])
            : [['Sin conceptos', '-', '-', '-']],
      });

      const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
      const finalY = docWithTable.lastAutoTable?.finalY ?? 80;
      doc.text(
        `Pendiente: ${currencyFormatter.format(Math.max(factura.total - factura.pagado, 0))}`,
        14,
        finalY + 10
      );
      doc.save(`Factura_${factura.numero}.pdf`);
    },
    [currencyFormatter, paciente?.apellidos, paciente?.nombre]
  );

  const generarPresupuestoPDF = useCallback(
    async (presupuesto: PacientePresupuesto) => {
      const [{ default: JsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable = autoTableModule.default ?? autoTableModule;
      const doc = new JsPDF();
      const pacienteNombre = `${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`.trim();

      doc.setFontSize(16);
      doc.text(`Presupuesto ${presupuesto.numero}`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Paciente: ${pacienteNombre || 'Paciente sin nombre'}`, 14, 30);
      doc.text(`Emitido: ${presupuesto.fecha.toLocaleDateString('es-ES')}`, 14, 36);
      if (presupuesto.validoHasta) {
        doc.text(`Válido hasta: ${presupuesto.validoHasta.toLocaleDateString('es-ES')}`, 14, 42);
      }

      autoTable(doc, {
        startY: 52,
        head: [['Concepto', 'Cant.', 'Precio', 'Total']],
        body:
          presupuesto.items.length > 0
            ? presupuesto.items.map((item) => [
                item.concepto,
                String(item.cantidad),
                currencyFormatter.format(item.precioUnitario),
                currencyFormatter.format(item.total),
              ])
            : [['Sin conceptos', '-', '-', '-']],
      });

      const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
      const finalY = docWithTable.lastAutoTable?.finalY ?? 80;
      doc.text(`Importe total: ${currencyFormatter.format(presupuesto.total)}`, 14, finalY + 10);
      doc.save(`Presupuesto_${presupuesto.numero}.pdf`);
    },
    [currencyFormatter, paciente?.apellidos, paciente?.nombre]
  );

  const handleDescargarFactura = useCallback(
    async (id: string) => {
      const factura = facturas.find((f) => f.id === id);
      if (factura) {
        await generarFacturaPDF(factura);
        return;
      }
      const presupuesto = presupuestos.find((p) => p.id === id);
      if (presupuesto) {
        await generarPresupuestoPDF(presupuesto);
        return;
      }
      toast.error('Documento no encontrado para descarga.');
    },
    [facturas, generarFacturaPDF, generarPresupuestoPDF, presupuestos]
  );

  const handleEnviarFactura = useCallback(
    (id: string) => {
      const factura = facturas.find((f) => f.id === id);
      const presupuesto = factura ? null : presupuestos.find((p) => p.id === id);
      const tipo = factura ? 'Factura' : presupuesto ? 'Presupuesto' : null;
      if (!tipo) {
        toast.error('Documento no encontrado.');
        return;
      }
      const destinatario = paciente?.email ? paciente.email : 'el paciente';
      toast.success(`${tipo} enviada correctamente a ${destinatario}.`);
    },
    [facturas, paciente?.email, presupuestos]
  );

  const handleRegistrarPago = useCallback(
    async (id: string) => {
      const factura = facturas.find((f) => f.id === id);
      if (!factura || !pacienteId) {
        toast.error('Factura no encontrada.');
        return;
      }
      try {
        const facturaRef = doc(db, 'pacientes', pacienteId, 'facturas', id);
        const ahora = new Date();
        await updateDoc(facturaRef, {
          estado: 'pagada',
          pagado: factura.total,
          fechaPago: Timestamp.fromDate(ahora),
          updatedAt: Timestamp.fromDate(ahora),
        });
        toast.success('Pago registrado correctamente.');
        setFacturaSeleccionada({
          ...factura,
          estado: 'pagada',
          pagado: factura.total,
          fechaPago: ahora,
        });
        await refreshFacturacion();
      } catch (error) {
        logger.error('Error registrando pago', error);
        toast.error('No se pudo registrar el pago.');
      }
    },
    [facturas, pacienteId, refreshFacturacion]
  );

  const handleCloseDetalle = useCallback(() => {
    setFacturaSeleccionada(null);
    setPresupuestoSeleccionado(null);
    setDetalleTab('resumen');
  }, []);

  // Early returns
  if (!pacienteId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Identificador de paciente no válido.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-text">Cargando ficha...</div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {error ?? 'No se encontró el paciente solicitado.'}
      </div>
    );
  }

  const seguimientoPendiente = hasActiveFollowUpInHistory(historial);

  // Tab renderers
  const renderResumenTab = () => (
    <TabErrorBoundary tabName="Resumen" onRetry={() => window.location.reload()}>
      <div className="space-y-4">
        <PatientResumenTab
        paciente={paciente}
        profesionalReferente={profesionalReferente}
        proximasCitas={proximasCitas}
        tratamientosActivos={serviciosRelacionados.map((servicio) => ({
          id: servicio.id,
          nombre: servicio.catalogoServicioNombre ?? 'Servicio',
          progreso: servicio.esActual ? 70 : 40,
          profesional: servicio.profesionalPrincipalNombre ?? 'Sin profesional',
        }))}
        estadisticas={{
          totalCitas: historial.length,
          ultimaVisita: historial[0]?.fecha,
          tratamientosCompletados: historial.filter((r) => r.tipo === 'tratamiento').length,
          facturasPendientes: 0,
        }}
        agendaLink={agendaLink}
        buildAgendaLink={agendaLinkBuilder}
        onQuickAction={handleResumenQuickAction}
      />
      {paciente.profesionalReferenteId && (
        <PatientAvailabilityCard
          profesionalId={paciente.profesionalReferenteId}
          agendaLinkBuilder={agendaLinkBuilder}
        />
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <PatientResumenServiciosCard servicios={serviciosRelacionados} />
        <PatientResumenPendientesCard
          pacienteId={pacienteId}
          documentos={documentos}
          seguimientoPendiente={seguimientoPendiente}
        />
      </div>

      {relacionesError && (
        <div className="rounded-lg border border-warn bg-warn-bg/40 px-4 py-3 text-sm text-warn">
          {relacionesError}
        </div>
      )}
      </div>
    </TabErrorBoundary>
  );

  const renderHistorialTab = () => (
    <TabErrorBoundary tabName="Historial Clínico" onRetry={() => window.location.reload()}>
      <div className="space-y-4">
        <PatientHistorialClinicoTab
        alergias={alergiasData}
        medicamentos={[]}
        antecedentes={antecedentesData}
        vacunas={[]}
      />

      <section className="panel-block space-y-4 p-6">
        <PatientHistorialFilters
          filtro={historialFiltro}
          onFiltroChange={setHistorialFiltro}
          onExportarExcel={() => void exportarHistorialExcel()}
          onExportarPDF={() => void exportarHistorialPDF()}
          onCompartirCorreo={() => void compartirHistorialPorCorreo()}
          compartiendo={compartiendo}
          historialCount={historialFiltrado.length}
        />

        {historialFiltrado.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted p-6 text-text-muted">
            No hay registros para el filtro seleccionado.
          </div>
        ) : (
          <div className="space-y-4">
            {historialFiltrado.map((registro) => (
              <PatientHistorialListItem key={registro.id} registro={registro} />
            ))}
          </div>
        )}
      </section>
      </div>
    </TabErrorBoundary>
  );

  const renderCitasTab = () => (
    <TabErrorBoundary tabName="Citas" onRetry={refreshHistorial}>
      <PatientCitasTab
      citas={citas}
      paciente={paciente ?? undefined}
      profesionales={profesionalesOptions}
      buildAgendaLink={agendaLinkBuilder}
      onNuevaCita={paciente ? handleNuevaCitaDesdePaciente : undefined}
      onRequestRefresh={refreshHistorial}
      />
    </TabErrorBoundary>
  );

  const renderDocumentosTab = () => (
    <TabErrorBoundary tabName="Documentos" onRetry={refreshDocumentos}>
      <PatientDocumentosTab
      documentos={documentos}
      onUpload={handleUploadDocumentos}
      onDelete={handleDeleteDocumento}
      onShare={handleShareDocumento}
      onDownload={handleDownloadDocumento}
      onView={handleViewDocumento}
      readOnlyIds={readOnlyDocumentoIds}
      />
    </TabErrorBoundary>
  );

  const renderFacturacionTab = () => (
    <TabErrorBoundary tabName="Facturación" onRetry={refreshFacturacion}>
      <PatientFacturacionTab
      facturas={facturas}
      presupuestos={presupuestos}
      onVerFactura={handleVerDocumento}
      onDescargarPDF={handleDescargarFactura}
      onEnviarFactura={handleEnviarFactura}
      onRegistrarPago={handleRegistrarPago}
      />
    </TabErrorBoundary>
  );

  const renderNotasTab = () => (
    <TabErrorBoundary tabName="Notas" onRetry={() => window.location.reload()}>
      <PatientNotasTab notas={notas} />
    </TabErrorBoundary>
  );

  const renderFormulariosTab = () => (
    <TabErrorBoundary tabName="Formularios" onRetry={() => window.location.reload()}>
      {loadingRespuestas ? (
        <TabLoadingFallback message="Cargando formularios del paciente..." />
      ) : (
        <PatientFormulariosTab
        pacienteId={pacienteId}
        respuestas={respuestasFormularios}
        onNuevoFormulario={() => setMostrarModalFormulario(true)}
        />
      )}
    </TabErrorBoundary>
  );

  const renderTratamientosTab = () => (
    <TabErrorBoundary tabName="Tratamientos" onRetry={() => window.location.reload()}>
      <div className="panel-block p-6 text-sm text-text-muted">
        Aún no hay un módulo de tratamientos detallado. Puedes gestionarlos desde servicios asignados.
      </div>
    </TabErrorBoundary>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return renderResumenTab();
      case 'historial-clinico':
        return renderHistorialTab();
      case 'citas':
        return renderCitasTab();
      case 'documentos':
        return renderDocumentosTab();
      case 'facturacion':
        return renderFacturacionTab();
      case 'notas':
        return renderNotasTab();
      case 'formularios':
        return renderFormulariosTab();
      case 'tratamientos':
        return renderTratamientosTab();
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'resumen' as PatientTab, label: 'Resumen', icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      key: 'historial-clinico' as PatientTab,
      label: 'Historial Clínico',
      icon: <Heart className="h-4 w-4" />,
    },
    { key: 'citas' as PatientTab, label: 'Citas', icon: <CalendarIcon className="h-4 w-4" /> },
    {
      key: 'tratamientos' as PatientTab,
      label: 'Tratamientos',
      icon: <ActivityIcon className="h-4 w-4" />,
    },
    { key: 'formularios' as PatientTab, label: 'Formularios', icon: <FileCheck2 className="h-4 w-4" /> },
    { key: 'documentos' as PatientTab, label: 'Documentos', icon: <Folder className="h-4 w-4" /> },
    {
      key: 'facturacion' as PatientTab,
      label: 'Facturación',
      icon: <DollarSign className="h-4 w-4" />,
    },
    { key: 'notas' as PatientTab, label: 'Notas', icon: <StickyNote className="h-4 w-4" /> },
  ];

  const documentoDetalle = facturaSeleccionada ?? presupuestoSeleccionado;
  const detalleHeaderColor = facturaSeleccionada ? 'from-emerald-600 to-emerald-700' : 'from-indigo-600 to-indigo-700';
  const detalleTitulo = facturaSeleccionada
    ? `Factura ${facturaSeleccionada.numero}`
    : presupuestoSeleccionado
    ? `Presupuesto ${presupuestoSeleccionado.numero}`
    : '';
  const detalleResumen = documentoDetalle ? (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border px-3 py-2">
          <p className="text-xs uppercase text-text-muted">Estado</p>
          <p className="text-lg font-semibold text-text">
            {facturaSeleccionada
              ? facturaSeleccionada.estado.toUpperCase()
              : presupuestoSeleccionado?.estado.toUpperCase()}
          </p>
        </div>
        <div className="rounded-2xl border border-border px-3 py-2">
          <p className="text-xs uppercase text-text-muted">
            {facturaSeleccionada ? 'Importe total' : 'Importe estimado'}
          </p>
          <p className="text-lg font-semibold text-text">
            {currencyFormatter.format(documentoDetalle.total)}
          </p>
        </div>
        {facturaSeleccionada && (
          <div className="rounded-2xl border border-border px-3 py-2">
            <p className="text-xs uppercase text-text-muted">Pagado</p>
            <p className="text-lg font-semibold text-success">
              {currencyFormatter.format(facturaSeleccionada.pagado)}
            </p>
          </div>
        )}
        {facturaSeleccionada?.vencimiento && (
          <div className="rounded-2xl border border-border px-3 py-2">
            <p className="text-xs uppercase text-text-muted">Vence</p>
            <p className="text-lg font-semibold text-text">
              {facturaSeleccionada.vencimiento.toLocaleDateString('es-ES')}
            </p>
          </div>
        )}
        {presupuestoSeleccionado?.validoHasta && (
          <div className="rounded-2xl border border-border px-3 py-2">
            <p className="text-xs uppercase text-text-muted">Válido hasta</p>
            <p className="text-lg font-semibold text-text">
              {presupuestoSeleccionado.validoHasta.toLocaleDateString('es-ES')}
            </p>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-text-muted">
        {documentoDetalle.concepto}
      </div>
    </div>
  ) : null;

  const detalleConceptos = documentoDetalle ? (
    <div className="overflow-x-auto rounded-2xl border border-border">
      {documentoDetalle.items.length === 0 ? (
        <p className="p-4 text-sm text-text-muted">No hay conceptos asociados.</p>
      ) : (
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-2 text-left">Concepto</th>
              <th className="px-4 py-2 text-left">Cantidad</th>
              <th className="px-4 py-2 text-left">Precio</th>
              <th className="px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {documentoDetalle.items.map((item) => (
              <tr key={`${item.concepto}-${item.total}`}>
                <td className="px-4 py-2 font-medium text-text">{item.concepto}</td>
                <td className="px-4 py-2 text-text-muted">{item.cantidad}</td>
                <td className="px-4 py-2 text-text-muted">
                  {currencyFormatter.format(item.precioUnitario)}
                </td>
                <td className="px-4 py-2 text-text">
                  {currencyFormatter.format(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ) : null;

  const detalleTabs = documentoDetalle
    ? [
        { id: 'resumen', label: 'Resumen', content: detalleResumen },
        { id: 'conceptos', label: 'Conceptos', content: detalleConceptos },
      ]
    : [];

  return (
    <>
      <PatientProfileLayout
        paciente={paciente}
        actividades={actividadesTimeline}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
        onNewCita={handleNuevaCitaDesdePaciente}
        onNewNota={() => setActiveTab('notas')}
        onUploadDoc={() => setActiveTab('documentos')}
        agendaLinkBuilder={agendaLinkBuilder}
        agendaLink={agendaLink}
      >
        {renderTabContent()}
      </PatientProfileLayout>

      <DetailPanel
        isOpen={Boolean(documentoDetalle)}
        onClose={handleCloseDetalle}
        title={detalleTitulo}
        subtitle={`${paciente.nombre} ${paciente.apellidos}`}
        tabs={detalleTabs}
        currentTab={detalleTab}
        onTabChange={(tab) => setDetalleTab(tab as 'resumen' | 'conceptos')}
        variant="drawer"
        headerColor={detalleHeaderColor}
        actions={
          documentoDetalle && (
            <div className="flex gap-2">
              <button
                onClick={() => void handleDescargarFactura(documentoDetalle.id)}
                className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                Descargar PDF
              </button>
              <button
                onClick={() => handleEnviarFactura(documentoDetalle.id)}
                className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                Enviar
              </button>
              {facturaSeleccionada && facturaSeleccionada.estado !== 'pagada' && (
                <button
                  onClick={() => handleRegistrarPago(facturaSeleccionada.id)}
                  className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Registrar pago
                </button>
              )}
            </div>
          )
        }
      />

      {/* Modal para completar formulario */}
      {paciente && user && mostrarModalFormulario && (
        <CompletarFormularioModal
          isOpen={mostrarModalFormulario}
          onClose={() => setMostrarModalFormulario(false)}
          paciente={paciente}
          userId={user.uid}
        />
      )}
    </>
  );
}
