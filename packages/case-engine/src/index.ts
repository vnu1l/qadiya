export type CaseMode =
  | 'single-defendant'
  | 'joint-defendants'
  | 'wrongly-accused'
  | 'conflicting-narratives'
  | 'evidence-heavy'
  | 'secrets-heavy'
  | 'conspiracy';

export interface TimelineEvent {
  id: string;
  minute: number;
  locationId: string;
  actorIds: string[];
  factIds: string[];
}

export interface CaseFact {
  id: string;
  statement: string;
  source: 'direct' | 'record' | 'inference';
}

export interface EvidenceDefinition {
  id: string;
  title: string;
  factIds: string[];
  strength: number;
  discoverableBy: string[];
}

export interface RoleDefinition {
  id: string;
  characterId: string;
  required: boolean;
  replaceable: boolean;
  canBecomeNpc: boolean;
  canBecomeDocument: boolean;
  engagementScore: number;
}

export interface CaseBlueprint {
  id: string;
  mode: CaseMode;
  complexity: 1 | 2 | 3 | 4 | 5;
  defendantIds: string[];
  facts: CaseFact[];
  timeline: TimelineEvent[];
  evidence: EvidenceDefinition[];
  roles: RoleDefinition[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export function validateCaseBlueprint(caseFile: CaseBlueprint): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const factIds = new Set(caseFile.facts.map((fact) => fact.id));

  if (caseFile.defendantIds.length === 0) {
    issues.push({ severity: 'error', code: 'NO_DEFENDANT', message: 'The case requires at least one defendant.' });
  }

  for (const evidence of caseFile.evidence) {
    for (const factId of evidence.factIds) {
      if (!factIds.has(factId)) {
        issues.push({
          severity: 'error',
          code: 'EVIDENCE_UNKNOWN_FACT',
          message: `Evidence ${evidence.id} references unknown fact ${factId}.`,
        });
      }
    }
  }

  for (const role of caseFile.roles) {
    if (role.required && role.engagementScore < 3) {
      issues.push({
        severity: 'warning',
        code: 'LOW_ENGAGEMENT_REQUIRED_ROLE',
        message: `Required role ${role.id} needs more meaningful decisions or information.`,
      });
    }
  }

  return issues;
}
