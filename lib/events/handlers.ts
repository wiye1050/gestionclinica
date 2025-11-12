import type { Firestore } from 'firebase-admin/firestore';

export type EventSubjectKind =
  | 'patient'
  | 'episode'
  | 'plan'
  | 'procedure'
  | 'appointment'
  | 'quote';

export type CanonicalEvent = {
  id: string;
  type: string;
  subject: { kind: EventSubjectKind; id: string };
  actorUserId?: string;
  timestamp?: number;
  meta?: Record<string, unknown>;
};

export type HandlerContext = {
  db: Firestore;
  notifySlack?: (text: string) => Promise<void> | void;
  notifyEmail?: (subject: string, text: string) => Promise<void> | void;
};

export type EventHandler = (event: CanonicalEvent) => Promise<void> | void;

const noop = async () => {};

export function createEventHandlers(ctx: HandlerContext) {
  const notifySlack = ctx.notifySlack ?? noop;
  const notifyEmail = ctx.notifyEmail ?? noop;
  const { db } = ctx;

  const handlers: Record<string, EventHandler> = {
    'Inventory.Deducted': async (event) => {
      const { sku, qty } = event.meta ?? {};
      const resumen = `Reponer SKU ${sku ?? 'desconocido'} (${qty ?? '?'} uds)`;
      await db
        .collection('tasks')
        .doc(`inventory-${event.id}`)
        .set({
          tipo: 'INVENTORY_ALERT',
          estado: 'pendiente',
          prioridad: 'alta',
          resumen,
          descripcion: 'Generado automáticamente por la monitorización de inventario.',
          sku: sku ?? null,
          cantidad: qty ?? null,
          createdAt: Date.now(),
          createdBy: 'automation',
        });
      const message = `Inventario: ${resumen}`;
      await notifySlack(`:warehouse: ${resumen}`);
      await notifyEmail('Alerta de inventario', message);
      console.log(`[Inventory] Alert registrada: ${resumen}`);
    },
    'FollowUp.Scheduled': async (event) => {
      const { kind, date, followUpId } = event.meta ?? {};
      const fechaObjetivo =
        typeof date === 'number' ? date : typeof date === 'string' ? Number(date) : Date.now();
      await db
        .collection('tasks')
        .doc(`followup-${event.id}`)
        .set({
          tipo: 'FOLLOW_UP_REMINDER',
          estado: 'pendiente',
          prioridad: kind === 'PROs' ? 'media' : 'alta',
          resumen: `Recordar ${kind ?? 'REVIEW'} al paciente`,
          followUpId: followUpId ?? null,
          fechaObjetivo,
          createdAt: Date.now(),
          createdBy: 'automation',
        });
      const humanDate = new Date(fechaObjetivo).toLocaleString('es-ES');
      const message = `Nuevo seguimiento (${kind ?? 'REVIEW'}) programado para ${humanDate}`;
      await notifySlack(`:spiral_calendar_pad: ${message}`);
      await notifyEmail('Recordatorio de seguimiento', message);
      console.log(`[FollowUp] Recordatorio generado para ${new Date(fechaObjetivo).toISOString()}`);
    },
    'Episode.StateChanged': async (event) => {
      const { from, to, trigger } = event.meta ?? {};
      await db
        .collection('kpi-events')
        .doc(event.id)
        .set({
          episodeId: event.subject.id,
          from: from ?? null,
          to: to ?? null,
          trigger: trigger ?? null,
          timestamp: event.timestamp ?? Date.now(),
        });
      console.log(`[Episode] ${event.subject.id} pasó de ${from} → ${to} (trigger ${trigger})`);
    },
    'Quote.Presented': async (event) => {
      const { episodeId, total } = event.meta ?? {};
      await db
        .collection('tasks')
        .doc(`quote-presented-${event.id}`)
        .set({
          tipo: 'QUOTE_FOLLOWUP',
          estado: 'pendiente',
          prioridad: 'media',
          resumen: `Dar seguimiento a presupuesto (episodio ${episodeId ?? 'desconocido'})`,
          descripcion: `Total presentado: €${total ?? 'N/A'}`,
          createdAt: Date.now(),
          createdBy: 'automation',
        });
      const message = `Se presentó un presupuesto para el episodio ${episodeId ?? 'N/A'}. Total estimado: €${total ?? 'N/A'}.`;
      await notifySlack(`:page_facing_up: ${message}`);
      await notifyEmail('Nuevo presupuesto presentado', message);
      console.log('[Quotes] Seguimiento registrado tras presentación.');
    },
    'Quote.Accepted': async (event) => {
      const { episodeId, quoteId } = event.meta ?? {};
      await db
        .collection('kpi-events')
        .doc(`quote-${event.id}`)
        .set({
          episodeId: episodeId ?? null,
          quoteId: quoteId ?? null,
          type: 'Quote.Accepted',
          timestamp: event.timestamp ?? Date.now(),
        });
      const message = `Presupuesto aceptado (episodio ${episodeId ?? 'N/A'})`;
      await notifySlack(`:white_check_mark: ${message}`);
      await notifyEmail('Presupuesto aceptado', message);
      console.log('[Quotes] Registro de aceptación guardado para KPIs.');
    },
  };

  return handlers;
}
