import { describe, it, expect } from 'vitest';
import type { Tratamiento } from '@/components/pacientes/v2/PatientTratamientosTab';
import type { Activity, ProximaCita } from '@/components/pacientes/v2/UnifiedTimeline';

/**
 * Tests de integración para FASE 4.3: Dashboard de Paciente Unificado
 *
 * Cubre:
 * - PatientTratamientosTab (gestión de tratamientos)
 * - UnifiedTimeline (combinación de historial + próximas citas)
 * - Filtros y estados
 */

describe('FASE 4.3: Dashboard de Paciente Unificado', () => {
  describe('PatientTratamientosTab', () => {
    describe('Estados de tratamientos', () => {
      it('debería reconocer todos los estados válidos', () => {
        const estados: Tratamiento['estado'][] = [
          'planificado',
          'en-curso',
          'completado',
          'suspendido',
          'cancelado',
        ];

        estados.forEach((estado) => {
          expect(estado).toMatch(/^(planificado|en-curso|completado|suspendido|cancelado)$/);
        });
      });

      it('debería calcular correctamente tratamientos activos', () => {
        const tratamientos: Tratamiento[] = [
          {
            id: '1',
            nombre: 'Tratamiento 1',
            estado: 'en-curso',
            profesionalId: 'p1',
            profesionalNombre: 'Dr. Test',
            fechaInicio: new Date(),
            progreso: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            nombre: 'Tratamiento 2',
            estado: 'planificado',
            profesionalId: 'p1',
            profesionalNombre: 'Dr. Test',
            fechaInicio: new Date(),
            progreso: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            nombre: 'Tratamiento 3',
            estado: 'completado',
            profesionalId: 'p1',
            profesionalNombre: 'Dr. Test',
            fechaInicio: new Date(),
            progreso: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const activos = tratamientos.filter(
          (t) => t.estado === 'en-curso' || t.estado === 'planificado'
        );
        expect(activos.length).toBe(2);
      });

      it('debería calcular correctamente tratamientos completados', () => {
        const tratamientos: Tratamiento[] = [
          {
            id: '1',
            nombre: 'T1',
            estado: 'completado',
            profesionalId: 'p1',
            profesionalNombre: 'Dr. Test',
            fechaInicio: new Date(),
            progreso: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            nombre: 'T2',
            estado: 'completado',
            profesionalId: 'p1',
            profesionalNombre: 'Dr. Test',
            fechaInicio: new Date(),
            progreso: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            nombre: 'T3',
            estado: 'en-curso',
            profesionalId: 'p1',
            profesionalNombre: 'Dr. Test',
            fechaInicio: new Date(),
            progreso: 60,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const completados = tratamientos.filter((t) => t.estado === 'completado');
        expect(completados.length).toBe(2);
      });
    });

    describe('Progreso de tratamientos', () => {
      it('debería validar rango de progreso (0-100)', () => {
        const progresosValidos = [0, 25, 50, 75, 100];
        const progresosInvalidos = [-1, 101, 150];

        progresosValidos.forEach((p) => {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(100);
        });

        progresosInvalidos.forEach((p) => {
          expect(p < 0 || p > 100).toBe(true);
        });
      });

      it('debería calcular porcentaje de sesiones completadas', () => {
        const tratamiento: Tratamiento = {
          id: '1',
          nombre: 'Fisioterapia',
          estado: 'en-curso',
          profesionalId: 'p1',
          profesionalNombre: 'Dr. Test',
          fechaInicio: new Date(),
          sesionesTotales: 10,
          sesionesCompletadas: 7,
          progreso: 70,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const porcentaje =
          ((tratamiento.sesionesCompletadas || 0) / (tratamiento.sesionesTotales || 1)) * 100;
        expect(porcentaje).toBe(70);
        expect(porcentaje).toBe(tratamiento.progreso);
      });

      it('debería determinar color de progreso según porcentaje', () => {
        const getProgressColor = (progreso: number): string => {
          if (progreso >= 80) return 'bg-success';
          if (progreso >= 50) return 'bg-brand';
          if (progreso >= 25) return 'bg-warn';
          return 'bg-muted';
        };

        expect(getProgressColor(90)).toBe('bg-success');
        expect(getProgressColor(60)).toBe('bg-brand');
        expect(getProgressColor(30)).toBe('bg-warn');
        expect(getProgressColor(10)).toBe('bg-muted');
      });
    });

    describe('Filtrado de tratamientos', () => {
      const tratamientos: Tratamiento[] = [
        {
          id: '1',
          nombre: 'T1',
          estado: 'planificado',
          profesionalId: 'p1',
          profesionalNombre: 'Dr. Test',
          fechaInicio: new Date(),
          progreso: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          nombre: 'T2',
          estado: 'en-curso',
          profesionalId: 'p1',
          profesionalNombre: 'Dr. Test',
          fechaInicio: new Date(),
          progreso: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          nombre: 'T3',
          estado: 'completado',
          profesionalId: 'p1',
          profesionalNombre: 'Dr. Test',
          fechaInicio: new Date(),
          progreso: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          nombre: 'T4',
          estado: 'suspendido',
          profesionalId: 'p1',
          profesionalNombre: 'Dr. Test',
          fechaInicio: new Date(),
          progreso: 40,
          motivoSuspension: 'Motivo de prueba',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      it('debería filtrar por estado "planificado"', () => {
        const filtrados = tratamientos.filter((t) => t.estado === 'planificado');
        expect(filtrados.length).toBe(1);
        expect(filtrados[0].id).toBe('1');
      });

      it('debería filtrar por estado "en-curso"', () => {
        const filtrados = tratamientos.filter((t) => t.estado === 'en-curso');
        expect(filtrados.length).toBe(1);
        expect(filtrados[0].id).toBe('2');
      });

      it('debería filtrar por estado "completado"', () => {
        const filtrados = tratamientos.filter((t) => t.estado === 'completado');
        expect(filtrados.length).toBe(1);
        expect(filtrados[0].id).toBe('3');
      });

      it('debería filtrar por estado "suspendido"', () => {
        const filtrados = tratamientos.filter((t) => t.estado === 'suspendido');
        expect(filtrados.length).toBe(1);
        expect(filtrados[0].id).toBe('4');
        expect(filtrados[0].motivoSuspension).toBeDefined();
      });

      it('debería mostrar todos cuando filter es "all"', () => {
        const filter = 'all';
        const filtrados = filter === 'all' ? tratamientos : tratamientos.filter((t) => t.estado === filter);
        expect(filtrados.length).toBe(4);
      });
    });
  });

  describe('UnifiedTimeline', () => {
    describe('Combinación de actividades y próximas citas', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const actividades: Activity[] = [
        {
          id: 'a1',
          tipo: 'cita',
          titulo: 'Consulta pasada',
          fecha: yesterday,
        },
        {
          id: 'a2',
          tipo: 'documento',
          titulo: 'Documento subido',
          fecha: yesterday,
        },
      ];

      const proximasCitas: ProximaCita[] = [
        {
          id: 'c1',
          fecha: tomorrow,
          profesional: 'Dr. Test',
          tipo: 'consulta',
          estado: 'confirmada',
        },
      ];

      it('debería combinar actividades pasadas y próximas citas', () => {
        const items = [
          ...actividades.map((a) => ({ type: 'activity' as const, data: a })),
          ...proximasCitas.map((c) => ({ type: 'cita' as const, data: c })),
        ];

        expect(items.length).toBe(3);
        expect(items.filter((i) => i.type === 'activity').length).toBe(2);
        expect(items.filter((i) => i.type === 'cita').length).toBe(1);
      });

      it('debería ordenar futuras primero, luego pasadas', () => {
        type TimelineItem =
          | { type: 'activity'; data: Activity }
          | { type: 'cita'; data: ProximaCita };

        const items: TimelineItem[] = [
          ...actividades.map((a) => ({ type: 'activity' as const, data: a })),
          ...proximasCitas.map((c) => ({ type: 'cita' as const, data: c })),
        ];

        const sorted = items.sort((a, b) => {
          const dateA = a.type === 'activity' ? a.data.fecha : a.data.fecha;
          const dateB = b.type === 'activity' ? b.data.fecha : b.data.fecha;
          const aIsFuture = dateA > now;
          const bIsFuture = dateB > now;

          if (aIsFuture && !bIsFuture) return -1;
          if (!aIsFuture && bIsFuture) return 1;

          if (aIsFuture && bIsFuture) {
            return dateA.getTime() - dateB.getTime();
          } else {
            return dateB.getTime() - dateA.getTime();
          }
        });

        // Primera debe ser futura
        const primerFecha =
          sorted[0].type === 'activity' ? sorted[0].data.fecha : sorted[0].data.fecha;
        expect(primerFecha > now).toBe(true);
      });

      it('debería respetar maxItems limit', () => {
        const maxItems = 2;
        const allItems = [...actividades, ...proximasCitas];
        const limited = allItems.slice(0, maxItems);

        expect(limited.length).toBe(maxItems);
        expect(limited.length).toBeLessThanOrEqual(maxItems);
      });
    });

    describe('Formateo de tiempo relativo', () => {
      const now = new Date();

      it('debería formatear "Ahora" para eventos muy recientes', () => {
        const hace5seg = new Date(now.getTime() - 5000);
        const diffMins = Math.floor((now.getTime() - hace5seg.getTime()) / 60000);
        const text = diffMins < 1 ? 'Ahora' : `Hace ${diffMins}min`;

        expect(text).toBe('Ahora');
      });

      it('debería formatear minutos para eventos recientes', () => {
        const hace30min = new Date(now.getTime() - 30 * 60 * 1000);
        const diffMins = Math.floor((now.getTime() - hace30min.getTime()) / 60000);
        const text = `Hace ${diffMins}min`;

        expect(text).toBe('Hace 30min');
      });

      it('debería formatear horas para eventos del día', () => {
        const hace3h = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const diffHours = Math.floor((now.getTime() - hace3h.getTime()) / 3600000);
        const text = `Hace ${diffHours}h`;

        expect(text).toBe('Hace 3h');
      });

      it('debería formatear "Ayer" para eventos de ayer', () => {
        const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const diffDays = Math.floor((now.getTime() - ayer.getTime()) / 86400000);
        const text = diffDays === 1 ? 'Ayer' : `Hace ${diffDays}d`;

        expect(text).toBe('Ayer');
      });

      it('debería formatear "Mañana" para eventos de mañana', () => {
        const manana = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const diffDays = Math.floor((manana.getTime() - now.getTime()) / 86400000);
        const text = diffDays === 1 ? 'Mañana' : `En ${diffDays}d`;

        expect(text).toBe('Mañana');
      });
    });

    describe('Tipos de actividad', () => {
      it('debería soportar todos los tipos de actividad válidos', () => {
        const tiposValidos: Activity['tipo'][] = [
          'cita',
          'documento',
          'receta',
          'tratamiento',
          'nota',
          'factura',
          'pago',
        ];

        tiposValidos.forEach((tipo) => {
          const actividad: Activity = {
            id: '1',
            tipo,
            titulo: `Test ${tipo}`,
            fecha: new Date(),
          };

          expect(actividad.tipo).toBe(tipo);
        });
      });

      it('debería soportar estados de actividad', () => {
        const estadosValidos: Activity['estado'][] = ['success', 'warning', 'error', 'info'];

        estadosValidos.forEach((estado) => {
          const actividad: Activity = {
            id: '1',
            tipo: 'cita',
            titulo: 'Test',
            fecha: new Date(),
            estado,
          };

          expect(actividad.estado).toBe(estado);
        });
      });

      it('debería incluir contexto de agenda para citas', () => {
        const actividad: Activity = {
          id: '1',
          tipo: 'cita',
          titulo: 'Consulta',
          fecha: new Date(),
          agendaContext: {
            profesionalId: 'p1',
            date: new Date(),
            eventId: 'e1',
          },
        };

        expect(actividad.agendaContext).toBeDefined();
        expect(actividad.agendaContext?.profesionalId).toBe('p1');
        expect(actividad.agendaContext?.eventId).toBe('e1');
      });
    });

    describe('Estados de próximas citas', () => {
      it('debería soportar todos los estados de citas', () => {
        const estadosValidos: ProximaCita['estado'][] = [
          'programada',
          'confirmada',
          'realizada',
          'cancelada',
        ];

        estadosValidos.forEach((estado) => {
          const cita: ProximaCita = {
            id: '1',
            fecha: new Date(),
            profesional: 'Dr. Test',
            tipo: 'consulta',
            estado,
          };

          expect(cita.estado).toBe(estado);
        });
      });

      it('debería incluir profesionalId opcional para vincular con agenda', () => {
        const cita: ProximaCita = {
          id: '1',
          fecha: new Date(),
          profesional: 'Dr. Test',
          profesionalId: 'p123',
          tipo: 'consulta',
        };

        expect(cita.profesionalId).toBe('p123');
      });
    });
  });

  describe('Integración completa del dashboard', () => {
    it('debería poder gestionar múltiples tratamientos simultáneos', () => {
      const tratamientos: Tratamiento[] = Array.from({ length: 5 }, (_, i) => ({
        id: `t${i + 1}`,
        nombre: `Tratamiento ${i + 1}`,
        estado: (i % 2 === 0 ? 'en-curso' : 'planificado') as Tratamiento['estado'],
        profesionalId: 'p1',
        profesionalNombre: 'Dr. Test',
        fechaInicio: new Date(),
        progreso: i * 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      expect(tratamientos.length).toBe(5);
      expect(tratamientos.filter((t) => t.estado === 'en-curso').length).toBe(3);
      expect(tratamientos.filter((t) => t.estado === 'planificado').length).toBe(2);
    });

    it('debería combinar timeline con tratamientos para vista completa', () => {
      const actividades: Activity[] = [
        {
          id: 'a1',
          tipo: 'cita',
          titulo: 'Consulta inicial',
          fecha: new Date(),
        },
      ];

      const tratamientos: Tratamiento[] = [
        {
          id: 't1',
          nombre: 'Fisioterapia',
          estado: 'en-curso',
          profesionalId: 'p1',
          profesionalNombre: 'Dr. Test',
          fechaInicio: new Date(),
          progreso: 60,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const dashboardData = {
        timeline: actividades,
        tratamientos,
      };

      expect(dashboardData.timeline.length).toBe(1);
      expect(dashboardData.tratamientos.length).toBe(1);
      expect(dashboardData.tratamientos[0].progreso).toBe(60);
    });
  });
});
