import type {
  CaseBlueprint,
  KnowledgePrecision,
  RoleEngagement,
  TimelineEvent,
  TravelLink,
} from './model';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  entityId?: string;
}

const PRECISION_RANK: Readonly<Record<KnowledgePrecision, number>> = {
  exact: 0,
  'narrow-range': 1,
  approximate: 2,
  vague: 3,
};

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

interface TravelEdge {
  to: string;
  minutes: number;
}

function buildTravelGraph(links: readonly TravelLink[]): Map<string, TravelEdge[]> {
  const graph = new Map<string, TravelEdge[]>();

  const addEdge = (from: string, to: string, minutes: number) => {
    const edges = graph.get(from) ?? [];
    edges.push({ to, minutes });
    graph.set(from, edges);
  };

  for (const link of links) {
    addEdge(link.fromLocationId, link.toLocationId, link.minTravelMinutes);
    if (link.bidirectional) addEdge(link.toLocationId, link.fromLocationId, link.minTravelMinutes);
  }

  return graph;
}

function shortestTravelMinutes(graph: Map<string, TravelEdge[]>, from: string, to: string): number | null {
  if (from === to) return 0;

  const distances = new Map<string, number>([[from, 0]]);
  const visited = new Set<string>();

  while (true) {
    let current: string | undefined;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const [node, distance] of distances) {
      if (!visited.has(node) && distance < currentDistance) {
        current = node;
        currentDistance = distance;
      }
    }

    if (current === undefined) return null;
    if (current === to) return currentDistance;

    visited.add(current);
    for (const edge of graph.get(current) ?? []) {
      const candidate = currentDistance + edge.minutes;
      if (candidate < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, candidate);
      }
    }
  }
}

function eventEnd(event: TimelineEvent): number {
  return event.endMinute ?? event.startMinute;
}

function validateActorTravel(caseFile: CaseBlueprint, issues: ValidationIssue[]): void {
  const graph = buildTravelGraph(caseFile.travelLinks);
  const eventsByActor = new Map<string, TimelineEvent[]>();

  for (const event of caseFile.timeline) {
    for (const actorId of event.actorIds) {
      const events = eventsByActor.get(actorId) ?? [];
      events.push(event);
      eventsByActor.set(actorId, events);
    }
  }

  for (const [actorId, events] of eventsByActor) {
    const ordered = [...events].sort((a, b) => a.startMinute - b.startMinute || eventEnd(a) - eventEnd(b));

    for (let index = 0; index < ordered.length - 1; index += 1) {
      const current = ordered[index]!;
      const next = ordered[index + 1]!;
      if (current.locationId === next.locationId) continue;

      const currentEnd = eventEnd(current);
      if (next.startMinute < currentEnd) {
        issues.push({
          severity: 'error',
          code: 'ACTOR_OVERLAPPING_LOCATIONS',
          message: `Actor ${actorId} is in ${current.locationId} and ${next.locationId} at overlapping times.`,
          entityId: actorId,
        });
        continue;
      }

      const requiredTravel = shortestTravelMinutes(graph, current.locationId, next.locationId);
      if (requiredTravel === null) {
        issues.push({
          severity: 'error',
          code: 'ACTOR_LOCATION_UNREACHABLE',
          message: `Actor ${actorId} has no defined route from ${current.locationId} to ${next.locationId}.`,
          entityId: actorId,
        });
        continue;
      }

      const availableTravel = next.startMinute - currentEnd;
      if (availableTravel < requiredTravel) {
        issues.push({
          severity: 'error',
          code: 'ACTOR_TRAVEL_IMPOSSIBLE',
          message: `Actor ${actorId} has ${availableTravel} minutes to travel from ${current.locationId} to ${next.locationId}, but the minimum is ${requiredTravel}.`,
          entityId: actorId,
        });
      }
    }
  }
}

export function validateCaseBlueprint(caseFile: CaseBlueprint): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const characterIds = new Set(caseFile.characters.map((character) => character.id));
  const factIds = new Set(caseFile.facts.map((fact) => fact.id));
  const locationIds = new Set(caseFile.locations.map((location) => location.id));
  const timelineIds = new Set(caseFile.timeline.map((event) => event.id));

  const collections = [
    ['character', caseFile.characters],
    ['fact', caseFile.facts],
    ['location', caseFile.locations],
    ['travel-link', caseFile.travelLinks],
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

  for (const link of caseFile.travelLinks) {
    if (!locationIds.has(link.fromLocationId) || !locationIds.has(link.toLocationId)) {
      issues.push({
        severity: 'error',
        code: 'TRAVEL_UNKNOWN_LOCATION',
        message: `Travel link ${link.id} references an unknown location.`,
        entityId: link.id,
      });
    }

    if (!Number.isFinite(link.minTravelMinutes) || link.minTravelMinutes < 0) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TRAVEL_TIME',
        message: `Travel link ${link.id} must have a non-negative finite travel time.`,
        entityId: link.id,
      });
    }
  }

  for (const event of caseFile.timeline) {
    if (!locationIds.has(event.locationId)) {
      issues.push({
        severity: 'error',
        code: 'TIMELINE_UNKNOWN_LOCATION',
        message: `Timeline event ${event.id} references unknown location ${event.locationId}.`,
        entityId: event.id,
      });
    }

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

  validateActorTravel(caseFile, issues);

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

    if (PRECISION_RANK[item.precision] < PRECISION_RANK[item.source.precisionLimit]) {
      issues.push({
        severity: 'error',
        code: 'KNOWLEDGE_EXCEEDS_SOURCE_PRECISION',
        message: `Knowledge ${item.id} is ${item.precision}, but its source only supports ${item.source.precisionLimit}.`,
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
