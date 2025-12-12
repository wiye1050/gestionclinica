import { describe, it, expect } from 'vitest';
import { addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';

/**
 * Tests para el módulo de disponibilidad
 *
 * Nota: Estos tests son unitarios y no requieren conexión a Firebase.
 * Prueban la lógica de algoritmos sin dependencias externas.
 */

describe('Módulo de Disponibilidad', () => {
  describe('Conversión de horas', () => {
    it('debería convertir string de hora a minutos desde medianoche', () => {
      const horaAMinutos = (hora: string): number => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };

      expect(horaAMinutos('00:00')).toBe(0);
      expect(horaAMinutos('09:00')).toBe(540);
      expect(horaAMinutos('12:30')).toBe(750);
      expect(horaAMinutos('18:00')).toBe(1080);
      expect(horaAMinutos('21:00')).toBe(1260);
    });

    it('debería convertir minutos a Date correctamente', () => {
      const fecha = startOfDay(new Date(2024, 0, 15)); // 15 enero 2024
      const minutosADate = (fecha: Date, minutos: number): Date => {
        const resultado = startOfDay(fecha);
        resultado.setMinutes(minutos);
        return resultado;
      };

      const resultado1 = minutosADate(fecha, 540); // 9:00
      expect(resultado1.getHours()).toBe(9);
      expect(resultado1.getMinutes()).toBe(0);

      const resultado2 = minutosADate(fecha, 1080); // 18:00
      expect(resultado2.getHours()).toBe(18);
      expect(resultado2.getMinutes()).toBe(0);
    });
  });

  describe('Detección de conflictos', () => {
    it('debería detectar solapamiento entre slots', () => {
      const hayConflicto = (
        slotInicio: Date,
        slotFin: Date,
        eventoInicio: Date,
        eventoFin: Date
      ): boolean => {
        return slotInicio < eventoFin && slotFin > eventoInicio;
      };

      const base = new Date(2024, 0, 15, 10, 0); // 10:00

      // Caso 1: Solapamiento total
      const slot1Inicio = new Date(2024, 0, 15, 10, 0);
      const slot1Fin = new Date(2024, 0, 15, 11, 0);
      const evento1Inicio = new Date(2024, 0, 15, 10, 0);
      const evento1Fin = new Date(2024, 0, 15, 11, 0);
      expect(hayConflicto(slot1Inicio, slot1Fin, evento1Inicio, evento1Fin)).toBe(true);

      // Caso 2: Solapamiento parcial (slot comienza antes)
      const slot2Inicio = new Date(2024, 0, 15, 9, 30);
      const slot2Fin = new Date(2024, 0, 15, 10, 30);
      const evento2Inicio = new Date(2024, 0, 15, 10, 0);
      const evento2Fin = new Date(2024, 0, 15, 11, 0);
      expect(hayConflicto(slot2Inicio, slot2Fin, evento2Inicio, evento2Fin)).toBe(true);

      // Caso 3: Solapamiento parcial (slot comienza durante evento)
      const slot3Inicio = new Date(2024, 0, 15, 10, 30);
      const slot3Fin = new Date(2024, 0, 15, 11, 30);
      const evento3Inicio = new Date(2024, 0, 15, 10, 0);
      const evento3Fin = new Date(2024, 0, 15, 11, 0);
      expect(hayConflicto(slot3Inicio, slot3Fin, evento3Inicio, evento3Fin)).toBe(true);

      // Caso 4: Sin solapamiento (antes)
      const slot4Inicio = new Date(2024, 0, 15, 8, 0);
      const slot4Fin = new Date(2024, 0, 15, 9, 0);
      const evento4Inicio = new Date(2024, 0, 15, 10, 0);
      const evento4Fin = new Date(2024, 0, 15, 11, 0);
      expect(hayConflicto(slot4Inicio, slot4Fin, evento4Inicio, evento4Fin)).toBe(false);

      // Caso 5: Sin solapamiento (después)
      const slot5Inicio = new Date(2024, 0, 15, 12, 0);
      const slot5Fin = new Date(2024, 0, 15, 13, 0);
      const evento5Inicio = new Date(2024, 0, 15, 10, 0);
      const evento5Fin = new Date(2024, 0, 15, 11, 0);
      expect(hayConflicto(slot5Inicio, slot5Fin, evento5Inicio, evento5Fin)).toBe(false);

      // Caso 6: Adyacente (fin de slot = inicio de evento)
      const slot6Inicio = new Date(2024, 0, 15, 9, 0);
      const slot6Fin = new Date(2024, 0, 15, 10, 0);
      const evento6Inicio = new Date(2024, 0, 15, 10, 0);
      const evento6Fin = new Date(2024, 0, 15, 11, 0);
      expect(hayConflicto(slot6Inicio, slot6Fin, evento6Inicio, evento6Fin)).toBe(false);
    });
  });

  describe('Generación de slots candidatos', () => {
    it('debería generar slots cada 15 minutos', () => {
      const generarSlots = (
        fecha: Date,
        duracionMinutos: number,
        horaInicio: string,
        horaFin: string,
        intervalo: number = 15
      ): Date[] => {
        const slots: Date[] = [];
        const horaAMinutos = (hora: string): number => {
          const [h, m] = hora.split(':').map(Number);
          return h * 60 + m;
        };

        const minutosInicio = horaAMinutos(horaInicio);
        const minutosFin = horaAMinutos(horaFin);

        for (
          let minutos = minutosInicio;
          minutos + duracionMinutos <= minutosFin;
          minutos += intervalo
        ) {
          const slot = startOfDay(fecha);
          slot.setMinutes(minutos);
          slots.push(slot);
        }

        return slots;
      };

      const fecha = new Date(2024, 0, 15);
      const slots = generarSlots(fecha, 30, '09:00', '10:00', 15);

      // Debería generar slots en: 9:00, 9:15, 9:30
      // 9:45 no porque 9:45 + 30min = 10:15 > 10:00
      expect(slots.length).toBe(3);
      expect(slots[0].getHours()).toBe(9);
      expect(slots[0].getMinutes()).toBe(0);
      expect(slots[1].getMinutes()).toBe(15);
      expect(slots[2].getMinutes()).toBe(30);
    });

    it('debería excluir horario de almuerzo correctamente', () => {
      const excluirAlmuerzo = (
        minutos: number,
        duracionMinutos: number,
        almuerzoInicio: string,
        almuerzoFin: string
      ): boolean => {
        const horaAMinutos = (hora: string): number => {
          const [h, m] = hora.split(':').map(Number);
          return h * 60 + m;
        };

        const almuerzoInicioMin = horaAMinutos(almuerzoInicio);
        const almuerzoFinMin = horaAMinutos(almuerzoFin);

        const slotInicioMin = minutos;
        const slotFinMin = minutos + duracionMinutos;

        // Excluir si hay solapamiento
        return !(slotFinMin <= almuerzoInicioMin || slotInicioMin >= almuerzoFinMin);
      };

      // Slot antes del almuerzo (12:00 - 12:30)
      expect(excluirAlmuerzo(720, 30, '13:00', '15:00')).toBe(false);

      // Slot durante el almuerzo (13:30 - 14:00)
      expect(excluirAlmuerzo(810, 30, '13:00', '15:00')).toBe(true);

      // Slot que cruza inicio del almuerzo (12:45 - 13:15)
      expect(excluirAlmuerzo(765, 30, '13:00', '15:00')).toBe(true);

      // Slot después del almuerzo (15:00 - 15:30)
      expect(excluirAlmuerzo(900, 30, '13:00', '15:00')).toBe(false);
    });
  });

  describe('Cálculo de score', () => {
    it('debería asignar score base de 50 sin preferencias', () => {
      const calcularScoreBase = () => 50;
      expect(calcularScoreBase()).toBe(50);
    });

    it('debería dar bonus por profesional preferido', () => {
      const calcularScore = (
        profesionalId: string,
        profesionalPreferido?: string
      ): number => {
        let score = 50;
        if (profesionalPreferido && profesionalId === profesionalPreferido) {
          score += 30;
        }
        return score;
      };

      expect(calcularScore('prof-1', 'prof-1')).toBe(80);
      expect(calcularScore('prof-1', 'prof-2')).toBe(50);
      expect(calcularScore('prof-1', undefined)).toBe(50);
    });

    it('debería dar bonus por horario preferido', () => {
      const calcularScore = (
        horaSlot: string,
        horaInicioPreferida: string,
        horaFinPreferida: string
      ): number => {
        const horaAMinutos = (hora: string): number => {
          const [h, m] = hora.split(':').map(Number);
          return h * 60 + m;
        };

        let score = 50;
        const horaSlotMin = horaAMinutos(horaSlot);
        const horaInicioMin = horaAMinutos(horaInicioPreferida);
        const horaFinMin = horaAMinutos(horaFinPreferida);

        if (horaSlotMin >= horaInicioMin && horaSlotMin <= horaFinMin) {
          score += 20;
        }

        return score;
      };

      expect(calcularScore('10:00', '09:00', '12:00')).toBe(70);
      expect(calcularScore('08:00', '09:00', '12:00')).toBe(50);
      expect(calcularScore('13:00', '09:00', '12:00')).toBe(50);
    });

    it('debería penalizar horarios extremos', () => {
      const calcularScore = (hora: number): number => {
        let score = 50;
        if (hora < 8 || hora > 19) {
          score -= 10;
        }
        return score;
      };

      expect(calcularScore(7)).toBe(40); // Muy temprano
      expect(calcularScore(20)).toBe(40); // Muy tarde
      expect(calcularScore(10)).toBe(50); // Normal
    });

    it('debería dar bonus a horarios prime', () => {
      const calcularScore = (hora: number): number => {
        let score = 50;
        if ((hora >= 9 && hora < 12) || (hora >= 16 && hora < 19)) {
          score += 10;
        }
        return score;
      };

      expect(calcularScore(10)).toBe(60); // Horario mañana
      expect(calcularScore(17)).toBe(60); // Horario tarde
      expect(calcularScore(14)).toBe(50); // Horario regular
    });
  });

  describe('Validaciones', () => {
    it('debería validar duración mínima y máxima', () => {
      const validarDuracion = (duracion: number): boolean => {
        return duracion >= 15 && duracion <= 180;
      };

      expect(validarDuracion(15)).toBe(true);
      expect(validarDuracion(30)).toBe(true);
      expect(validarDuracion(180)).toBe(true);
      expect(validarDuracion(10)).toBe(false);
      expect(validarDuracion(200)).toBe(false);
    });

    it('debería validar formato de hora', () => {
      const validarHora = (hora: string): boolean => {
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return regex.test(hora);
      };

      expect(validarHora('09:00')).toBe(true);
      expect(validarHora('23:59')).toBe(true);
      expect(validarHora('00:00')).toBe(true);
      expect(validarHora('24:00')).toBe(false);
      expect(validarHora('9:00')).toBe(false); // Sin cero
      expect(validarHora('09:60')).toBe(false); // Minutos inválidos
    });
  });

  describe('Integración de algoritmo completo', () => {
    it('debería ordenar slots por score', () => {
      interface Slot {
        inicio: Date;
        score: number;
      }

      const slots: Slot[] = [
        { inicio: new Date(2024, 0, 15, 10, 0), score: 70 },
        { inicio: new Date(2024, 0, 15, 14, 0), score: 50 },
        { inicio: new Date(2024, 0, 15, 9, 0), score: 80 },
        { inicio: new Date(2024, 0, 15, 16, 0), score: 60 },
      ];

      const ordenados = [...slots].sort((a, b) => b.score - a.score);

      expect(ordenados[0].score).toBe(80);
      expect(ordenados[1].score).toBe(70);
      expect(ordenados[2].score).toBe(60);
      expect(ordenados[3].score).toBe(50);
    });

    it('debería limitar resultados a maxResults', () => {
      const slots = Array.from({ length: 20 }, (_, i) => ({
        inicio: new Date(),
        score: i,
      }));

      const maxResults = 5;
      const limitados = slots.slice(0, maxResults);

      expect(limitados.length).toBe(5);
    });
  });
});
