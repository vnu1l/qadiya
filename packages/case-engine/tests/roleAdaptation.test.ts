import { describe, expect, it } from 'vitest';
import { adaptVariableRoles, roleAdaptationIsPlayable, type RoleDefinition } from '../src';

function role(id: string, overrides: Partial<RoleDefinition> = {}): RoleDefinition {
  return {
    id,
    roleKind: 'witness',
    characterId: `character-${id}`,
    required: false,
    replaceable: true,
    canBecomeSystemCharacter: true,
    canBecomeDocument: true,
    critical: false,
    engagement: {
      exclusiveInformation: 0.5,
      meaningfulDecisions: 0.5,
      concealmentPressure: 0.5,
      influencePotential: 0.5,
      personalRisk: 0.5,
    },
    ...overrides,
  };
}

describe('adaptVariableRoles', () => {
  it('turns variable roles into system characters for a three-player court with no spare human seats', () => {
    const result = adaptVariableRoles([role('witness-a'), role('expert-a')], {
      humanSlots: 0,
      allowSystemCharacters: true,
      allowDocuments: true,
    });

    expect(result.humanRoleIds).toEqual([]);
    expect(result.systemCharacterRoleIds).toEqual(['expert-a', 'witness-a']);
    expect(roleAdaptationIsPlayable(result)).toBe(true);
  });

  it('spends a scarce human slot on the role with more meaningful gameplay', () => {
    const low = role('low', {
      engagement: {
        exclusiveInformation: 0.1,
        meaningfulDecisions: 0.1,
        concealmentPressure: 0,
        influencePotential: 0.1,
        personalRisk: 0,
      },
    });
    const high = role('high', {
      engagement: {
        exclusiveInformation: 1,
        meaningfulDecisions: 1,
        concealmentPressure: 0.8,
        influencePotential: 1,
        personalRisk: 0.7,
      },
    });

    const result = adaptVariableRoles([low, high], {
      humanSlots: 1,
      allowSystemCharacters: true,
      allowDocuments: true,
    });

    expect(result.humanRoleIds).toEqual(['high']);
  });

  it('never collapses a critical role into a document', () => {
    const result = adaptVariableRoles(
      [role('critical', { required: true, critical: true, canBecomeSystemCharacter: false, canBecomeDocument: true })],
      { humanSlots: 0, allowSystemCharacters: false, allowDocuments: true },
    );

    expect(result.documentRoleIds).toEqual([]);
    expect(result.unfulfilledRequiredRoleIds).toEqual(['critical']);
    expect(roleAdaptationIsPlayable(result)).toBe(false);
  });

  it('allows a noncritical simple role to become a document', () => {
    const result = adaptVariableRoles(
      [role('reporter', { canBecomeSystemCharacter: false, canBecomeDocument: true, critical: false })],
      { humanSlots: 0, allowSystemCharacters: false, allowDocuments: true },
    );

    expect(result.documentRoleIds).toEqual(['reporter']);
  });
});
