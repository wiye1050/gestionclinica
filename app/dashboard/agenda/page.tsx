'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  addDays,
  addWeeks,
  startOfWeek
} from 'date-fns';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Profesional,
  SalaClinica,
  EstadoEventoAgenda,
  TipoEventoAgenda
} from '@/types';
import { AgendaToolbar } from '@/components/agenda/AgendaToolbar';
import {
  AgendaWeekView,
  AgendaEventDisplay,
  AgendaBlockDisplay
} from '@/components/agenda/AgendaWeekView';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';

interface AgendaEventItem extends AgendaEventDisplay {
  profesionalId: string;
  salaId?: string;
  tipo: TipoEventoAgenda;
}

interface AgendaBlockItem extends AgendaBlockDisplay {
  profesionalId: string;
  salaId?: string;
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [salas, setSalas] = useState<SalaClinica[]>([]);
  const [eventos, setEventos] = useState<AgendaEventItem[]>([]);
  const [bloques, setBloques] = useState<AgendaBlockItem[]>([]);
  const [selectedProfesional, setSelectedProfesional] = useState<string>('todos');
  const [selectedSala, setSelectedSala] = useState<string>('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  useEffect(() => {
    const cargarProfesionales = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'profesionales'), orderBy('apellidos'), limit(200))
        );
        const data: Profesional[] = snap.docs.map((docSnap) => {
          const info = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            nombre: info.nombre ?? 'Sin nombre',
            apellidos: info.apellidos ?? '',
            especialidad: info.especialidad ?? 'medicina',
            email: info.email ?? '',
            telefono: info.telefono,
            activo: info.activo ?? true,
            horasSemanales: info.horasSemanales ?? 0,
            diasTrabajo: Array.isArray(info.diasTrabajo) ? info.diasTrabajo : [],
            horaInicio: info.horaInicio ?? '09:00',
            horaFin: info.horaFin ?? '17:00',
            serviciosAsignados: info.serviciosAsignados ?? 0,
            cargaTrabajo: info.cargaTrabajo ?? 0,
            createdAt: info.createdAt?.toDate?.() ?? new Date(),
            updatedAt: info.updatedAt?.toDate?.() ?? new Date()
          };
        });
        setProfesionales(data);
      } catch (err) {
        console.error('Error al cargar profesionales:', err);
      }
    };

    const cargarSalas = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'salas'), orderBy('nombre')));
        const data: SalaClinica[] = snap.docs.map((docSnap) => {
          const info = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            nombre: info.nombre ?? 'Sala sin nombre',
            tipo: info.tipo ?? 'general',
            capacidad: info.capacidad ?? 1,
            equipamiento: Array.isArray(info.equipamiento) ? info.equipamiento : [],
            estado: info.estado ?? 'activa',
            colorAgenda: info.colorAgenda,
            notas: info.notas,
            createdAt: info.createdAt?.toDate?.() ?? new Date(),
            updatedAt: info.updatedAt?.toDate?.() ?? new Date(),
            modificadoPor: info.modificadoPor
          };
        });
        setSalas(data);
      } catch (err) {
        console.error('Error al cargar salas:', err);
      }
    };

    cargarProfesionales();
    cargarSalas();
  }, []);

  useEffect(() => {
    if (!user || profesionales.length === 0 || selectedProfesional !== 'todos') return;
    const profesional = profesionales.find((prof) => prof.email === user.email);
    if (profesional) {
      setSelectedProfesional(profesional.id);
    }
  }, [user, profesionales, selectedProfesional]);

  useEffect(() => {
    const cargarAgenda = async () => {
      setLoading(true);
      setError(null);

      try {
        const semanaFin = addDays(currentWeekStart, 7);

        const eventosQuery = query(
          collection(db, 'agenda-eventos'),
          orderBy('fechaInicio', 'asc'),
          where('fechaInicio', '>=', Timestamp.fromDate(currentWeekStart)),
          where('fechaInicio', '<', Timestamp.fromDate(semanaFin))
        );

        const bloquesQuery = query(collection(db, 'agenda-bloques'), orderBy('diaSemana'));

        const [eventosSnap, bloquesSnap] = await Promise.all([
          getDocs(eventosQuery),
          getDocs(bloquesQuery)
        ]);

        const eventosData: AgendaEventItem[] = eventosSnap.docs.map((docSnap) => {
          const data = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            pacienteId: data.pacienteId ?? undefined,
            titulo: data.titulo ?? 'Evento',
            tipo: (data.tipo ?? 'clinico') as TipoEventoAgenda,
            pacienteNombre: data.pacienteNombre,
            profesionalId: data.profesionalId ?? '',
            profesionalNombre: data.profesionalNombre,
            salaId: data.salaId ?? undefined,
            salaNombre: data.salaNombre,
            fechaInicio: data.fechaInicio?.toDate?.() ?? new Date(),
            fechaFin: data.fechaFin?.toDate?.() ?? new Date(),
            estado: (data.estado ?? 'programada') as EstadoEventoAgenda,
            prioridad: data.prioridad ?? 'media'
          };
        });

        const bloquesData: AgendaBlockItem[] = bloquesSnap.docs.map((docSnap) => {
          const data = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            profesionalId: data.profesionalId ?? '',
            profesionalNombre: data.profesionalNombre,
            salaId: data.salaId ?? undefined,
            salaNombre: data.salaNombre,
            diaSemana: typeof data.diaSemana === 'number' ? data.diaSemana : 0,
            horaInicio: data.horaInicio ?? '09:00',
            horaFin: data.horaFin ?? '17:00',
            tipo: data.tipo ?? 'disponible',
            motivo: data.motivo
          };
        });

        setEventos(eventosData);
        setBloques(bloquesData);
      } catch (err) {
        console.error('Error al cargar agenda:', err);
        const mensaje =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la agenda. Comprueba tus reglas de Firestore e índices.';
        setError(mensaje);
      } finally {
        setLoading(false);
      }
    };

    cargarAgenda();
  }, [currentWeekStart, refreshKey]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart]
  );

  const filteredEvents = useMemo(() => {
    return eventos.filter((evento) => {
      const matchProfesional =
        selectedProfesional === 'todos' || evento.profesionalId === selectedProfesional;
      const matchSala = selectedSala === 'todas' || evento.salaId === selectedSala;
      return matchProfesional && matchSala;
    });
  }, [eventos, selectedProfesional, selectedSala]);

  const filteredBlocks = useMemo(() => {
    return bloques.filter((bloque) => {
      const matchProfesional =
        selectedProfesional === 'todos' || bloque.profesionalId === selectedProfesional;
      const matchSala = selectedSala === 'todas' || bloque.salaId === selectedSala;
      return matchProfesional && matchSala;
    });
  }, [bloques, selectedProfesional, selectedSala]);

  const handleUpdateEvento = async (evento: AgendaEventDisplay, nuevoEstado: EstadoEventoAgenda) => {
    setUpdatingEventId(evento.id);
    try {
      await updateDoc(doc(db, 'agenda-eventos', evento.id), {
        estado: nuevoEstado,
        updatedAt: new Date()
      });

      if (evento.pacienteId) {
        const historialSnap = await getDocs(
          query(
            collection(db, 'pacientes-historial'),
            where('eventoAgendaId', '==', evento.id),
            limit(1)
          )
        );

        if (!historialSnap.empty) {
          const historialDoc = historialSnap.docs[0];
          const historialRef = historialDoc.ref;
          const historialData = historialDoc.data() ?? {};
          const payload: Record<string, unknown> = {
            updatedAt: new Date()
          };

          const profesionalNombre = evento.profesionalNombre ?? null;
          const profesionalId = (evento as AgendaEventItem).profesionalId ?? '';

          if (nuevoEstado === 'realizada') {
            payload.tipo = 'tratamiento';
            payload.resultado = 'Atención completada';
            payload.descripcion = historialData.descripcion ?? 'Cita realizada correctamente';
            payload.planesSeguimiento = historialData.planesSeguimiento ?? null;
          } else if (nuevoEstado === 'cancelada') {
            payload.tipo = 'incidencia';
            payload.resultado = 'Cita cancelada';
            payload.planesSeguimiento = 'Reprogramar cita';
            payload.descripcion = 'Evento cancelado por coordinación';
          } else if (nuevoEstado === 'confirmada') {
            payload.tipo = 'seguimiento';
            payload.resultado = 'Cita confirmada';
          }

          payload.profesionalId = profesionalId;
          if (profesionalNombre) {
            payload.profesionalNombre = profesionalNombre;
          }

          await updateDoc(historialRef, payload);
        }
      }

      setRefreshKey((prev) => prev + 1);
      const mensajes: Record<EstadoEventoAgenda, string> = {
        programada: 'Evento actualizado',
        confirmada: 'Cita confirmada',
        realizada: 'Cita marcada como realizada',
        cancelada: 'Cita cancelada'
      };
      toast.success(mensajes[nuevoEstado]);
    } catch (err) {
      console.error('Error al actualizar evento:', err);
      const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el evento.';
      setError(mensaje);
      toast.error('No se pudo actualizar el evento');
    } finally {
      setUpdatingEventId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda Clínica</h1>
          <p className="text-gray-600 mt-1">
            Planifica y coordina las citas de pacientes, reuniones y tratamientos por semana.
          </p>
        </div>
        <Link
          href="/dashboard/agenda/nuevo"
          className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <span>Nuevo evento</span>
        </Link>
      </header>

      <AgendaToolbar
        currentWeekStart={currentWeekStart}
        onPrevWeek={() => setCurrentWeekStart((prev) => addWeeks(prev, -1))}
        onNextWeek={() => setCurrentWeekStart((prev) => addWeeks(prev, 1))}
        onToday={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
        profesionales={profesionales}
        salas={salas}
        selectedProfesional={selectedProfesional}
        onProfesionalChange={setSelectedProfesional}
        selectedSala={selectedSala}
        onSalaChange={setSelectedSala}
      />

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
          Cargando agenda semanal...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {filteredEvents.length === 0 && filteredBlocks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
              No hay eventos ni bloques de disponibilidad registrados para esta semana con los
              filtros seleccionados.
            </div>
          ) : (
            <AgendaWeekView
              weekDays={weekDays}
              events={filteredEvents}
              blocks={filteredBlocks}
              onUpdateEvent={handleUpdateEvento}
              updatingEventId={updatingEventId}
            />
          )}
        </>
      )}
    </div>
  );
}
