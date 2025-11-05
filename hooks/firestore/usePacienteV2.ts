// hooks/firestore/usePacienteV2.ts
// Hook unificado para obtener todos los datos de un paciente

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { Paciente, Profesional } from '@/types';
import {
  Cita,
  Tratamiento,
  Documento,
  Nota,
  Actividad,
  mapHistorialToCita,
  mapServicioToTratamiento,
  mapHistorialToActividad,
  mapHistorialToNota,
} from '@/types/paciente-v2';

interface UsePacienteV2Return {
  paciente: Paciente | null;
  profesionalReferente: Profesional | null;
  citas: Cita[];
  tratamientos: Tratamiento[];
  documentos: Documento[];
  notas: Nota[];
  actividades: Actividad[];
  loading: boolean;
  error: string | null;
}

export function usePacienteV2(pacienteId: string): UsePacienteV2Return {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [profesionalReferente, setProfesionalReferente] = useState<Profesional | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pacienteId) {
      setError('ID de paciente no proporcionado');
      setLoading(false);
      return;
    }

    let unsubscribeHistorial: (() => void) | undefined;
    let unsubscribeServicios: (() => void) | undefined;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener datos del paciente
        const pacienteDoc = await getDoc(doc(db, 'pacientes', pacienteId));

        if (!pacienteDoc.exists()) {
          setError('Paciente no encontrado');
          setLoading(false);
          return;
        }

        const pacienteData = {
          id: pacienteDoc.id,
          ...pacienteDoc.data(),
          fechaNacimiento: (pacienteDoc.data().fechaNacimiento as Timestamp)?.toDate?.() || new Date(),
          createdAt: (pacienteDoc.data().createdAt as Timestamp)?.toDate?.() || new Date(),
          updatedAt: (pacienteDoc.data().updatedAt as Timestamp)?.toDate?.() || new Date(),
          consentimientos: (pacienteDoc.data().consentimientos || []).map((c: any) => ({
            ...c,
            fecha: c.fecha?.toDate?.() || new Date(),
          })),
          alergias: pacienteDoc.data().alergias || [],
          alertasClinicas: pacienteDoc.data().alertasClinicas || [],
          diagnosticosPrincipales: pacienteDoc.data().diagnosticosPrincipales || [],
        } as Paciente;

        setPaciente(pacienteData);

        // 2. Obtener profesional referente si existe
        if (pacienteData.profesionalReferenteId) {
          try {
            const profDoc = await getDoc(
              doc(db, 'profesionales', pacienteData.profesionalReferenteId)
            );
            if (profDoc.exists()) {
              setProfesionalReferente({
                id: profDoc.id,
                ...profDoc.data(),
              } as Profesional);
            }
          } catch (err) {
            console.error('Error cargando profesional referente:', err);
          }
        }

        // 3. Suscribirse al historial del paciente
        const historialQuery = query(
          collection(db, 'pacientes-historial'),
          where('pacienteId', '==', pacienteId)
        );

        unsubscribeHistorial = onSnapshot(
          historialQuery,
          (snapshot) => {
            const historialDocs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Mapear a citas
            const citasMapped = historialDocs
              .map(mapHistorialToCita)
              .filter((c): c is Cita => c !== null);
            setCitas(citasMapped);

            // Mapear a notas
            const notasMapped = historialDocs
              .map(mapHistorialToNota)
              .filter((n): n is Nota => n !== null);
            setNotas(notasMapped);

            // Mapear a actividades
            const actividadesMapped = historialDocs.map(mapHistorialToActividad);
            setActividades(actividadesMapped.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()));
          },
          (err) => {
            console.error('Error en historial:', err);
          }
        );

        // 4. Suscribirse a servicios asignados si tiene grupo
        if (pacienteData.grupoPacienteId) {
          const serviciosQuery = query(
            collection(db, 'servicios-asignados'),
            where('grupoId', '==', pacienteData.grupoPacienteId)
          );

          unsubscribeServicios = onSnapshot(
            serviciosQuery,
            (snapshot) => {
              const serviciosDocs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              const tratamientosMapped = serviciosDocs.map((s) =>
                mapServicioToTratamiento(s, pacienteId)
              );
              setTratamientos(tratamientosMapped);
            },
            (err) => {
              console.error('Error en servicios:', err);
            }
          );
        }

        setLoading(false);
      } catch (err) {
        console.error('Error cargando datos del paciente:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    loadData();

    // Cleanup
    return () => {
      if (unsubscribeHistorial) unsubscribeHistorial();
      if (unsubscribeServicios) unsubscribeServicios();
    };
  }, [pacienteId]);

  return {
    paciente,
    profesionalReferente,
    citas,
    tratamientos,
    documentos, // Por ahora vacío, se implementará con Storage
    notas,
    actividades,
    loading,
    error,
  };
}
