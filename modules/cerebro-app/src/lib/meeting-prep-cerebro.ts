import type { EntityRef } from '@shared/cerebro-elements.js';
import type {
  MeetingPrepEvidence,
  MeetingPrepFactChip,
  MeetingPrepFactKind,
  MeetingPrepInsight,
} from '@shared/types.js';

const EVIDENCE_PRIORITY: MeetingPrepEvidence['type'][] = ['meeting', 'person', 'todo', 'project'];

export function primaryEvidenceRef(evidence: MeetingPrepEvidence[]): EntityRef | undefined {
  for (const type of EVIDENCE_PRIORITY) {
    const hit = evidence.find((e) => e.type === type);
    if (hit) return { kind: hit.type, id: hit.id };
  }
  return undefined;
}

export function meetingPrepChipPrompt(
  insight: MeetingPrepInsight,
  chip: MeetingPrepFactChip,
): string {
  const title = insight.eventTitle;
  switch (chip.kind) {
    case 'same_people': {
      const names = chip.evidence
        .filter((e) => e.type === 'person')
        .map((e) => e.label)
        .join(', ');
      return `Preparame para «${title}». Quiero entender el contexto de la última vez con ${names || 'estos participantes'}. ¿Qué se habló y qué quedó pendiente?`;
    }
    case 'recurring_series':
      return `Preparame para «${title}». Resumí la última de esta serie y qué debería continuar o seguir hoy.`;
    case 'same_project': {
      const projects = chip.evidence
        .filter((e) => e.type === 'project')
        .map((e) => e.label)
        .join(', ');
      return `Preparame para «${title}». Dame contexto del proyecto ${projects || 'relacionado'} en reuniones previas.`;
    }
    case 'open_commitment':
      return `Preparame para «${title}». Detallá el pendiente «${chip.label.replace(/^Pendiente:\s*/, '')}» y de dónde viene.`;
    default:
      return `Preparame para «${title}». Contexto: ${chip.label}`;
  }
}

export function legacyBulletsToChips(insight: MeetingPrepInsight): MeetingPrepFactChip[] {
  if (insight.factChips?.length) return insight.factChips;
  return (insight.bullets ?? []).map((label, i) => ({
    kind: 'same_people' as MeetingPrepFactKind,
    label,
    evidence: insight.evidence.slice(i, i + 1),
  }));
}
