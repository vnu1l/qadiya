import type { CaseComplexity, CaseMode, EvidenceKind } from './model';

export type CaseFamily =
  | 'identity'
  | 'innocence'
  | 'intent'
  | 'complicity'
  | 'fraud'
  | 'multi-suspect';

export type TruthPattern =
  | 'accused-is-culprit'
  | 'wrongly-accused'
  | 'partial-responsibility'
  | 'shared-responsibility'
  | 'unknown-actor-at-start';

export type WitnessPattern =
  | 'reliable'
  | 'mistaken-but-sincere'
  | 'withholding-secret'
  | 'conflicting-witnesses'
  | 'biased-but-not-fabricated';

export type CaseModifier =
  | 'multiple-defendants'
  | 'cross-defendant-contradictions'
  | 'hidden-side-offense'
  | 'evidence-heavy'
  | 'secrets-heavy'
  | 'procedural-weakness'
  | 'alternative-suspect';

export interface VariableRoleBudget {
  min: number;
  max: number;
}

export interface CaseDNA {
  id: string;
  family: CaseFamily;
  mode: CaseMode;
  complexity: CaseComplexity;
  truthPattern: TruthPattern;
  primaryEvidenceKind: EvidenceKind;
  secondaryEvidenceKinds: EvidenceKind[];
  witnessPattern: WitnessPattern;
  modifiers: CaseModifier[];
  minDefendants: number;
  maxDefendants: number;
  variableRoleBudget: VariableRoleBudget;
}

export interface CaseDNAIssue {
  code: string;
  message: string;
}

export function validateCaseDNA(dna: CaseDNA): CaseDNAIssue[] {
  const issues: CaseDNAIssue[] = [];

  if (!Number.isInteger(dna.minDefendants) || !Number.isInteger(dna.maxDefendants)) {
    issues.push({ code: 'DNA_INVALID_DEFENDANT_RANGE', message: 'Defendant bounds must be integers.' });
  } else if (dna.minDefendants < 1 || dna.maxDefendants < dna.minDefendants || dna.maxDefendants > 3) {
    issues.push({
      code: 'DNA_INVALID_DEFENDANT_RANGE',
      message: 'Defendant range must be between 1 and 3 and max must be >= min.',
    });
  }

  if (dna.mode === 'single-defendant' && dna.maxDefendants !== 1) {
    issues.push({
      code: 'DNA_SINGLE_MODE_MULTIPLE_DEFENDANTS',
      message: 'single-defendant mode must have exactly one defendant.',
    });
  }

  if (dna.mode === 'joint-defendants' && dna.minDefendants < 2) {
    issues.push({
      code: 'DNA_JOINT_MODE_NEEDS_MULTIPLE_DEFENDANTS',
      message: 'joint-defendants mode requires at least two defendants.',
    });
  }

  if (
    !Number.isInteger(dna.variableRoleBudget.min) ||
    !Number.isInteger(dna.variableRoleBudget.max) ||
    dna.variableRoleBudget.min < 0 ||
    dna.variableRoleBudget.max < dna.variableRoleBudget.min
  ) {
    issues.push({
      code: 'DNA_INVALID_VARIABLE_ROLE_BUDGET',
      message: 'Variable role budget must be non-negative integers with max >= min.',
    });
  }

  const hasMultipleDefendantModifier = dna.modifiers.includes('multiple-defendants');
  if (hasMultipleDefendantModifier !== (dna.maxDefendants > 1)) {
    issues.push({
      code: 'DNA_MULTIPLE_DEFENDANT_MODIFIER_MISMATCH',
      message: 'multiple-defendants modifier must match the DNA defendant range.',
    });
  }

  if (dna.modifiers.includes('cross-defendant-contradictions') && dna.maxDefendants < 2) {
    issues.push({
      code: 'DNA_CROSS_DEFENDANT_WITH_SINGLE_DEFENDANT',
      message: 'Cross-defendant contradictions require a multi-defendant DNA.',
    });
  }

  return issues;
}
