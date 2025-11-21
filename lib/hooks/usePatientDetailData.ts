'use client';

/**
 * Hook especializado para cargar todos los datos necesarios
 * en la vista de detalle de paciente
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Paciente,
  Profesional,
  RegistroHistorialPaciente,
  ServicioAsignado,
  PacienteFactura,
  PacientePresupuesto,
  PacienteDocumento,
} from '@/types';
import {
  transformPaciente,
  transformProfesional,
  transformHistorialPaciente,
  transformServicioAsignado,
  transformPacienteFactura,
  transformPacientePresupuesto,
  transformPacienteDocumento,
} from '@/lib/utils/firestoreTransformers';

type UsePatientDetailDataOptions = {
  pacienteId: string | undefined;
};

type UsePatientDetailDataReturn = {
  // Datos principales
  paciente: Paciente | null;
  profesionales: Profesional[];
  historial: RegistroHistorialPaciente[];
  serviciosRelacionados: ServicioAsignado[];
  facturas: PacienteFactura[];
  presupuestos: PacientePresupuesto[];
  documentos: PacienteDocumento[];

  // Estados de carga
  loading: boolean;
  error: string | null;
  relacionesError: string | null;

  // Acciones
  refreshHistorial: () => Promise<void>;
  refreshPaciente: () => Promise<void>;
  refreshFacturacion: () => Promise<void>;
  refreshDocumentos: () => Promise<void>;

  // Datos derivados útiles
  profesionalReferente: Profesional | null;
  profesionalesOptions: Array<{ id: string; nombre: string }>;
};

export function usePatientDetailData({
  pacienteId,
}: UsePatientDetailDataOptions): UsePatientDetailDataReturn {

  // Estado para errores de relaciones (no crítico)
  const [relacionesError, setRelacionesError] = useState<string | null>(null);

  // Query para el paciente individual
  const {
    data: paciente,
    isLoading: loadingPaciente,
    error: pacienteError,
    refetch: refetchPaciente,
  } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return null;

      const pacienteRef = doc(db, 'pacientes', pacienteId);
      const pacienteSnap = await getDoc(pacienteRef);

      if (!pacienteSnap.exists()) {
        throw new Error('Paciente no encontrado');
      }

      return transformPaciente(pacienteSnap);
    },
    enabled: !!pacienteId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para profesionales (usando cache compartido)
  const { data: profesionales = [], isLoading: loadingProfesionales } = useQuery({
    queryKey: ['profesionales', { includeInactive: true }],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(collection(db, 'profesionales'), orderBy('apellidos'), limit(200))
      );
      return snapshot.docs.map(transformProfesional);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para historial del paciente
  const {
    data: historial = [],
    isLoading: loadingHistorial,
    refetch: refetchHistorial,
  } = useQuery({
    queryKey: ['paciente-historial', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];

      const historialSnap = await getDocs(
        query(
          collection(db, 'pacientes-historial'),
          where('pacienteId', '==', pacienteId),
          orderBy('fecha', 'desc'),
          limit(100)
        )
      );

      return historialSnap.docs.map((docSnap) =>
        transformHistorialPaciente(docSnap, pacienteId)
      );
    },
    enabled: !!pacienteId,
    staleTime: 1 * 60 * 1000, // 1 minuto - historial puede cambiar más frecuentemente
  });

  // Query para servicios relacionados por grupo
  const { data: serviciosRelacionados = [], isLoading: loadingServicios } = useQuery({
    queryKey: ['servicios-grupo', paciente?.grupoPacienteId],
    queryFn: async () => {
      if (!paciente?.grupoPacienteId) return [];

      setRelacionesError(null);
      try {
        const serviciosSnap = await getDocs(
          query(
            collection(db, 'servicios-asignados'),
            where('grupoId', '==', paciente.grupoPacienteId),
            limit(25)
          )
        );

        return serviciosSnap.docs.map(transformServicioAsignado);
      } catch (err) {
        console.error('Error cargando servicios relacionados', err);
        setRelacionesError('No se pudieron cargar los servicios relacionados.');
        return [];
      }
    },
    enabled: !!paciente?.grupoPacienteId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });

  const {
    data: facturas = [],
    isLoading: loadingFacturas,
    refetch: refetchFacturas,
  } = useQuery({
    queryKey: ['paciente-facturas', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];

      const snapshot = await getDocs(
        query(
          collection(db, 'pacientes', pacienteId, 'facturas'),
          orderBy('fecha', 'desc'),
          limit(100)
        )
      );

      return snapshot.docs.map((docSnap) => transformPacienteFactura(docSnap, pacienteId));
    },
    enabled: !!pacienteId,
    staleTime: 60 * 1000,
  });

  const {
    data: presupuestos = [],
    isLoading: loadingPresupuestos,
    refetch: refetchPresupuestos,
  } = useQuery({
    queryKey: ['paciente-presupuestos', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];

      const snapshot = await getDocs(
        query(
          collection(db, 'pacientes', pacienteId, 'presupuestos'),
          orderBy('fecha', 'desc'),
          limit(100)
        )
      );

      return snapshot.docs.map((docSnap) => transformPacientePresupuesto(docSnap, pacienteId));
    },
    enabled: !!pacienteId,
    staleTime: 60 * 1000,
  });

  const {
    data: documentos = [],
    isLoading: loadingDocumentos,
    refetch: refetchDocumentos,
  } = useQuery({
    queryKey: ['paciente-documentos', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];

      const snapshot = await getDocs(
        query(
          collection(db, 'pacientes', pacienteId, 'documentos'),
          orderBy('fechaSubida', 'desc'),
          limit(100)
        )
      );

      return snapshot.docs.map((docSnap) => transformPacienteDocumento(docSnap, pacienteId));
    },
    enabled: !!pacienteId,
    staleTime: 60 * 1000,
  });

  // Acciones de refresco
  const refreshHistorial = useCallback(async () => {
    await refetchHistorial();
  }, [refetchHistorial]);

  const refreshPaciente = useCallback(async () => {
    await refetchPaciente();
  }, [refetchPaciente]);

  const refreshFacturacion = useCallback(async () => {
    await Promise.all([refetchFacturas(), refetchPresupuestos()]);
  }, [refetchFacturas, refetchPresupuestos]);

  const refreshDocumentos = useCallback(async () => {
    await refetchDocumentos();
  }, [refetchDocumentos]);

  // Datos derivados
  const profesionalReferente =
    paciente?.profesionalReferenteId
      ? profesionales.find((prof) => prof.id === paciente.profesionalReferenteId) ?? null
      : null;

  const profesionalesOptions = profesionales.map((prof) => ({
    id: prof.id,
    nombre: `${prof.nombre} ${prof.apellidos}`.trim(),
  }));

  // Estado de carga combinado
  const loading =
    loadingPaciente ||
    loadingProfesionales ||
    loadingHistorial ||
    loadingServicios ||
    loadingFacturas ||
    loadingPresupuestos ||
    loadingDocumentos;

  // Manejo de errores
  const error = pacienteError
    ? pacienteError instanceof Error
      ? pacienteError.message
      : 'Error al cargar el paciente'
    : !pacienteId
    ? 'Identificador de paciente no válido'
    : null;

  return {
    // Datos principales
    paciente: paciente ?? null,
    profesionales,
    historial,
    serviciosRelacionados,
    facturas,
    presupuestos,
    documentos,

    // Estados
    loading,
    error,
    relacionesError,

    // Acciones
    refreshHistorial,
    refreshPaciente,
    refreshFacturacion,
    refreshDocumentos,

    // Datos derivados
    profesionalReferente,
    profesionalesOptions,
  };
}

/**
 * Hook para obtener un paciente individual (útil para páginas de edición)
 */
export function usePaciente(pacienteId: string | undefined) {
  return useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return null;

      const pacienteRef = doc(db, 'pacientes', pacienteId);
      const pacienteSnap = await getDoc(pacienteRef);

      if (!pacienteSnap.exists()) {
        throw new Error('Paciente no encontrado');
      }

      return transformPaciente(pacienteSnap);
    },
    enabled: !!pacienteId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para el historial de un paciente específico
 */
export function usePatientHistorial(pacienteId: string | undefined) {
  return useQuery({
    queryKey: ['paciente-historial', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];

      const historialSnap = await getDocs(
        query(
          collection(db, 'pacientes-historial'),
          where('pacienteId', '==', pacienteId),
          orderBy('fecha', 'desc'),
          limit(100)
        )
      );

      return historialSnap.docs.map((docSnap) =>
        transformHistorialPaciente(docSnap, pacienteId)
      );
    },
    enabled: !!pacienteId,
    staleTime: 1 * 60 * 1000,
  });
}
