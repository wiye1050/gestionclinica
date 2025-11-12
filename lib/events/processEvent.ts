import type { Firestore } from 'firebase-admin/firestore';
import type { CanonicalEvent } from './handlers';
import { createEventHandlers } from './handlers';

type NotifySlack = (text: string) => Promise<void> | void;
type NotifyEmail = (subject: string, text: string) => Promise<void> | void;

type Options = {
  db: Firestore;
  notifySlack?: NotifySlack;
  notifyEmail?: NotifyEmail;
  dedupeCollection?: string;
};

export type EventProcessor = (event: CanonicalEvent) => Promise<void>;

export function createEventProcessor({
  db,
  notifySlack,
  notifyEmail,
  dedupeCollection = 'automation-processed',
}: Options): EventProcessor {
  const handlers = createEventHandlers({ db, notifySlack, notifyEmail });

  async function markProcessed(eventId: string, type: string): Promise<boolean> {
    const ref = db.collection(dedupeCollection).doc(eventId);
    const snap = await ref.get();
    if (snap.exists) {
      return false;
    }
    await ref.set({
      processedAt: Date.now(),
      type,
    });
    return true;
  }

  return async function processEvent(event: CanonicalEvent) {
    const handler = handlers[event.type];
    if (!handler) {
      console.log(`[EventBus] ${event.type} (sin handler)`, { id: event.id });
      return;
    }
    const shouldProcess = await markProcessed(event.id, event.type);
    if (!shouldProcess) {
      console.log(`[EventBus] Evento ${event.id} ya procesado, se ignora.`);
      return;
    }
    await handler(event);
  };
}
