import { describe, expect, it } from 'vitest';
import type { PlayerRole, PreparationParticipant, PrivatePlayerBrief } from '@qadiya/shared';
import { PreparationCoordinator } from '../src/domain/preparationCoordinator';
import { PrivateCaseVault } from '../src/domain/privateCaseVault';

function brief(playerId: string, role: PlayerRole, retainedNoteLimit = 3): PrivatePlayerBrief {
  return {
    playerId,
    role,
    character: {
      id: `char:${playerId}`,
      displayName: playerId,
      gender: 'male',
      age: 35,
      occupation: 'اختبار',
      publicBackground: [],
      privateKnowledge: [],
      memoryNotes: [],
      memoryProfile: 'normal',
    },
    memory: [],
    privateKnowledgeIds: [],
    secretIds: [],
    retainedNoteLimit,
  };
}

function participant(playerId: string, role: PlayerRole, requiredForOpening = true): PreparationParticipant {
  return { playerId, role, requiredForOpening };
}

describe('PreparationCoordinator', () => {
  it('treats readiness as a soft warning and allows an explicit override', () => {
    const vault = new PrivateCaseVault();
    const participants = [
      participant('judge', 'judge'),
      participant('prosecution', 'prosecution'),
      participant('defendant', 'defendant'),
      participant('lawyer', 'defense'),
    ];
    for (const entry of participants) vault.setPlayerBrief(entry.playerId, brief(entry.playerId, entry.role));

    const coordinator = new PreparationCoordinator({
      participants,
      defenseRepresentations: [
        { id: 'r1', defendantPlayerIds: ['defendant'], lawyerPlayerId: 'lawyer', selfRepresented: false },
      ],
      vault,
      isConnected: () => true,
    });

    const started = coordinator.start();
    expect(started.stage).toBe('ready-to-open');
    expect(started.hardBlockerCount).toBe(0);
    expect(started.warningCount).toBe(4);

    const normalAttempt = coordinator.attemptOpenCourt(false);
    expect(normalAttempt.opened).toBe(false);
    expect(normalAttempt.requiresSoftOverride).toBe(true);

    const overrideAttempt = coordinator.attemptOpenCourt(true);
    expect(overrideAttempt.opened).toBe(true);
    expect(vault.isRetainedNotesLocked('defendant')).toBe(true);
  });

  it('never allows an override around a missing required private brief', () => {
    const vault = new PrivateCaseVault();
    vault.setPlayerBrief('judge', brief('judge', 'judge'));

    const coordinator = new PreparationCoordinator({
      participants: [participant('judge', 'judge'), participant('defendant', 'defendant')],
      defenseRepresentations: [{ id: 'self', defendantPlayerIds: ['defendant'], selfRepresented: true }],
      vault,
      isConnected: () => true,
    });

    coordinator.start();
    const readiness = coordinator.getReadiness();
    expect(readiness.hardBlockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'REQUIRED_PRIVATE_BRIEF_MISSING', playerId: 'defendant' })]),
    );
    expect(coordinator.attemptOpenCourt(true).opened).toBe(false);
  });

  it('creates one private shared-counsel consultation for lawyer and all represented defendants', () => {
    const vault = new PrivateCaseVault();
    const participants = [
      participant('judge', 'judge'),
      participant('lawyer', 'defense'),
      participant('d1', 'defendant'),
      participant('d2', 'defendant'),
    ];
    for (const entry of participants) vault.setPlayerBrief(entry.playerId, brief(entry.playerId, entry.role));

    const coordinator = new PreparationCoordinator({
      participants,
      defenseRepresentations: [
        { id: 'joint', defendantPlayerIds: ['d1', 'd2'], lawyerPlayerId: 'lawyer', selfRepresented: false },
      ],
      vault,
      isConnected: () => true,
    });
    coordinator.start();

    const lawyerRooms = coordinator.getOwnConsultations('lawyer');
    expect(lawyerRooms).toHaveLength(1);
    expect(new Set(lawyerRooms[0]!.participantPlayerIds)).toEqual(new Set(['lawyer', 'd1', 'd2']));
    expect(coordinator.getOwnConsultations('judge')).toEqual([]);

    const updated = coordinator.appendConsultationNote('d1', lawyerRooms[0]!.id, 'لا تذكر سبب الدخول الآن');
    expect(updated?.notes[0]?.authorPlayerId).toBe('d1');
    expect(vault.getConsultation('judge', lawyerRooms[0]!.id)).toBeNull();
  });

  it('reports an optional disconnected participant as a warning, not a hard blocker', () => {
    const vault = new PrivateCaseVault();
    vault.setPlayerBrief('judge', brief('judge', 'judge'));
    vault.setPlayerBrief('optional-witness', brief('optional-witness', 'witness'));

    const coordinator = new PreparationCoordinator({
      participants: [participant('judge', 'judge'), participant('optional-witness', 'witness', false)],
      defenseRepresentations: [],
      vault,
      isConnected: (playerId) => playerId !== 'optional-witness',
    });
    coordinator.start();

    const readiness = coordinator.getReadiness();
    expect(readiness.hardBlockers).toHaveLength(0);
    expect(readiness.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'OPTIONAL_PARTICIPANT_DISCONNECTED' })]),
    );
  });

  it('updates retained notes only for preparation participants and locks them on opening', () => {
    const vault = new PrivateCaseVault();
    vault.setPlayerBrief('defendant', brief('defendant', 'defendant', 2));

    const coordinator = new PreparationCoordinator({
      participants: [participant('defendant', 'defendant')],
      defenseRepresentations: [{ id: 'self', defendantPlayerIds: ['defendant'], selfRepresented: true }],
      vault,
      isConnected: () => true,
    });
    coordinator.start();

    expect(coordinator.setRetainedNotes('defendant', ['وصلت 9:15', 'لا تخمّن الوقت'])).toEqual(
      expect.objectContaining({ ok: true }),
    );
    coordinator.markReady('defendant', true);
    expect(coordinator.attemptOpenCourt(false).opened).toBe(true);
    expect(vault.setRetainedNotes('defendant', ['تغيير بعد الافتتاح'])).toEqual(
      expect.objectContaining({ ok: false, code: 'RETAINED_NOTES_LOCKED' }),
    );
  });
});
