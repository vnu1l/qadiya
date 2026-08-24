import { MapSchema, Schema, type } from '@colyseus/schema';
import type {
  AssignableRole,
  CaseCommitment,
  CourtPhase,
  DefenseSelectionMethod,
  DefendantSelectionMethod,
  JudgeSelectionMethod,
  LobbyRules,
  PlayerRole,
  RolePreference,
  SessionKind,
} from '@qadiya/shared';

export class RolePreferenceState extends Schema {
  @type('string') role: AssignableRole = 'witness';
  @type('boolean') accepted = false;
  @type('number') priority = 0;
  @type('boolean') allowAutomaticAssignment = false;
}

export class PlayerState extends Schema {
  @type('string') displayName = 'لاعب';
  @type('string') role: PlayerRole = 'unassigned';
  @type('boolean') connected = true;
  @type('boolean') ready = false;
  @type('boolean') requestedFloor = false;
  @type({ map: RolePreferenceState }) rolePreferences = new MapSchema<RolePreferenceState>();
}

export class LobbyRulesState extends Schema {
  @type('string') sessionKind: SessionKind = 'casual';
  @type('number') minPlayers = 6;
  @type('number') maxPlayers = 10;
  @type('string') commitment: CaseCommitment = 'standard';
  @type('string') defendantSelection: DefendantSelectionMethod = 'weighted-system';
  @type('string') judgeSelection: JudgeSelectionMethod = 'candidate-vote';
  @type('string') defenseSelection: DefenseSelectionMethod = 'defendant-choice';
  @type('boolean') allowMultipleDefendants = true;
  @type('number') maxDefendants = 3;
  @type('boolean') allowCrossDefendantContradictions = true;
  @type('boolean') allowSystemCharacters = false;
}

export class CourtState extends Schema {
  @type('string') phase: CourtPhase = 'lobby';
  @type('string') currentSpeakerId = '';
  @type('string') hostSessionId = '';
  @type(LobbyRulesState) rules = new LobbyRulesState();
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}

export function applyLobbyRulesState(target: LobbyRulesState, rules: LobbyRules): void {
  target.sessionKind = rules.sessionKind;
  target.minPlayers = rules.minPlayers;
  target.maxPlayers = rules.maxPlayers;
  target.commitment = rules.commitment;
  target.defendantSelection = rules.defendantSelection;
  target.judgeSelection = rules.judgeSelection;
  target.defenseSelection = rules.defenseSelection;
  target.allowMultipleDefendants = rules.allowMultipleDefendants;
  target.maxDefendants = rules.maxDefendants;
  target.allowCrossDefendantContradictions = rules.allowCrossDefendantContradictions;
  target.allowSystemCharacters = rules.allowSystemCharacters;
}

export function lobbyRulesFromState(source: LobbyRulesState): LobbyRules {
  return {
    sessionKind: source.sessionKind,
    minPlayers: source.minPlayers,
    maxPlayers: source.maxPlayers,
    commitment: source.commitment,
    defendantSelection: source.defendantSelection,
    judgeSelection: source.judgeSelection,
    defenseSelection: source.defenseSelection,
    allowMultipleDefendants: source.allowMultipleDefendants,
    maxDefendants: source.maxDefendants,
    allowCrossDefendantContradictions: source.allowCrossDefendantContradictions,
    allowSystemCharacters: source.allowSystemCharacters,
  };
}

export function applyRolePreferencesState(target: PlayerState, preferences: readonly RolePreference[]): void {
  target.rolePreferences.clear();

  for (const preference of preferences) {
    const state = new RolePreferenceState();
    state.role = preference.role;
    state.accepted = preference.accepted;
    state.priority = preference.priority;
    state.allowAutomaticAssignment = preference.allowAutomaticAssignment;
    target.rolePreferences.set(preference.role, state);
  }
}
