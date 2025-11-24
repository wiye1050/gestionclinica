'use client';

/**
 * Hook especializado para cargar todos los datos necesarios
 * en la vista de detalle de paciente
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
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

type PatientDetailPayload = {
  paciente: Paciente;
  historial: RegistroHistorialPaciente[];
  serviciosRelacionados: ServicioAsignado[];
  facturas: PacienteFactura[];
  presupuestos: PacientePresupuesto[];
  documentos: PacienteDocumento[];
};

const reviveDates = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(reviveDates);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, reviveDates(val)])
    );
  }
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp) && value.includes('-')) {
      return new Date(value);
    }
  }
  return value;
};

export function usePatientDetailData({
  pacienteId,
}: UsePatientDetailDataOptions): UsePatientDetailDataReturn {
  const {
    data: detail,
    isLoading: loadingDetalle,
    error: detalleError,
    refetch: refetchDetalle,
  } = useQuery({
    queryKey: ['paciente-detalle', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return null;
      const response = await fetch(`/api/pacientes/${pacienteId}/detail`);
      const raw = await response.text();
      const payload = raw ? (JSON.parse(raw) as PatientDetailPayload & { error?: string }) : null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'No se pudo cargar el paciente');
      }
      return reviveDates(payload) as PatientDetailPayload;
    },
    enabled: !!pacienteId,
    staleTime: 60 * 1000,
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
  const paciente = detail?.paciente ?? null;
  const historial = detail?.historial ?? [];
  const serviciosRelacionados = detail?.serviciosRelacionados ?? [];
  const facturas = detail?.facturas ?? [];
  const presupuestos = detail?.presupuestos ?? [];
  const documentos = detail?.documentos ?? [];
  const relacionesError = null;

  const refreshPaciente = useCallback(async () => {
    await refetchDetalle();
  }, [refetchDetalle]);

  const refreshHistorial = refreshPaciente;
  const refreshFacturacion = refreshPaciente;
  const refreshDocumentos = refreshPaciente;

  // Datos derivados
  const profesionalReferente =
    paciente?.profesionalReferenteId
      ? profesionales.find((prof) => prof.id === paciente.profesionalReferenteId) ?? null
      : null;

  const profesionalesOptions = profesionales.map((prof) => ({
    id: prof.id,
    nombre: `${prof.nombre} ${prof.apellidos}`.trim(),
  }));

  const loading = loadingDetalle || loadingProfesionales;

  const error = detalleError
    ? detalleError instanceof Error
      ? detalleError.message
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
