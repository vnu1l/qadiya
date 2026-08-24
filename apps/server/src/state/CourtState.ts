import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import type {
  AssignableRole,
  CaseCommitment,
  CourtPhase,
  DefenseSelectionMethod,
  DefendantSelectionMethod,
  DefenseRepresentationPlan,
  JudgeSelectionMethod,
  LobbyRules,
  PlayerRole,
  PreparationPublicSnapshot,
  PreparationStage,
  RoleAllocationPublicSnapshot,
  RoleAllocationStage,
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
  @type('boolean') allowSelfRepresentation = false;
}

export class DefenseRepresentationState extends Schema {
  @type('string') lawyerSessionId = '';
  @type('boolean') selfRepresented = false;
  @type(['string']) defendantSessionIds = new ArraySchema<string>();
}

export class PendingDefenseRequestState extends Schema {
  @type('string') defendantSessionId = '';
  @type('string') lawyerSessionId = '';
}

export class RoleAllocationState extends Schema {
  @type('string') stage: RoleAllocationStage = 'not-started';
  @type(['string']) defendantSessionIds = new ArraySchema<string>();
  @type(['string']) judgeCandidateSessionIds = new ArraySchema<string>();
  @type('string') judgeSessionId = '';
  @type('string') prosecutionSessionId = '';
  @type('number') requiredDefenseLawyerCount = 0;
  @type({ map: PendingDefenseRequestState }) pendingDefenseRequests = new MapSchema<PendingDefenseRequestState>();
}

export class PreparationState extends Schema {
  @type('string') stage: PreparationStage = 'inactive';
  @type(['string']) participantSessionIds = new ArraySchema<string>();
  @type(['string']) readySessionIds = new ArraySchema<string>();
  @type('number') hardBlockerCount = 0;
  @type('number') warningCount = 0;
}

export class CourtState extends Schema {
  @type('string') phase: CourtPhase = 'lobby';
  @type('string') currentSpeakerId = '';
  @type('string') hostSessionId = '';
  @type(LobbyRulesState) rules = new LobbyRulesState();
  @type(RoleAllocationState) roleAllocation = new RoleAllocationState();
  @type(PreparationState) preparation = new PreparationState();
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: DefenseRepresentationState }) defenseRepresentations = new MapSchema<DefenseRepresentationState>();
}

function replaceStringArray(target: ArraySchema<string>, values: readonly string[]): void {
  target.splice(0, target.length);
  target.push(...values);
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
  target.allowSelfRepresentation = rules.allowSelfRepresentation;
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
    allowSelfRepresentation: source.allowSelfRepresentation,
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

export function applyDefenseRepresentationState(
  target: MapSchema<DefenseRepresentationState>,
  representations: readonly DefenseRepresentationPlan[],
): void {
  target.clear();

  for (const representation of representations) {
    const state = new DefenseRepresentationState();
    state.lawyerSessionId = representation.lawyerPlayerId ?? '';
    state.selfRepresented = representation.selfRepresented;
    state.defendantSessionIds.push(...representation.defendantPlayerIds);
    target.set(representation.id, state);
  }
}

export function applyRoleAllocationSnapshot(
  target: RoleAllocationState,
  snapshot: RoleAllocationPublicSnapshot,
): void {
  target.stage = snapshot.stage;
  replaceStringArray(target.defendantSessionIds, snapshot.defendantPlayerIds);
  replaceStringArray(target.judgeCandidateSessionIds, snapshot.judgeCandidateIds);
  target.judgeSessionId = snapshot.judgePlayerId ?? '';
  target.prosecutionSessionId = snapshot.prosecutionPlayerId ?? '';
  target.requiredDefenseLawyerCount = snapshot.requiredDefenseLawyerCount;
  target.pendingDefenseRequests.clear();

  for (const request of snapshot.pendingDefenseRequests) {
    const state = new PendingDefenseRequestState();
    state.defendantSessionId = request.defendantPlayerId;
    state.lawyerSessionId = request.lawyerPlayerId;
    target.pendingDefenseRequests.set(request.defendantPlayerId, state);
  }
}

export function resetRoleAllocationState(target: RoleAllocationState): void {
  target.stage = 'not-started';
  target.defendantSessionIds.splice(0, target.defendantSessionIds.length);
  target.judgeCandidateSessionIds.splice(0, target.judgeCandidateSessionIds.length);
  target.judgeSessionId = '';
  target.prosecutionSessionId = '';
  target.requiredDefenseLawyerCount = 0;
  target.pendingDefenseRequests.clear();
}

export function applyPreparationSnapshot(target: PreparationState, snapshot: PreparationPublicSnapshot): void {
  target.stage = snapshot.stage;
  replaceStringArray(target.participantSessionIds, snapshot.participantPlayerIds);
  replaceStringArray(target.readySessionIds, snapshot.readyPlayerIds);
  target.hardBlockerCount = snapshot.hardBlockerCount;
  target.warningCount = snapshot.warningCount;
}

export function resetPreparationState(target: PreparationState): void {
  target.stage = 'inactive';
  target.participantSessionIds.splice(0, target.participantSessionIds.length);
  target.readySessionIds.splice(0, target.readySessionIds.length);
  target.hardBlockerCount = 0;
  target.warningCount = 0;
}
