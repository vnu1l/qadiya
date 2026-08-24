import { describe, expect, it } from 'vitest';
import type { PrivatePlayerBrief } from '@qadiya/shared';
import { PrivateCaseVault } from '../src/domain/privateCaseVault';

function brief(playerId: string, retainedNoteLimit = 3): PrivatePlayerBrief {
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
    retainedNoteLimit,
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

  it('enforces retained-note count, per-note length and total length instead of silently truncating memory', () => {
    const vault = new PrivateCaseVault();
    vault.setPlayerBrief('player-a', brief('player-a', 2));

    expect(vault.setRetainedNotes('player-a', ['الوصول 9:15', 'لا تذكر السيارة']).ok).toBe(true);
    expect(vault.getRetainedNotes('player-a')).toEqual(['الوصول 9:15', 'لا تذكر السيارة']);

    expect(vault.setRetainedNotes('player-a', ['1', '2', '3'])).toEqual(
      expect.objectContaining({ ok: false, code: 'RETAINED_NOTE_COUNT_EXCEEDED' }),
    );
    expect(vault.setRetainedNotes('player-a', ['x'.repeat(97)])).toEqual(
      expect.objectContaining({ ok: false, code: 'RETAINED_NOTE_TOO_LONG' }),
    );

    vault.setPlayerBrief('player-b', brief('player-b', 5));
    expect(vault.setRetainedNotes('player-b', ['a'.repeat(70), 'b'.repeat(70), 'c'.repeat(70), 'd'.repeat(71)])).toEqual(
      expect.objectContaining({ ok: false, code: 'RETAINED_NOTES_TOTAL_TOO_LONG' }),
    );
  });

  it('locks retained notes when court preparation ends', () => {
    const vault = new PrivateCaseVault();
    vault.setPlayerBrief('player-a', brief('player-a'));
    expect(vault.setRetainedNotes('player-a', ['وقت الوصول'])).toEqual(
      expect.objectContaining({ ok: true }),
    );

    vault.lockRetainedNotes(['player-a']);
    expect(vault.isRetainedNotesLocked('player-a')).toBe(true);
    expect(vault.setRetainedNotes('player-a', ['ملاحظة جديدة'])).toEqual(
      expect.objectContaining({ ok: false, code: 'RETAINED_NOTES_LOCKED' }),
    );
    expect(vault.getRetainedNotes('player-a')).toEqual(['وقت الوصول']);
  });

  it('ensures the same consultation id can be restored only with the same participants', () => {
    const vault = new PrivateCaseVault();
    vault.ensureConsultation('defense-room', ['defendant', 'lawyer']);
    expect(vault.ensureConsultation('defense-room', ['lawyer', 'defendant']).participantPlayerIds).toHaveLength(2);
    expect(() => vault.ensureConsultation('defense-room', ['defendant', 'other-lawyer'])).toThrow();
  });
});
