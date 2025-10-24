'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paciente, Profesional } from '@/types';
import { PacientesTable } from '@/components/pacientes/PacientesTable';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPendingFollowUpPatientIds } from '@/lib/utils/followUps';

export default function PacientesPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [pacientesSeguimiento, setPacientesSeguimiento] = useState<Set<string>>(new Set());
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingProfesionales, setLoadingProfesionales] = useState(true);
  const [loadingSeguimientos, setLoadingSeguimientos] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'activo' | 'inactivo' | 'egresado'>('todos');
  const [riesgoFilter, setRiesgoFilter] = useState<'todos' | 'alto' | 'medio' | 'bajo'>('todos');
  const [followUpOnly, setFollowUpOnly] = useState(searchParams.get('filtro') === 'seguimiento');
  const [profesionalFilter, setProfesionalFilter] = useState<string>('todos');
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const STORAGE_KEY = 'pacientesFilters.v1';

  useEffect(() => {
    if (typeof window === 'undefined' || filtersLoaded) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { followUpOnly?: boolean; profesionalId?: string };
      if (saved) {
        if (saved.followUpOnly !== undefined && searchParams.get('filtro') !== 'seguimiento') {
          setFollowUpOnly(Boolean(saved.followUpOnly));
        }
        if (saved.profesionalId) {
          setProfesionalFilter(saved.profesionalId);
        }
      }
    } catch (err) {
      console.warn('No se pudieron cargar los filtros guardados', err);
    } finally {
      setFiltersLoaded(true);
    }
  }, [filtersLoaded, searchParams]);

  useEffect(() => {
    if (!filtersLoaded || typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({
        followUpOnly,
        profesionalId: profesionalFilter
      });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (err) {
      console.warn('No se pudieron guardar los filtros', err);
    }
  }, [followUpOnly, profesionalFilter, filtersLoaded]);

  useEffect(() => {
    const cargarPacientes = async () => {
      setLoadingPacientes(true);
      setError(null);
      try {
        const pacientesSnap = await getDocs(
          query(collection(db, 'pacientes'), orderBy('nombre'), limit(200))
        );

        type ConsentimientoRaw = {
          tipo?: string;
          fecha?: { toDate?: () => Date };
          documentoId?: string;
          firmadoPor?: string;
        };

        const pacientesData: Paciente[] = pacientesSnap.docs.map((docSnap) => {
          const data = docSnap.data() ?? {};
          const consentimientos = Array.isArray(data.consentimientos)
            ? (data.consentimientos as ConsentimientoRaw[]).map((item) => ({
                tipo: item?.tipo ?? 'general',
                fecha: item?.fecha?.toDate?.() ?? new Date(),
                documentoId: item?.documentoId,
                firmadoPor: item?.firmadoPor
              }))
            : [];

          return {
            id: docSnap.id,
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
        });

        setPacientes(pacientesData);
      } catch (err) {
        console.error('Error al cargar pacientes:', err);
        const mensaje =
          err instanceof Error ? err.message : 'Error desconocido al cargar pacientes.';
        setError(mensaje);
      } finally {
        setLoadingPacientes(false);
      }
    };

    cargarPacientes();
  }, []);

  useEffect(() => {
    const cargarProfesionales = async () => {
      setLoadingProfesionales(true);
      try {
        const profesionalesSnap = await getDocs(
          query(collection(db, 'profesionales'), orderBy('apellidos'), limit(200))
        );

        const profesionalesData: Profesional[] = profesionalesSnap.docs.map((docSnap) => {
          const data = docSnap.data() ?? {};
          return {
            id: docSnap.id,
            nombre: data.nombre ?? 'Sin nombre',
            apellidos: data.apellidos ?? '',
            especialidad: data.especialidad ?? 'medicina',
            email: data.email ?? '',
            telefono: data.telefono,
            activo: data.activo ?? true,
            horasSemanales: data.horasSemanales ?? 0,
            diasTrabajo: Array.isArray(data.diasTrabajo) ? data.diasTrabajo : [],
            horaInicio: data.horaInicio ?? '09:00',
            horaFin: data.horaFin ?? '17:00',
            serviciosAsignados: data.serviciosAsignados ?? 0,
            cargaTrabajo: data.cargaTrabajo ?? 0,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date()
          };
        });

        setProfesionales(profesionalesData);
      } catch (err) {
        console.error('Error al cargar profesionales:', err);
      } finally {
        setLoadingProfesionales(false);
      }
    };

    cargarProfesionales();
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return;
    if (!user || profesionales.length === 0 || profesionalFilter !== 'todos') return;
    const profesional = profesionales.find((prof) => prof.email === user.email);
    if (profesional) {
      setProfesionalFilter(profesional.id);
    }
  }, [user, profesionales, profesionalFilter, filtersLoaded]);

  useEffect(() => {
    const cargarSeguimientos = async () => {
      setLoadingSeguimientos(true);
      try {
        const ids = await getPendingFollowUpPatientIds();
        setPacientesSeguimiento(ids);
      } catch (err) {
        console.error('Error al cargar seguimientos pendientes:', err);
      } finally {
        setLoadingSeguimientos(false);
      }
    };

    cargarSeguimientos();
  }, []);

  useEffect(() => {
    setFollowUpOnly(searchParams.get('filtro') === 'seguimiento');
  }, [searchParams]);

  const loading = loadingPacientes || loadingProfesionales;
  const tablaCargando = loading || loadingSeguimientos;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las fichas, alertas y seguimientos de los pacientes.
          </p>
        </div>
        <Link
          href="/dashboard/pacientes/nuevo"
          className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <span>Nuevo paciente</span>
        </Link>
      </header>

      <PacientesTable
        pacientes={pacientes}
        profesionales={profesionales}
        pacientesSeguimiento={pacientesSeguimiento}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={(value) => setEstadoFilter(value as typeof estadoFilter)}
        riesgoFilter={riesgoFilter}
        onRiesgoFilterChange={(value) => setRiesgoFilter(value as typeof riesgoFilter)}
        followUpOnly={followUpOnly}
        onFollowUpOnlyChange={setFollowUpOnly}
        profesionalFilter={profesionalFilter}
        onProfesionalFilterChange={setProfesionalFilter}
        loading={tablaCargando}
        error={error}
      />
    </div>
  );
}
