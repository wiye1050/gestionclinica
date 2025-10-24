'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Paciente, Profesional, RegistroHistorialPaciente } from '@/types';
import { db, storage } from '@/lib/firebase';
import { PacienteResumen } from '@/components/pacientes/PacienteResumen';
import { PacienteAlertas } from '@/components/pacientes/PacienteAlertas';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

type TabKey = 'resumen' | 'historial' | 'documentos';

export default function PacienteDetallePage() {
  const params = useParams();
  const pacienteId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [historial, setHistorial] = useState<RegistroHistorialPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [historialFiltro, setHistorialFiltro] = useState<'todos' | 'clinico' | 'administrativo'>('todos');
  const [compartiendo, setCompartiendo] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!pacienteId) return;
      setLoading(true);
      setError(null);

      try {
        const pacienteRef = doc(db, 'pacientes', pacienteId);
        const pacienteSnap = await getDoc(pacienteRef);

        if (!pacienteSnap.exists()) {
          setError('No se encontró el paciente solicitado.');
          setPaciente(null);
          setLoading(false);
          return;
        }

        const data = pacienteSnap.data() ?? {};
        type ConsentimientoRaw = {
          tipo?: string;
          fecha?: { toDate?: () => Date };
          documentoId?: string;
          firmadoPor?: string;
        };

        const consentimientos = Array.isArray(data.consentimientos)
          ? (data.consentimientos as ConsentimientoRaw[]).map((item) => ({
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
        const profesionalesData: Profesional[] = profesionalesSnap.docs.map((docSnap) => {
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
          };
        });
        setProfesionales(profesionalesData);

        const historialSnap = await getDocs(
          query(
            collection(db, 'pacientes-historial'),
            where('pacienteId', '==', pacienteId),
            orderBy('fecha', 'desc'),
            limit(50)
          )
        );
        const historialData: RegistroHistorialPaciente[] = historialSnap.docs.map((docSnap) => {
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
            creadoPor: histData.creadoPor ?? 'desconocido'
          };
        });
        setHistorial(historialData);
      } catch (err) {
        console.error('Error cargando paciente:', err);
        const mensaje =
          err instanceof Error ? err.message : 'Error desconocido al cargar la ficha del paciente.';
        setError(mensaje);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [pacienteId]);

  const profesionalReferente = useMemo(() => {
    if (!paciente?.profesionalReferenteId) return null;
    return (
      profesionales.find((prof) => prof.id === paciente.profesionalReferenteId) ?? null
    );
  }, [paciente, profesionales]);

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'resumen', label: 'Resumen clínico' },
    { key: 'historial', label: 'Historial', count: historial.length },
    { key: 'documentos', label: 'Documentos', count: paciente?.consentimientos.length }
  ];

  const filtrosHistorial: Array<{ value: typeof historialFiltro; label: string }> = [
    { value: 'todos', label: 'Todos' },
    { value: 'clinico', label: 'Clínicos' },
    { value: 'administrativo', label: 'Administrativos' }
  ];

  const historialFiltrado = useMemo(() => {
    if (historialFiltro === 'todos') return historial;
    const tiposClinicos: Array<RegistroHistorialPaciente['tipo']> = ['consulta', 'tratamiento', 'seguimiento'];
    const esClinico = (tipo: RegistroHistorialPaciente['tipo']) => tiposClinicos.includes(tipo);
    return historial.filter((registro) =>
      historialFiltro === 'clinico' ? esClinico(registro.tipo) : !esClinico(registro.tipo)
    );
  }, [historial, historialFiltro]);

  const badgeColor = (tipo: RegistroHistorialPaciente['tipo']) => {
    switch (tipo) {
      case 'consulta':
        return 'bg-blue-100 text-blue-700';
      case 'tratamiento':
        return 'bg-green-100 text-green-700';
      case 'seguimiento':
        return 'bg-purple-100 text-purple-700';
      case 'incidencia':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const exportarHistorialExcel = () => {
    if (historialFiltrado.length === 0) {
      return;
    }

    const datos = historialFiltrado.map((registro) => ({
      Fecha: registro.fecha.toLocaleString('es-ES'),
      Tipo: registro.tipo.toUpperCase(),
      Profesional: registro.profesionalNombre ?? 'No asignado',
      Descripción: registro.descripcion,
      Resultado: registro.resultado ?? '—',
      'Plan Seguimiento': registro.planesSeguimiento ?? '—',
      RegistradoPor: registro.creadoPor ?? 'sistema'
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Historial');
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Historial_${paciente?.nombre ?? 'paciente'}_${fecha}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
  };

  const generarHistorialPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Historial Clínico', 14, 18);
    doc.setFontSize(10);
    doc.text(
      `${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''} • Generado: ${new Date().toLocaleString('es-ES')}`,
      14,
      24
    );

    const datos = historialFiltrado.map((registro) => [
      registro.fecha.toLocaleString('es-ES'),
      registro.tipo.toUpperCase(),
      registro.profesionalNombre ?? 'No asignado',
      registro.descripcion,
      registro.resultado ?? '—',
      registro.planesSeguimiento ?? '—',
      registro.creadoPor ?? 'sistema'
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

  const exportarHistorialPDF = () => {
    if (historialFiltrado.length === 0) return;

    const doc = generarHistorialPDF();
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`Historial_${paciente?.nombre ?? 'paciente'}_${fecha}.pdf`);
  };

  const compartirHistorialPorCorreo = async () => {
    if (historialFiltrado.length === 0 || !pacienteId) return;
    try {
      setCompartiendo(true);
      const doc = generarHistorialPDF();
      const blob = doc.output('blob');
      const timestamp = Date.now();
      const fileName = `historial_${pacienteId}_${timestamp}.pdf`;
      const storageRef = ref(storage, `patient-history/${pacienteId}/${fileName}`);
      await uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: {
          pacienteId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() // 7 días
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

      await addDoc(collection(db, 'pacientes-historial'), {
        pacienteId,
        eventoAgendaId: null,
        servicioId: null,
        servicioNombre: null,
        profesionalId: null,
        profesionalNombre: null,
        fecha: new Date(),
        tipo: 'seguimiento',
        descripcion: `Historial compartido por correo. Enlace disponible hasta ${expiracion.toLocaleString('es-ES')}.`,
        resultado: null,
        planesSeguimiento: 'Confirmar recepción del informe',
        adjuntos: [url],
        createdAt: new Date(),
        creadoPor: paciente?.modificadoPor ?? paciente?.creadoPor ?? 'sistema'
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-gray-500">Paciente</p>
          <h1 className="text-3xl font-bold text-gray-900">
            {loading ? 'Cargando...' : `${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`}
          </h1>
          {paciente?.grupoPacienteId && (
            <p className="text-sm text-gray-500">Grupo: {paciente.grupoPacienteId}</p>
          )}
          {!loading && paciente && (
            <p className="text-xs text-gray-400">
              Última actualización:{' '}
              {paciente.updatedAt.toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/pacientes/${pacienteId}/editar`}
            className="rounded-lg border border-blue-200 px-3 py-2 text-blue-600 hover:bg-blue-50"
          >
            Editar paciente
          </Link>
          <Link
            href="/dashboard/pacientes"
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Volver al listado
          </Link>
        </div>
      </header>

      <div className="flex space-x-4 overflow-x-auto rounded-lg border border-gray-200 bg-white p-2 text-sm">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 rounded-md px-4 py-2 transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
          Cargando datos del paciente...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && paciente && (
        <>
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <PacienteResumen paciente={paciente} profesionalReferente={profesionalReferente} />
              </div>
              <div className="space-y-6">
                <PacienteAlertas paciente={paciente} />
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Historial del paciente</h2>
                  <p className="text-sm text-gray-500">
                    Registros de atenciones, seguimientos y cambios administrativos.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-600">Mostrar:</span>
                  {filtrosHistorial.map((filtro) => (
                    <button
                      key={filtro.value}
                      onClick={() => setHistorialFiltro(filtro.value)}
                      className={`rounded-md px-3 py-1 transition-colors ${
                        historialFiltro === filtro.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filtro.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 pl-2">
                    <button
                      onClick={exportarHistorialExcel}
                      className="rounded-md border border-green-200 px-3 py-1 text-green-700 hover:bg-green-50"
                      disabled={historialFiltrado.length === 0}
                    >
                      Exportar Excel
                    </button>
                    <button
                      onClick={exportarHistorialPDF}
                      className="rounded-md border border-purple-200 px-3 py-1 text-purple-700 hover:bg-purple-50"
                      disabled={historialFiltrado.length === 0}
                    >
                      Exportar PDF
                    </button>
                    <button
                      onClick={compartirHistorialPorCorreo}
                      className="rounded-md border border-blue-200 px-3 py-1 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={historialFiltrado.length === 0 || compartiendo}
                    >
                      {compartiendo ? 'Preparando...' : 'Enviar por correo'}
                    </button>
                  </div>
                </div>
              </div>

              {historialFiltrado.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-500">
                  No hay registros para el filtro seleccionado.
                </div>
              ) : (
                <div className="space-y-4">
                  {historialFiltrado.map((registro) => (
                    <article
                      key={registro.id}
                      className="rounded-lg border border-gray-200 bg-white shadow-sm"
                    >
                      <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
                        <div>
                          <p className="text-xs text-gray-500">
                            {registro.fecha.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeColor(registro.tipo)}`}>
                              {registro.tipo.toUpperCase()}
                            </span>
                            <p className="text-sm text-gray-500">
                              Registrado por {registro.creadoPor ?? 'sistema'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {registro.profesionalNombre ?? 'Profesional no asignado'}
                        </div>
                      </header>
                      <div className="space-y-3 px-6 py-4 text-sm text-gray-700">
                        <p>{registro.descripcion}</p>
                        {registro.resultado && (
                          <p className="rounded-lg bg-green-50 px-3 py-2 text-green-700">
                            <span className="font-medium">Resultado: </span>
                            {registro.resultado}
                          </p>
                        )}
                        {registro.planesSeguimiento && (
                          <p className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
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
          )}

          {activeTab === 'documentos' && (
            <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Consentimientos y documentos</h2>
                <p className="text-sm text-gray-500">
                  Resumen de los consentimientos firmados y documentos clínicos asociados.
                </p>
              </div>

              {paciente.consentimientos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-500">
                  No hay consentimientos registrados para este paciente.
                </div>
              ) : (
                <ul className="space-y-3">
                  {paciente.consentimientos.map((consentimiento, index) => (
                    <li
                      key={`${consentimiento.tipo}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{consentimiento.tipo}</p>
                        <p className="text-gray-500">
                          {consentimiento.fecha.toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {consentimiento.firmadoPor
                          ? `Firmado por ${consentimiento.firmadoPor}`
                          : 'Firmado en clínica'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
