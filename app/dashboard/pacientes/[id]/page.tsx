'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Paciente,
  Profesional,
  RegistroHistorialPaciente,
  ServicioAsignado
} from '@/types';
import { db, storage } from '@/lib/firebase';
import PatientProfileLayout, { PatientTab } from '@/components/pacientes/v2/PatientProfileLayout';
import PatientResumenTab from '@/components/pacientes/v2/PatientResumenTab';
import PatientHistorialClinicoTab from '@/components/pacientes/v2/PatientHistorialClinicoTab';
import PatientCitasTab, { Cita } from '@/components/pacientes/v2/PatientCitasTab';
import PatientDocumentosTab from '@/components/pacientes/v2/PatientDocumentosTab';
import PatientFacturacionTab from '@/components/pacientes/v2/PatientFacturacionTab';
import PatientNotasTab from '@/components/pacientes/v2/PatientNotasTab';
import type { Activity as TimelineActivity } from '@/components/pacientes/v2/PatientTimeline';
import { resolverSeguimientoAction } from '../actions';
import { hasActiveFollowUpInHistory } from '@/lib/utils/followUps';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Heart,
  Calendar as CalendarIcon,
  Activity as ActivityIcon,
  Folder,
  DollarSign,
  StickyNote
} from 'lucide-react';

const HISTORIAL_FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'clinico', label: 'Clínicos' },
  { value: 'administrativo', label: 'Administrativos' }
] as const;

type HistorialFiltro = (typeof HISTORIAL_FILTROS)[number]['value'];

type DocumentoPaciente = {
  id: string;
  nombre: string;
  tipo: 'informe' | 'consentimiento' | 'receta' | 'imagen' | 'analitica' | 'factura' | 'otro';
  tamaño: number;
  url: string;
  fechaSubida: Date;
  subidoPor: string;
  etiquetas: string[];
};

type NotaPaciente = Parameters<typeof PatientNotasTab>[0]['notas'][number];
type ConsentimientoRaw = {
  tipo?: string;
  fecha?: { toDate?: () => Date };
  documentoId?: string;
  firmadoPor?: string;
};

export default function PacienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const pacienteId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [historial, setHistorial] = useState<RegistroHistorialPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PatientTab>('resumen');
  const [historialFiltro, setHistorialFiltro] = useState<HistorialFiltro>('todos');
  const [compartiendo, setCompartiendo] = useState(false);

  const [serviciosRelacionados, setServiciosRelacionados] = useState<ServicioAsignado[]>([]);
  const [relacionesError, setRelacionesError] = useState<string | null>(null);

  const fetchRelacionesGrupo = useCallback(
    async (grupoId: string) => {
      setRelacionesError(null);

      try {
        const serviciosSnap = await getDocs(
          query(collection(db, 'servicios-asignados'), where('grupoId', '==', grupoId), limit(25))
        );

        const serviciosData: ServicioAsignado[] = serviciosSnap.docs.map((docSnap) => {
          const data = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            catalogoServicioId: data.catalogoServicioId,
            catalogoServicioNombre: data.catalogoServicioNombre,
            grupoId: data.grupoId,
            grupoNombre: data.grupoNombre,
            esActual: data.esActual ?? false,
            estado: data.estado ?? 'activo',
            tiquet: data.tiquet ?? 'NO',
            profesionalPrincipalId: data.profesionalPrincipalId,
            profesionalPrincipalNombre: data.profesionalPrincipalNombre,
            requiereApoyo: data.requiereApoyo ?? false,
            sala: data.sala,
            tiempoReal: data.tiempoReal,
            supervision: data.supervision ?? false,
            vecesRealizadoMes: data.vecesRealizadoMes ?? 0,
            ultimaRealizacion: data.ultimaRealizacion?.toDate?.(),
            proximaRealizacion: data.proximaRealizacion?.toDate?.(),
            notas: data.notas,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
            creadoPor: data.creadoPor ?? 'sistema'
          } as ServicioAsignado;
        });

        setServiciosRelacionados(serviciosData);
      } catch (err) {
        console.error('Error cargando servicios relacionados', err);
        setRelacionesError('No se pudieron cargar los servicios relacionados.');
        setServiciosRelacionados([]);
      } finally {
        }
    },
    []
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!pacienteId) {
        setError('Identificador de paciente no válido.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const pacienteRef = doc(db, 'pacientes', pacienteId);
        const pacienteSnap = await getDoc(pacienteRef);
        if (!pacienteSnap.exists()) {
          setError('Paciente no encontrado');
          setPaciente(null);
          setLoading(false);
          return;
        }

        const data = pacienteSnap.data() ?? {};
        const consentimientos = Array.isArray(data.consentimientos)
          ? data.consentimientos.map((item: ConsentimientoRaw) => ({
              tipo: item?.tipo ?? 'general',
              fecha: item?.fecha?.toDate?.() ?? new Date(),
              documentoId: item?.documentoId,
              firmadoPor: item?.firmadoPor
            }))
          : [];

        const pacienteData: Paciente = {
          id: pacienteSnap.id,
          nombre: data.nombre ?? 'Sin nombre',
          apellidos: data.apellidos ?? '',
          fechaNacimiento: data.fechaNacimiento?.toDate?.() ?? new Date('1970-01-01'),
          genero: data.genero ?? 'no-especificado',
          documentoId: data.documentoId,
          tipoDocumento: data.tipoDocumento,
          telefono: data.telefono,
          email: data.email,
          direccion: data.direccion,
          ciudad: data.ciudad,
          codigoPostal: data.codigoPostal,
          aseguradora: data.aseguradora,
          numeroPoliza: data.numeroPoliza,
          alergias: Array.isArray(data.alergias) ? data.alergias : [],
          alertasClinicas: Array.isArray(data.alertasClinicas) ? data.alertasClinicas : [],
          diagnosticosPrincipales: Array.isArray(data.diagnosticosPrincipales)
            ? data.diagnosticosPrincipales
            : [],
          riesgo: data.riesgo ?? 'medio',
          contactoEmergencia: data.contactoEmergencia
            ? {
                nombre: data.contactoEmergencia.nombre ?? '',
                parentesco: data.contactoEmergencia.parentesco ?? '',
                telefono: data.contactoEmergencia.telefono ?? ''
              }
            : undefined,
          consentimientos,
          estado: data.estado ?? 'activo',
          profesionalReferenteId: data.profesionalReferenteId,
          grupoPacienteId: data.grupoPacienteId,
          notasInternas: data.notasInternas,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          creadoPor: data.creadoPor ?? 'desconocido',
          modificadoPor: data.modificadoPor
        };

        setPaciente(pacienteData);

        const profesionalesSnap = await getDocs(
          query(collection(db, 'profesionales'), orderBy('apellidos'), limit(200))
        );
        setProfesionales(
          profesionalesSnap.docs.map((docSnap) => {
            const profData = docSnap.data() ?? {};
            return {
              id: docSnap.id,
              nombre: profData.nombre ?? 'Sin nombre',
              apellidos: profData.apellidos ?? '',
              especialidad: profData.especialidad ?? 'medicina',
              email: profData.email ?? '',
              telefono: profData.telefono,
              activo: profData.activo ?? true,
              horasSemanales: profData.horasSemanales ?? 0,
              diasTrabajo: Array.isArray(profData.diasTrabajo) ? profData.diasTrabajo : [],
              horaInicio: profData.horaInicio ?? '09:00',
              horaFin: profData.horaFin ?? '17:00',
              serviciosAsignados: profData.serviciosAsignados ?? 0,
              cargaTrabajo: profData.cargaTrabajo ?? 0,
              createdAt: profData.createdAt?.toDate?.() ?? new Date(),
              updatedAt: profData.updatedAt?.toDate?.() ?? new Date()
            } as Profesional;
          })
        );

        const historialSnap = await getDocs(
          query(
            collection(db, 'pacientes-historial'),
            where('pacienteId', '==', pacienteId),
            orderBy('fecha', 'desc'),
            limit(100)
          )
        );
        setHistorial(
          historialSnap.docs.map((docSnap) => {
            const histData = docSnap.data() ?? {};
            return {
              id: docSnap.id,
              pacienteId: histData.pacienteId ?? pacienteId,
              eventoAgendaId: histData.eventoAgendaId,
              servicioId: histData.servicioId,
              servicioNombre: histData.servicioNombre,
              profesionalId: histData.profesionalId,
              profesionalNombre: histData.profesionalNombre,
              fecha: histData.fecha?.toDate?.() ?? new Date(),
              tipo: histData.tipo ?? 'consulta',
              descripcion: histData.descripcion ?? '',
              resultado: histData.resultado,
              planesSeguimiento: histData.planesSeguimiento,
              adjuntos: Array.isArray(histData.adjuntos) ? histData.adjuntos : [],
              createdAt: histData.createdAt?.toDate?.() ?? new Date(),
              creadoPor: histData.creadoPor ?? 'sistema'
            } satisfies RegistroHistorialPaciente;
          })
        );

        if (pacienteData.grupoPacienteId) {
          await fetchRelacionesGrupo(pacienteData.grupoPacienteId);
        }
      } catch (err) {
        console.error('Error cargando paciente:', err);
        setError('No se pudo cargar la información del paciente.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [pacienteId, fetchRelacionesGrupo]);

  const profesionalReferente = useMemo(() => {
    if (!paciente?.profesionalReferenteId) return null;
    return profesionales.find((prof) => prof.id === paciente.profesionalReferenteId) ?? null;
  }, [paciente, profesionales]);

  const actividadesTimeline = useMemo<TimelineActivity[]>(() => {
    return historial.map((registro) => {
      const tipo = mapRegistroToActivityType(registro.tipo);
      const estado = registro.resultado
        ? 'success'
        : registro.planesSeguimiento
        ? 'info'
        : undefined;

      return {
        id: registro.id,
        tipo,
        titulo: registro.servicioNombre ?? registro.tipo,
        descripcion: registro.descripcion,
        fecha: registro.fecha,
        usuario: registro.profesionalNombre ?? registro.creadoPor,
        estado
      } satisfies TimelineActivity;
    });
  }, [historial]);

  const citas = useMemo<Cita[]>(() => {
    return historial.map((registro) => mapRegistroToCita(registro));
  }, [historial]);

  const proximasCitas = useMemo(() => {
    const now = new Date();
    return citas
      .filter((cita) => cita.fecha >= now)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(0, 8);
  }, [citas]);

  const documentos = useMemo<DocumentoPaciente[]>(() => {
    if (!paciente) return [];
    const consentimientosDocs = paciente.consentimientos.map((consent, index) => ({
      id: consent.documentoId ?? `cons-${index}`,
      nombre: consent.tipo,
      tipo: 'consentimiento' as const,
      tamaño: 0,
      url: consent.documentoId ?? '#',
      fechaSubida: consent.fecha ?? new Date(),
      subidoPor: consent.firmadoPor ?? `${paciente.nombre} ${paciente.apellidos}`,
      etiquetas: ['consentimiento']
    }));

    const adjuntosDocs: DocumentoPaciente[] = historial.flatMap((registro) =>
      (registro.adjuntos ?? []).map((url, index) => ({
        id: `${registro.id}-adj-${index}`,
        nombre: registro.servicioNombre ? `${registro.servicioNombre} adjunto` : `Adjunto ${index + 1}`,
        tipo: 'otro' as const,
        tamaño: 0,
        url,
        fechaSubida: registro.fecha,
        subidoPor: registro.profesionalNombre ?? registro.creadoPor,
        etiquetas: ['historial']
      }))
    );

    return [...consentimientosDocs, ...adjuntosDocs];
  }, [paciente, historial]);

  const notas = useMemo<NotaPaciente[]>(() => {
    return historial.map((registro) => ({
      id: registro.id,
      titulo: registro.servicioNombre ?? registro.tipo,
      contenido: registro.descripcion ?? '',
      categoria:
        registro.tipo === 'incidencia'
          ? 'alerta'
          : registro.tipo === 'seguimiento'
          ? 'comunicacion'
          : 'clinica',
      autor: registro.profesionalNombre ?? registro.creadoPor ?? 'Sistema',
      fecha: registro.fecha,
      esPrivada: false,
      etiquetas: [registro.tipo]
    }));
  }, [historial]);

  const alergiasData = useMemo(() => {
    return (paciente?.alergias ?? []).map((nombre, index) => ({
      id: `alergia-${index}`,
      nombre,
      severidad: 'moderada' as const
    }));
  }, [paciente]);

  const antecedentesData = useMemo(() => {
    return (paciente?.diagnosticosPrincipales ?? []).map((condicion, index) => ({
      id: `antecedente-${index}`,
      tipo: 'personal' as const,
      condicion
    }));
  }, [paciente]);

  const historialFiltrado = useMemo(() => {
    const tiposClinicos: Array<RegistroHistorialPaciente['tipo']> = ['consulta', 'tratamiento', 'seguimiento'];
    const esClinico = (tipo: RegistroHistorialPaciente['tipo']) => tiposClinicos.includes(tipo);

    return historial.filter((registro) =>
      historialFiltro === 'clinico'
        ? esClinico(registro.tipo)
        : historialFiltro === 'administrativo'
        ? !esClinico(registro.tipo)
        : true
    );
  }, [historial, historialFiltro]);

  const actividadesOrdenadas = useMemo(() => historialFiltrado, [historialFiltrado]);

  const badgeColor = (tipo: RegistroHistorialPaciente['tipo']) => {
    switch (tipo) {
      case 'consulta':
        return 'bg-brand-subtle text-brand';
      case 'tratamiento':
        return 'bg-success-bg text-success';
      case 'seguimiento':
        return 'bg-warn-bg text-warn';
      case 'incidencia':
        return 'bg-danger-bg text-danger';
      default:
        return 'bg-cardHover text-text-muted';
    }
  };

  const generarHistorialPDF = async () => {
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
      registro.creadoPor
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Tipo', 'Profesional', 'Descripción', 'Resultado', 'Seguimiento', 'Registrado por']],
      body: datos,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    return doc;
  };

  const exportarHistorialPDF = async () => {
    if (historialFiltrado.length === 0) return;
    const doc = await generarHistorialPDF();
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`Historial_${paciente?.nombre ?? 'paciente'}_${fecha}.pdf`);
  };

  const exportarHistorialExcel = async () => {
    if (historialFiltrado.length === 0) return;
    const XLSX = await import('xlsx');
    const datos = historialFiltrado.map((registro) => ({
      Fecha: registro.fecha.toLocaleString('es-ES'),
      Tipo: registro.tipo,
      Profesional: registro.profesionalNombre ?? '-',
      Descripción: registro.descripcion ?? '-',
      Resultado: registro.resultado ?? '-',
      Seguimiento: registro.planesSeguimiento ?? '-',
      'Registrado por': registro.creadoPor ?? '-'
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Historial_${paciente?.nombre ?? 'paciente'}_${fecha}.xlsx`);
  };

  const compartirHistorialPorCorreo = async () => {
    if (!pacienteId || historialFiltrado.length === 0) return;
    try {
      setCompartiendo(true);
      const doc = await generarHistorialPDF();
      const blob = doc.output('blob');
      const timestamp = Date.now();
      const fileName = `historial_${pacienteId}_${timestamp}.pdf`;
      const storageRef = ref(storage, `patient-history/${pacienteId}/${fileName}`);
      await uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: {
          pacienteId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
        }
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
        }),
      });
    } catch (err) {
      console.error('Error preparando historial para correo:', err);
      toast.error('No se pudo preparar el correo con el historial.');
    } finally {
      setCompartiendo(false);
    }
  };

  if (!pacienteId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Identificador de paciente no válido.
      </div>
    );
  }

  if (loading) {
    return <div className="rounded-lg border border-border bg-card p-6 text-text">Cargando ficha...</div>;
  }

  if (error || !paciente) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {error ?? 'No se encontró el paciente solicitado.'}
      </div>
    );
  }

  const seguimientoPendiente = hasActiveFollowUpInHistory(historial);

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
          profesional: servicio.profesionalPrincipalNombre ?? 'Sin profesional'
        }))}
        estadisticas={{
          totalCitas: historial.length,
          ultimaVisita: historial[0]?.fecha,
          tratamientosCompletados: historial.filter((registro) => registro.tipo === 'tratamiento').length,
          facturasPendientes: 0
        }}
      />
      {seguimientoPendiente && (
        <form action={resolverSeguimientoAction} className="flex justify-end">
          <input type="hidden" name="pacienteId" value={pacienteId} />
          <button className="rounded-pill border border-success bg-success-bg px-4 py-2 text-sm font-medium text-success hover:bg-success-bg/80 focus-visible:focus-ring">
            Marcar seguimiento resuelto
          </button>
        </form>
      )}
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

      <section className="space-y-4 panel-block p-6">
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
            {actividadesOrdenadas.map((registro) => (
              <article key={registro.id} className="panel-block shadow-sm">
                <header className="flex flex-col gap-2 border-b border-border/70 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs text-text-muted">
                      {registro.fecha.toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-pill px-2 py-1 text-xs font-semibold ${badgeColor(registro.tipo)}`}>
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

  const renderDocumentosTab = () => (
    <PatientDocumentosTab
      documentos={documentos}
      onUpload={undefined}
      onDelete={undefined}
      onShare={undefined}
      onDownload={undefined}
      onView={undefined}
    />
  );

  const renderFacturacionTab = () => (
    <PatientFacturacionTab facturas={[]} presupuestos={[]} />
  );

  const renderNotasTab = () => (
    <PatientNotasTab notas={notas} />
  );

  const handleNuevaCitaDesdePaciente = () => {
    if (!paciente) return;
    const params = new URLSearchParams({
      newEvent: '1',
      pacienteId: paciente.id,
    });
    const fullName = `${paciente.nombre ?? ''} ${paciente.apellidos ?? ''}`.trim();
    if (fullName) {
      params.set('pacienteNombre', fullName);
    }
    if (paciente.profesionalReferenteId) {
      params.set('profesionalId', paciente.profesionalReferenteId);
    }
    router.push(`/dashboard/agenda?${params.toString()}`);
  };

  const renderCitasTab = () => (
    <PatientCitasTab
      citas={citas}
      paciente={paciente ?? undefined}
      onNuevaCita={paciente ? handleNuevaCitaDesdePaciente : undefined}
      onRequestRefresh={async () => {
        if (!pacienteId) return;
        const historialSnap = await getDocs(
          query(
            collection(db, 'pacientes-historial'),
            where('pacienteId', '==', pacienteId),
            orderBy('fecha', 'desc'),
            limit(100)
          )
        );
        setHistorial(
          historialSnap.docs.map((docSnap) => {
            const histData = docSnap.data() ?? {};
            return {
              id: docSnap.id,
              pacienteId: histData.pacienteId ?? pacienteId,
              eventoAgendaId: histData.eventoAgendaId,
              servicioId: histData.servicioId,
              servicioNombre: histData.servicioNombre,
              profesionalId: histData.profesionalId,
              profesionalNombre: histData.profesionalNombre,
              fecha: histData.fecha?.toDate?.() ?? new Date(),
              tipo: histData.tipo ?? 'consulta',
              descripcion: histData.descripcion ?? '',
              resultado: histData.resultado,
              planesSeguimiento: histData.planesSeguimiento,
              adjuntos: Array.isArray(histData.adjuntos) ? histData.adjuntos : [],
              createdAt: histData.createdAt?.toDate?.() ?? new Date(),
              creadoPor: histData.creadoPor ?? 'sistema',
            } satisfies RegistroHistorialPaciente;
          })
        );
      }}
    />
  );

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
    { key: 'resumen' as PatientTab, label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'historial-clinico' as PatientTab, label: 'Historial Clínico', icon: <Heart className="w-4 h-4" /> },
    { key: 'citas' as PatientTab, label: 'Citas', icon: <CalendarIcon className="w-4 h-4" /> },
    { key: 'tratamientos' as PatientTab, label: 'Tratamientos', icon: <ActivityIcon className="w-4 h-4" /> },
    { key: 'documentos' as PatientTab, label: 'Documentos', icon: <Folder className="w-4 h-4" /> },
    { key: 'facturacion' as PatientTab, label: 'Facturación', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'notas' as PatientTab, label: 'Notas', icon: <StickyNote className="w-4 h-4" /> }
  ];

  return (
    <PatientProfileLayout
      paciente={paciente}
      actividades={actividadesTimeline}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
      onNewCita={handleNuevaCitaDesdePaciente}
      onNewNota={() => setActiveTab('notas')}
      onUploadDoc={() => setActiveTab('documentos')}
    >
      {renderTabContent()}
    </PatientProfileLayout>
  );
}

function mapRegistroToActivityType(tipo: RegistroHistorialPaciente['tipo']): TimelineActivity['tipo'] {
  switch (tipo) {
    case 'consulta':
      return 'cita';
    case 'tratamiento':
      return 'tratamiento';
    case 'seguimiento':
      return 'nota';
    case 'incidencia':
      return 'documento';
    default:
      return 'documento';
  }
}

function mapRegistroToCita(registro: RegistroHistorialPaciente): Cita {
  const now = new Date();
  const estado = registro.fecha > now ? 'programada' : 'realizada';
  const tipoMap: Record<RegistroHistorialPaciente['tipo'], Cita['tipo']> = {
    consulta: 'consulta',
    tratamiento: 'tratamiento',
    seguimiento: 'seguimiento',
    incidencia: 'revision'
  };

  return {
    id: registro.id,
    fecha: registro.fecha,
    profesional: registro.profesionalNombre ?? 'Sin asignar',
    profesionalId: registro.profesionalId ?? 'desconocido',
    tipo: tipoMap[registro.tipo] ?? 'consulta',
    estado,
    sala: undefined,
    motivo: registro.descripcion,
    notas: registro.resultado,
    evolucion: registro.planesSeguimiento,
    diagnosticos: registro.resultado ? [registro.resultado] : [],
    documentos: (registro.adjuntos ?? []).map((url, index) => ({
      id: `${registro.id}-doc-${index}`,
      nombre: `Adjunto ${index + 1}`,
      url
    }))
  };
}
