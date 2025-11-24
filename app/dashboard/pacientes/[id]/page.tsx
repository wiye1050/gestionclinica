'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { usePatientDetailData } from '@/lib/hooks/usePatientDetailData';
import { useAuth } from '@/lib/hooks/useAuth';
import PatientProfileLayout, { PatientTab } from '@/components/pacientes/v2/PatientProfileLayout';
import PatientResumenTab from '@/components/pacientes/v2/PatientResumenTab';
import PatientHistorialClinicoTab from '@/components/pacientes/v2/PatientHistorialClinicoTab';
import PatientCitasTab from '@/components/pacientes/v2/PatientCitasTab';
import PatientDocumentosTab from '@/components/pacientes/v2/PatientDocumentosTab';
import PatientFacturacionTab from '@/components/pacientes/v2/PatientFacturacionTab';
import PatientNotasTab from '@/components/pacientes/v2/PatientNotasTab';
import PatientAvailabilityCard from '@/components/pacientes/v2/PatientAvailabilityCard';
import DetailPanel from '@/components/shared/DetailPanel';
import { resolverSeguimientoAction } from '../actions';
import { hasActiveFollowUpInHistory } from '@/lib/utils/followUps';
import { toast } from 'sonner';
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
} from 'lucide-react';
import type { PacienteFactura, PacientePresupuesto } from '@/types';

export default function PacienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const pacienteId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
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

  // Handlers
  const handleResumenQuickAction = useCallback(
    async (eventId: string, action: 'confirm' | 'complete' | 'cancel') => {
      const estadoMap = {
        confirm: 'confirmada',
        complete: 'realizada',
        cancel: 'cancelada',
      } as const;
      const response = await fetch(`/api/agenda/eventos/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoMap[action] }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? 'No se pudo actualizar la cita');
        throw new Error(data.error ?? 'Error quick action');
      }
      toast.success(
        action === 'confirm'
          ? 'Cita confirmada'
          : action === 'complete'
          ? 'Cita completada'
          : 'Cita cancelada'
      );
      await refreshHistorial();
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
      console.error('Error preparando historial para correo:', err);
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
        toast.success('Documentos subidos correctamente.');
        await refreshDocumentos();
      } catch (error) {
        console.error('Error subiendo documentos', error);
        toast.error('No se pudieron subir los documentos.');
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
      try {
        const docRef = doc(db, 'pacientes', pacienteId, 'documentos', id);
        await deleteDoc(docRef);
        if (documento.storagePath) {
          await deleteObject(ref(storage, documento.storagePath));
        }
        toast.success('Documento eliminado.');
        await refreshDocumentos();
      } catch (error) {
        console.error('Error eliminando documento', error);
        toast.error('No se pudo eliminar el documento.');
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
        console.error('Error registrando pago', error);
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
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-text-muted">
                Tratamientos y servicios
              </p>
              <p className="text-lg font-semibold text-text">Seguimiento en curso</p>
            </div>
            <Link
              href="/dashboard/servicios"
              className="text-xs font-semibold text-brand hover:underline"
            >
              Ver servicios
            </Link>
          </div>
          {serviciosRelacionados.length === 0 ? (
            <p className="text-sm text-text-muted">No hay servicios activos para este paciente.</p>
          ) : (
            <div className="space-y-3">
              {serviciosRelacionados.slice(0, 3).map((servicio) => (
                <div key={servicio.id} className="rounded-2xl border border-border px-4 py-3">
                  <p className="text-sm font-semibold text-text">
                    {servicio.catalogoServicioNombre ?? 'Servicio'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {servicio.profesionalPrincipalNombre ?? 'Sin profesional'} ·{' '}
                    {servicio.esActual ? 'En progreso' : 'Planificado'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-text-muted">
                Pendientes y documentos
              </p>
              <p className="text-lg font-semibold text-text">Integración con otros módulos</p>
            </div>
            <Link
              href={`/dashboard/pacientes/${paciente.id}`}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Ver ficha completa
            </Link>
          </div>
          {seguimientoPendiente ? (
            <div className="rounded-2xl border border-warn bg-warn-bg/30 px-4 py-3 text-sm">
              <p className="font-semibold text-warn">Seguimiento pendiente</p>
              <p className="text-text">
                Hay tareas de seguimiento registradas en el historial reciente. Revisa la pestaña de
                notas o marca el seguimiento como resuelto.
              </p>
              <form action={resolverSeguimientoAction} className="mt-2">
                <input type="hidden" name="pacienteId" value={pacienteId} />
                <button className="rounded-pill border border-success bg-success-bg px-3 py-1 text-xs font-semibold text-success hover:bg-success-bg/80 focus-visible:focus-ring">
                  Marcar seguimiento resuelto
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No hay seguimientos pendientes registrados.</p>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-text-muted">
              Documentos recientes
            </p>
            {documentos.length === 0 ? (
              <p className="text-sm text-text-muted">Sin documentos adjuntos.</p>
            ) : (
              <div className="space-y-2">
                {documentos.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-text">{doc.nombre}</p>
                      <p className="text-xs text-text-muted">
                        {doc.fechaSubida.toLocaleDateString('es-ES')} · {doc.subidoPor}
                      </p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Abrir
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {relacionesError && (
        <div className="rounded-lg border border-warn bg-warn-bg/40 px-4 py-3 text-sm text-warn">
          {relacionesError}
        </div>
      )}
    </div>
  );

  const renderHistorialTab = () => (
    <div className="space-y-4">
      <PatientHistorialClinicoTab
        alergias={alergiasData}
        medicamentos={[]}
        antecedentes={antecedentesData}
        vacunas={[]}
      />

      <section className="panel-block space-y-4 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">Historial del paciente</h2>
            <p className="text-sm text-text-muted">
              Registros de atenciones, seguimientos y cambios administrativos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-text-muted">Mostrar:</span>
            {HISTORIAL_FILTROS.map((filtro) => (
              <button
                key={filtro.value}
                onClick={() => setHistorialFiltro(filtro.value)}
                className={`rounded-pill px-3 py-1 transition-colors ${
                  historialFiltro === filtro.value
                    ? 'bg-brand text-white'
                    : 'bg-muted text-text hover:bg-cardHover'
                }`}
              >
                {filtro.label}
              </button>
            ))}
            <div className="flex items-center gap-2 pl-2">
              <button
                onClick={() => void exportarHistorialExcel()}
                className="rounded-pill border border-success px-3 py-1 text-success hover:bg-success-bg"
                disabled={historialFiltrado.length === 0}
              >
                Exportar Excel
              </button>
              <button
                onClick={() => void exportarHistorialPDF()}
                className="rounded-pill border border-brand px-3 py-1 text-brand hover:bg-brand-subtle"
                disabled={historialFiltrado.length === 0}
              >
                Exportar PDF
              </button>
              <button
                onClick={() => void compartirHistorialPorCorreo()}
                className="rounded-pill border border-brand px-3 py-1 text-brand hover:bg-brand-subtle disabled:cursor-not-allowed disabled:opacity-60"
                disabled={historialFiltrado.length === 0 || compartiendo}
              >
                {compartiendo ? 'Preparando…' : 'Enviar por correo'}
              </button>
            </div>
          </div>
        </div>

        {historialFiltrado.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted p-6 text-text-muted">
            No hay registros para el filtro seleccionado.
          </div>
        ) : (
          <div className="space-y-4">
            {historialFiltrado.map((registro) => (
              <article key={registro.id} className="panel-block shadow-sm">
                <header className="flex flex-col gap-2 border-b border-border/70 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs text-text-muted">
                      {registro.fecha.toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-pill px-2 py-1 text-xs font-semibold ${
                          HISTORIAL_BADGE_COLORS[registro.tipo] ?? 'bg-cardHover text-text-muted'
                        }`}
                      >
                        {registro.tipo.toUpperCase()}
                      </span>
                      <p className="text-sm text-text-muted">
                        Registrado por {registro.creadoPor ?? 'sistema'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-text-muted">
                    {registro.profesionalNombre ?? 'Profesional no asignado'}
                  </div>
                </header>
                <div className="space-y-3 px-6 py-4 text-sm text-text">
                  <p>{registro.descripcion}</p>
                  {registro.resultado && (
                    <p className="rounded-2xl bg-success-bg px-3 py-2 text-success">
                      <span className="font-medium">Resultado: </span>
                      {registro.resultado}
                    </p>
                  )}
                  {registro.planesSeguimiento && (
                    <p className="rounded-2xl bg-brand-subtle px-3 py-2 text-brand">
                      <span className="font-medium">Seguimiento: </span>
                      {registro.planesSeguimiento}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderCitasTab = () => (
    <PatientCitasTab
      citas={citas}
      paciente={paciente ?? undefined}
      profesionales={profesionalesOptions}
      buildAgendaLink={agendaLinkBuilder}
      onNuevaCita={paciente ? handleNuevaCitaDesdePaciente : undefined}
      onRequestRefresh={refreshHistorial}
    />
  );

  const renderDocumentosTab = () => (
    <PatientDocumentosTab
      documentos={documentos}
      onUpload={handleUploadDocumentos}
      onDelete={handleDeleteDocumento}
      onShare={handleShareDocumento}
      onDownload={handleDownloadDocumento}
      onView={handleViewDocumento}
      readOnlyIds={readOnlyDocumentoIds}
    />
  );

  const renderFacturacionTab = () => (
    <PatientFacturacionTab
      facturas={facturas}
      presupuestos={presupuestos}
      onVerFactura={handleVerDocumento}
      onDescargarPDF={handleDescargarFactura}
      onEnviarFactura={handleEnviarFactura}
      onRegistrarPago={handleRegistrarPago}
    />
  );

  const renderNotasTab = () => <PatientNotasTab notas={notas} />;

  const renderTratamientosTab = () => (
    <div className="panel-block p-6 text-sm text-text-muted">
      Aún no hay un módulo de tratamientos detallado. Puedes gestionarlos desde servicios asignados.
    </div>
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
    </>
  );
}
