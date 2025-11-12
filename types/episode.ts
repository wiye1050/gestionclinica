import type {
  CanonicalEventType,
  ConsentType,
  EpisodeState,
  FormSchemaKey,
} from '@/types/constants';

export type ID = string;

export interface Patient {
  id: ID;
  fullName: string;
  dob?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  createdAt: number;
}

export interface Episode {
  id: ID;
  patientId: ID;
  state: EpisodeState;
  ownerUserId?: ID;
  reason?: string;
  startedAt: number;
  closedAt?: number;
  tags?: string[];
  riskFlags?: string[];
  updatedAt?: number;
}

export interface Triage {
  id: ID;
  episodeId: ID;
  submittedBy: 'PATIENT' | 'CLINICIAN';
  channel: 'WEB' | 'PHONE' | 'WHATSAPP' | 'REFERRAL';
  formSchemaKey: FormSchemaKey;
  answers: Record<string, unknown>;
  riskFlags: string[];
  reportUrl?: string;
  createdAt: number;
}

export interface PlanMaterial {
  sku: string;
  qty: number;
}

export interface Plan {
  id: ID;
  episodeId: ID;
  protocolKey: string;
  sessionsPlanned: number;
  sessionsDone: number;
  materials: PlanMaterial[];
  consentsRequired: string[];
  priceTotal?: number;
  status: 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'REJECTED';
  createdAt?: number;
  updatedAt?: number;
}

export interface QuoteItem {
  label: string;
  qty: number;
  price: number;
}

export interface Quote {
  id: ID;
  episodeId: ID;
  items: QuoteItem[];
  total: number;
  status: 'PRESENTED' | 'ACCEPTED' | 'DECLINED';
  signedAt?: number;
  pdfUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProcedureChecklistItem {
  key: string;
  done: boolean;
  note?: string;
}

export interface ProcedureInventoryMovement {
  sku: string;
  qty: number;
  batch?: string;
}

export interface Procedure {
  id: ID;
  episodeId: ID;
  type: string;
  date: number;
  roomId: ID;
  professionalId: ID;
  checklist: ProcedureChecklistItem[];
  inventoryMovements: ProcedureInventoryMovement[];
  notes?: string;
  status: 'SCHEDULED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
}

export interface Consent {
  id: ID;
  patientId: ID;
  episodeId?: ID;
  type: ConsentType;
  version: string;
  signedAt: number;
  signer: { name: string; docId?: string };
  fileUrl?: string;
}

export interface Appointment {
  id: ID;
  episodeId: ID;
  patientId: ID;
  professionalId: ID;
  roomId: ID;
  start: number;
  end: number;
  status: 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

export interface FollowUp {
  id: ID;
  episodeId: ID;
  date: number;
  kind: 'REVIEW' | 'PROs';
  completedAt?: number;
  scores?: Record<string, number>;
}

export interface CanonicalEvent {
  id?: ID;
  type: CanonicalEventType | string;
  subject: {
    kind: 'patient' | 'episode' | 'plan' | 'procedure' | 'appointment' | 'quote';
    id: ID;
  };
  actorUserId?: ID;
  timestamp?: number;
  meta?: Record<string, unknown>;
}

export interface EpisodeStateCounts {
  state: EpisodeState;
  total: number;
}

export interface EpisodeWithPatient extends Episode {
  patient?: Patient;
}

export interface EpisodeGuardContext {
  hasBaseConsent?: boolean;
  hasSpecificConsent?: boolean;
  quoteStatus?: Quote['status'];
  explorationCompleted?: boolean;
  treatmentControlled?: boolean;
  dischargeReady?: boolean;
  recallScheduled?: boolean;
}
