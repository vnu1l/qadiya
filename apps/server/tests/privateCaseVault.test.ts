import { describe, expect, it } from 'vitest';
import type { PrivatePlayerBrief } from '@qadiya/shared';
import { PrivateCaseVault } from '../src/domain/privateCaseVault';

function brief(playerId: string): PrivatePlayerBrief {
  return {
    playerId,
    role: 'defendant',
    character: {
      id: 'char-1',
      displayName: 'سالم',
      gender: 'male',
      age: 34,
      occupation: 'موظف',
      publicBackground: [],
      privateKnowledge: ['دخلت المبنى قبل التاسعة بقليل.'],
      memoryNotes: [],
      memoryProfile: 'normal',
    },
    memory: [{ id: 'memory-1', text: 'قابلت الحارس قبل الدخول.', retainableAsNote: true }],
    privateKnowledgeIds: ['knowledge-1'],
    secretIds: ['secret-1'],
    retainedNoteLimit: 3,
  };
}

describe('PrivateCaseVault', () => {
  it('only returns a brief through the owning player key', () => {
    const vault = new PrivateCaseVault();
    vault.setPlayerBrief('player-a', brief('player-a'));

    expect(vault.getOwnBrief('player-a')?.secretIds).toEqual(['secret-1']);
    expect(vault.getOwnBrief('player-b')).toBeNull();
  });

  it('protects privileged consultation notes from nonparticipants', () => {
    const vault = new PrivateCaseVault();
    vault.createConsultation('defense-room', ['defendant', 'lawyer']);

    expect(vault.appendConsultationNote('outsider', 'defense-room', 'سر')).toBeNull();
    expect(vault.appendConsultationNote('defendant', 'defense-room', 'لا تذكر السيارة')?.text).toBe('لا تذكر السيارة');
    expect(vault.getConsultation('outsider', 'defense-room')).toBeNull();
    expect(vault.getConsultation('lawyer', 'defense-room')?.notes).toHaveLength(1);
  });

  it('returns clones so callers cannot mutate stored secrets by reference', () => {
    const vault = new PrivateCaseVault();
    vault.setPlayerBrief('player-a', brief('player-a'));
    const copy = vault.getOwnBrief('player-a')!;
    copy.secretIds.length = 0;

    expect(vault.getOwnBrief('player-a')?.secretIds).toEqual(['secret-1']);
  });
});
