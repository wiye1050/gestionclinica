import type { EpisodeState, EpisodeTrigger } from '@/types/constants';
import type { EpisodeGuardContext } from '@/types/episode';

export interface EpisodeStateTransition {
  from: EpisodeState;
  to: EpisodeState;
  trigger: EpisodeTrigger;
  guard?: (context: EpisodeGuardContext) => boolean;
  description: string;
}

const requireBaseConsent = (context?: EpisodeGuardContext) => Boolean(context?.hasBaseConsent);

const requireSpecificConsentAndQuote = (context?: EpisodeGuardContext) =>
  Boolean(context?.hasSpecificConsent && context?.quoteStatus === 'ACCEPTED');

const requireTreatmentControl = (context?: EpisodeGuardContext) => Boolean(context?.treatmentControlled);

const requireDischargeReady = (context?: EpisodeGuardContext) => Boolean(context?.dischargeReady);

const requireRecallScheduled = (context?: EpisodeGuardContext) => Boolean(context?.recallScheduled);

const TRANSITIONS: EpisodeStateTransition[] = [
  {
    from: 'CAPTACION',
    trigger: 'Lead.Qualified',
    to: 'TRIAJE',
    description: 'Lead validado pasa a triaje',
  },
  {
    from: 'TRIAJE',
    trigger: 'Triage.Routed',
    to: 'CITACION',
    description: 'Triaje asignado genera orden de citación',
  },
  {
    from: 'CITACION',
    trigger: 'Appointment.Confirmed',
    to: 'RECIBIMIENTO',
    description: 'Cita confirmada, se prepara recibimiento',
  },
  {
    from: 'RECIBIMIENTO',
    trigger: 'Consent.Signed.Base',
    to: 'EXPLORACION',
    description: 'Consentimiento base firmado habilita exploración',
    guard: requireBaseConsent,
  },
  {
    from: 'EXPLORACION',
    trigger: 'Exploration.Completed',
    to: 'DIAGNOSTICO',
    description: 'Exploración completada produce diagnóstico',
  },
  {
    from: 'DIAGNOSTICO',
    trigger: 'Plan.Created',
    to: 'PLAN',
    description: 'Se crea plan inicial tras diagnóstico',
  },
  {
    from: 'PLAN',
    trigger: 'Plan.Proposed',
    to: 'PRESUPUESTO',
    description: 'Plan propuesto al paciente',
  },
  {
    from: 'PRESUPUESTO',
    trigger: 'Quote.Accepted',
    to: 'TRATAMIENTO',
    description: 'Presupuesto aceptado con consentimiento específico',
    guard: requireSpecificConsentAndQuote,
  },
  {
    from: 'TRATAMIENTO',
    trigger: 'Treatment.ControlReached',
    to: 'SEGUIMIENTO',
    description: 'Control clínico alcanzado, pasa a seguimiento',
    guard: requireTreatmentControl,
  },
  {
    from: 'SEGUIMIENTO',
    trigger: 'Episode.Closed',
    to: 'ALTA',
    description: 'Episodio cerrado tras seguimiento',
    guard: requireDischargeReady,
  },
  {
    from: 'ALTA',
    trigger: 'Recall.Scheduled',
    to: 'MANTENIMIENTO',
    description: 'Se agenda recall preventivo',
    guard: requireRecallScheduled,
  },
];

export function getNextState(
  current: EpisodeState,
  trigger: EpisodeTrigger,
  context: EpisodeGuardContext = {}
): EpisodeState | null {
  const transition = TRANSITIONS.find((t) => t.from === current && t.trigger === trigger);
  if (!transition) {
    return null;
  }
  if (transition.guard && !transition.guard(context)) {
    return null;
  }
  return transition.to;
}

export function canTransition(
  current: EpisodeState,
  trigger: EpisodeTrigger,
  context: EpisodeGuardContext = {}
): boolean {
  return getNextState(current, trigger, context) !== null;
}

export function getTransitionDescription(
  current: EpisodeState,
  trigger: EpisodeTrigger
): string | null {
  const transition = TRANSITIONS.find((t) => t.from === current && t.trigger === trigger);
  return transition?.description ?? null;
}

export const EPISODE_TRANSITIONS = TRANSITIONS;
