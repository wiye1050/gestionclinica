import { adminDb } from '@/lib/firebaseAdmin';
import type { CanonicalEvent } from '@/types/episode';

export type EmitEventPayload = Omit<CanonicalEvent, 'id' | 'timestamp'> & {
  timestamp?: number;
};

export async function emitEvent(payload: EmitEventPayload): Promise<string> {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado. No es posible emitir eventos.');
  }

  const doc = await adminDb.collection('events').add({
    ...payload,
    timestamp: payload.timestamp ?? Date.now(),
  });

  return doc.id;
}
