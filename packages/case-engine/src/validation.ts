import type { CaseBlueprint, RoleEngagement } from './model';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  entityId?: string;
}

function inUnitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function engagementScore(engagement: RoleEngagement): number {
  return (
    engagement.exclusiveInformation +
    engagement.meaningfulDecisions +
    engagement.concealmentPressure +
    engagement.influencePotential +
    engagement.personalRisk
  );
}

function duplicateIds(values: readonly { id: string }[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value.id)) duplicates.add(value.id);
    seen.add(value.id);
  }

  return [...duplicates];
}

export function validateCaseBlueprint(caseFile: CaseBlueprint): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const characterIds = new Set(caseFile.characters.map((character) => character.id));
  const factIds = new Set(caseFile.facts.map((fact) => fact.id));
  const timelineIds = new Set(caseFile.timeline.map((event) => event.id));

  const collections = [
    ['character', caseFile.characters],
    ['fact', caseFile.facts],
    ['timeline', caseFile.timeline],
    ['knowledge', caseFile.knowledge],
    ['evidence', caseFile.evidence],
    ['role', caseFile.roles],
    ['charge', caseFile.charges],
  ] as const;

  for (const [kind, values] of collections) {
    for (const duplicateId of duplicateIds(values)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_ID',
        message: `Duplicate ${kind} id: ${duplicateId}.`,
        entityId: duplicateId,
      });
    }
  }

  if (caseFile.defendantIds.length === 0) {
    issues.push({ severity: 'error', code: 'NO_DEFENDANT', message: 'The case requires at least one defendant.' });
  }

  for (const defendantId of caseFile.defendantIds) {
    if (!characterIds.has(defendantId)) {
      issues.push({
        severity: 'error',
        code: 'UNKNOWN_DEFENDANT',
        message: `Defendant ${defendantId} is not a known character.`,
        entityId: defendantId,
      });
    }
  }

  for (const event of caseFile.timeline) {
    if (event.endMinute !== undefined && event.endMinute < event.startMinute) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TIME_RANGE',
        message: `Timeline event ${event.id} ends before it starts.`,
        entityId: event.id,
      });
    }

    for (const actorId of event.actorIds) {
      if (!characterIds.has(actorId)) {
        issues.push({
          severity: 'error',
          code: 'TIMELINE_UNKNOWN_ACTOR',
          message: `Timeline event ${event.id} references unknown actor ${actorId}.`,
          entityId: event.id,
        });
      }
    }

    for (const factId of event.factIds) {
      if (!factIds.has(factId)) {
        issues.push({
          severity: 'error',
          code: 'TIMELINE_UNKNOWN_FACT',
          message: `Timeline event ${event.id} references unknown fact ${factId}.`,
          entityId: event.id,
        });
      }
    }
  }

  for (const item of caseFile.knowledge) {
    if (!characterIds.has(item.holderCharacterId)) {
      issues.push({
        severity: 'error',
        code: 'KNOWLEDGE_UNKNOWN_HOLDER',
        message: `Knowledge ${item.id} has unknown holder ${item.holderCharacterId}.`,
        entityId: item.id,
      });
    }

    if (!factIds.has(item.factId)) {
      issues.push({
        severity: 'error',
        code: 'KNOWLEDGE_UNKNOWN_FACT',
        message: `Knowledge ${item.id} references unknown fact ${item.factId}.`,
        entityId: item.id,
      });
    }

    if (!inUnitInterval(item.accuracy) || !inUnitInterval(item.confidence)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_KNOWLEDGE_SCORE',
        message: `Knowledge ${item.id} accuracy/confidence must be between 0 and 1.`,
        entityId: item.id,
      });
    }

    if (item.source.sourceTimelineEventId && !timelineIds.has(item.source.sourceTimelineEventId)) {
      issues.push({
        severity: 'error',
        code: 'KNOWLEDGE_UNKNOWN_SOURCE_EVENT',
        message: `Knowledge ${item.id} references unknown source timeline event ${item.source.sourceTimelineEventId}.`,
        entityId: item.id,
      });
    }

    if (item.source.kind === 'heard-from-person' && !item.source.sourceEntityId) {
      issues.push({
        severity: 'error',
        code: 'KNOWLEDGE_MISSING_SOURCE_PERSON',
        message: `Knowledge ${item.id} is hearsay but does not identify its source person.`,
        entityId: item.id,
      });
    }
  }

  for (const evidence of caseFile.evidence) {
    if (!inUnitInterval(evidence.reliability) || !inUnitInterval(evidence.ambiguity)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_EVIDENCE_SCORE',
        message: `Evidence ${evidence.id} reliability/ambiguity must be between 0 and 1.`,
        entityId: evidence.id,
      });
    }

    for (const factId of evidence.factIds) {
      if (!factIds.has(factId)) {
        issues.push({
          severity: 'error',
          code: 'EVIDENCE_UNKNOWN_FACT',
          message: `Evidence ${evidence.id} references unknown fact ${factId}.`,
          entityId: evidence.id,
        });
      }
    }

    if (evidence.provenance.sourceTimelineEventId && !timelineIds.has(evidence.provenance.sourceTimelineEventId)) {
      issues.push({
        severity: 'error',
        code: 'EVIDENCE_UNKNOWN_SOURCE_EVENT',
        message: `Evidence ${evidence.id} references unknown provenance event ${evidence.provenance.sourceTimelineEventId}.`,
        entityId: evidence.id,
      });
    }
  }

  for (const role of caseFile.roles) {
    if (!characterIds.has(role.characterId)) {
      issues.push({
        severity: 'error',
        code: 'ROLE_UNKNOWN_CHARACTER',
        message: `Role ${role.id} references unknown character ${role.characterId}.`,
        entityId: role.id,
      });
    }

    if (role.required && engagementScore(role.engagement) < 2) {
      issues.push({
        severity: 'warning',
        code: 'LOW_ENGAGEMENT_REQUIRED_ROLE',
        message: `Required role ${role.id} has too little meaningful gameplay for a human player.`,
        entityId: role.id,
      });
    }

    if (role.critical && role.canBecomeDocument) {
      issues.push({
        severity: 'warning',
        code: 'CRITICAL_ROLE_DOCUMENT_FALLBACK',
        message: `Critical role ${role.id} can become a document; verify that this cannot remove essential cross-examination.`,
        entityId: role.id,
      });
    }
  }

  for (const charge of caseFile.charges) {
    for (const defendantId of charge.defendantIds) {
      if (!caseFile.defendantIds.includes(defendantId)) {
        issues.push({
          severity: 'error',
          code: 'CHARGE_UNKNOWN_DEFENDANT',
          message: `Charge ${charge.id} references ${defendantId}, who is not a defendant in this case.`,
          entityId: charge.id,
        });
      }
    }

    for (const factId of charge.elementFactIds) {
      if (!factIds.has(factId)) {
        issues.push({
          severity: 'error',
          code: 'CHARGE_UNKNOWN_FACT',
          message: `Charge ${charge.id} references unknown element fact ${factId}.`,
          entityId: charge.id,
        });
      }
    }
  }

  return issues;
}

export function hasValidationErrors(issues: readonly ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}
