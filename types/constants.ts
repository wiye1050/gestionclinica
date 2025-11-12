export const EPISODE_STATES = [
  'CAPTACION',
  'TRIAJE',
  'CITACION',
  'RECIBIMIENTO',
  'EXPLORACION',
  'DIAGNOSTICO',
  'PLAN',
  'PRESUPUESTO',
  'TRATAMIENTO',
  'SEGUIMIENTO',
  'ALTA',
  'MANTENIMIENTO',
] as const;

export type EpisodeState = (typeof EPISODE_STATES)[number];

export const EPISODE_TRIGGERS = [
  'Lead.Qualified',
  'Triage.Routed',
  'Appointment.Confirmed',
  'Consent.Signed.Base',
  'Exploration.Completed',
  'Plan.Created',
  'Plan.Proposed',
  'Quote.Accepted',
  'Treatment.ControlReached',
  'Episode.Closed',
  'Recall.Scheduled',
] as const;

export type EpisodeTrigger = (typeof EPISODE_TRIGGERS)[number];

export const CANONICAL_EVENT_TYPES = {
  LEAD_CREATED: 'Lead.Created',
  LEAD_QUALIFIED: 'Lead.Qualified',
  TRIAGE_SUBMITTED: 'Triage.Submitted',
  TRIAGE_ROUTED: 'Triage.Routed',
  APPOINTMENT_BOOKED: 'Appointment.Booked',
  APPOINTMENT_CONFIRMED: 'Appointment.Confirmed',
  APPOINTMENT_COMPLETED: 'Appointment.Completed',
  APPOINTMENT_CANCELLED: 'Appointment.Cancelled',
  CONSENT_BASE_SIGNED: 'Consent.Signed.Base',
  CONSENT_SPECIFIC_SIGNED: 'Consent.Signed.Specific',
  PLAN_CREATED: 'Plan.Created',
  PLAN_PROPOSED: 'Plan.Proposed',
  PLAN_APPROVED: 'Plan.Approved',
  QUOTE_PRESENTED: 'Quote.Presented',
  QUOTE_ACCEPTED: 'Quote.Accepted',
  QUOTE_DECLINED: 'Quote.Declined',
  PROCEDURE_COMPLETED: 'Procedure.Completed',
  FOLLOWUP_SCHEDULED: 'FollowUp.Scheduled',
  EPISODE_STATE_CHANGED: 'Episode.StateChanged',
  EPISODE_CLOSED: 'Episode.Closed',
  INVENTORY_DEDUCTED: 'Inventory.Deducted',
  INVENTORY_ALERT: 'Inventory.ReplenishAlert',
  NPS_SENT: 'NPS.Sent',
  NPS_RECEIVED: 'NPS.Received',
} as const;

export type CanonicalEventType =
  (typeof CANONICAL_EVENT_TYPES)[keyof typeof CANONICAL_EVENT_TYPES];

export const FORM_SCHEMA_KEYS = {
  TRIAGE_GENERAL_V1: 'TRIAGE_GENERAL_V1',
  EXPLORACION_LUMBAR_V1: 'EXPLORACION_LUMBAR_V1',
  PROS_VAS_ODI_V1: 'PROs_VAS_ODI_V1',
} as const;

export type FormSchemaKey = (typeof FORM_SCHEMA_KEYS)[keyof typeof FORM_SCHEMA_KEYS];

export const CONSENT_TYPES = {
  BASE: 'BASE',
  SPECIFIC: 'SPECIFIC',
} as const;

export type ConsentType = (typeof CONSENT_TYPES)[keyof typeof CONSENT_TYPES];

export const EPISODE_STATE_LABELS: Record<EpisodeState, string> = {
  CAPTACION: 'Captación',
  TRIAJE: 'Triaje',
  CITACION: 'Citación',
  RECIBIMIENTO: 'Recibimiento',
  EXPLORACION: 'Exploración',
  DIAGNOSTICO: 'Diagnóstico',
  PLAN: 'Plan',
  PRESUPUESTO: 'Presupuesto',
  TRATAMIENTO: 'Tratamiento',
  SEGUIMIENTO: 'Seguimiento',
  ALTA: 'Alta',
  MANTENIMIENTO: 'Mantenimiento',
};
