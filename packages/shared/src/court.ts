export type CourtPhase =
  | 'lobby'
  | 'role-allocation'
  | 'preparation'
  | 'opening'
  | 'case-presentation'
  | 'witness-examination'
  | 'motions'
  | 'closing'
  | 'deliberation'
  | 'verdict'
  | 'suspended'
  | 'complete';

export type CourtEventType =
  | 'session-opened'
  | 'charge-presented'
  | 'evidence-introduced'
  | 'evidence-admitted'
  | 'evidence-rejected'
  | 'witness-called'
  | 'witness-excused'
  | 'statement-recorded'
  | 'contradiction-raised'
  | 'motion-filed'
  | 'motion-resolved'
  | 'right-waived'
  | 'prosecution-rested'
  | 'defense-rested'
  | 'evidence-reopened'
  | 'recess-started'
  | 'recess-ended'
  | 'verdict-entered';

export interface CourtEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  sequence: number;
  at: string;
  type: CourtEventType;
  actorId?: string;
  payload: TPayload;
}
