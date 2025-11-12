import { adminDb } from '@/lib/firebaseAdmin';
import type { EpisodeGuardContext } from '@/types/episode';
import type { EpisodeState, EpisodeTrigger } from '@/types/constants';
import { getNextState } from '@/lib/workflows/episodeMachine';
import { emitEvent } from '@/lib/events/emit';

interface ApplyEpisodeTransitionParams {
  episodeId: string;
  trigger: EpisodeTrigger;
  actorUserId?: string;
  context?: EpisodeGuardContext;
  meta?: Record<string, unknown>;
}

interface ApplyEpisodeTransitionResult {
  changed: boolean;
  previousState: EpisodeState;
  nextState: EpisodeState;
}

export async function applyEpisodeTransition(
  params: ApplyEpisodeTransitionParams
): Promise<ApplyEpisodeTransitionResult> {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado. No se puede actualizar el episodio.');
  }

  const { episodeId, trigger, actorUserId, context, meta } = params;
  const episodeRef = adminDb.collection('episodes').doc(episodeId);

  const result = await adminDb.runTransaction<ApplyEpisodeTransitionResult>(async (tx) => {
    const snapshot = await tx.get(episodeRef);
    if (!snapshot.exists) {
      throw new Error(`El episodio ${episodeId} no existe`);
    }

    const data = snapshot.data() as { state: EpisodeState; patientId: string };
    const currentState = data.state;

    const nextState = getNextState(currentState, trigger, context ?? {});
    if (!nextState || nextState === currentState) {
      return {
        changed: false,
        previousState: currentState,
        nextState: currentState,
      };
    }

    tx.update(episodeRef, {
      state: nextState,
      updatedAt: Date.now(),
    });

    return {
      changed: true,
      previousState: currentState,
      nextState,
    };
  });

  if (result.changed) {
    await emitEvent({
      type: 'Episode.StateChanged',
      subject: { kind: 'episode', id: episodeId },
      actorUserId,
      meta: {
        from: result.previousState,
        to: result.nextState,
        trigger,
        ...(meta ?? {}),
      },
    });
  }

  return result;
}
