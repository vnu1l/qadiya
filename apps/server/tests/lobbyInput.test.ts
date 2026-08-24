import { describe, expect, it } from 'vitest';
import { DEFAULT_PRIVATE_RULES } from '@qadiya/shared';
import { sanitizePrivateRulesPatch, sanitizeRolePreferences } from '../src/domain/lobbyInput';

describe('sanitizeRolePreferences', () => {
  it('drops unknown roles and clamps priority', () => {
    const result = sanitizeRolePreferences([
      { role: 'defense', accepted: true, priority: 1000, allowAutomaticAssignment: true },
      { role: 'hacker', accepted: true, priority: 100, allowAutomaticAssignment: true },
    ]);

    expect(result).toEqual([
      { role: 'defense', accepted: true, priority: 100, allowAutomaticAssignment: true },
    ]);
  });

  it('deduplicates a role instead of allowing contradictory copies', () => {
    const result = sanitizeRolePreferences([
      { role: 'judge', accepted: true, priority: 10, allowAutomaticAssignment: false },
      { role: 'judge', accepted: false, priority: 80, allowAutomaticAssignment: false },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.accepted).toBe(false);
  });
});

describe('sanitizePrivateRulesPatch', () => {
  it('never permits a private minimum below three or max above twelve', () => {
    const next = sanitizePrivateRulesPatch(DEFAULT_PRIVATE_RULES, {
      minPlayers: 1,
      maxPlayers: 99,
      maxDefendants: 99,
    });

    expect(next.minPlayers).toBe(3);
    expect(next.maxPlayers).toBe(12);
    expect(next.maxDefendants).toBe(3);
  });

  it('disables co-defendant contradiction rules when multiple defendants are disabled', () => {
    const next = sanitizePrivateRulesPatch(DEFAULT_PRIVATE_RULES, {
      allowMultipleDefendants: false,
      allowCrossDefendantContradictions: true,
      maxDefendants: 3,
    });

    expect(next.maxDefendants).toBe(1);
    expect(next.allowCrossDefendantContradictions).toBe(false);
  });
});
