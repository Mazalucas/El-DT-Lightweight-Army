import type { CerebroStore, Person } from '../shared/types.js';
import { normalizePersonNameKey } from '../core/profesional/person-name-clean.js';
import { isValidContact } from '../core/profesional/merge-person-incremental.js';

export interface ProspectCandidate {
  personId: string;
  displayName: string;
  emails: string[];
  score: number;
  sharedMeetings: number;
}

export function rankProspectLinkCandidates(
  store: CerebroStore,
  prospectId: string,
  limit = 8,
): ProspectCandidate[] {
  const prospect = store.prospects.find((p) => p.id === prospectId);
  if (!prospect) return [];

  const prospectKey = normalizePersonNameKey(prospect.displayName);
  const prospectMeetings = new Set(prospect.meetingIds);

  const scored: ProspectCandidate[] = [];
  for (const person of store.people.filter(isValidContact)) {
    let score = 0;
    const names = [person.displayName, ...person.aliases];
    for (const n of names) {
      const key = normalizePersonNameKey(n);
      if (key === prospectKey) score += 50;
      else if (key.includes(prospectKey) || prospectKey.includes(key)) score += 25;
    }

    let sharedMeetings = 0;
    for (const m of store.meetings) {
      if (!m.personIds.includes(person.id)) continue;
      if (prospectMeetings.has(m.id) || m.prospectIds?.includes(prospectId)) sharedMeetings++;
    }
    score += sharedMeetings * 10;

    if (score > 0) {
      scored.push({
        personId: person.id,
        displayName: person.displayName,
        emails: person.emails ?? [],
        score,
        sharedMeetings,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score || b.sharedMeetings - a.sharedMeetings).slice(0, limit);
}

export function findPersonByNormalizedName(store: CerebroStore, name: string): Person | undefined {
  const key = normalizePersonNameKey(name);
  return store.people.find((p) => {
    const names = [p.displayName, ...p.aliases];
    return names.some((n) => normalizePersonNameKey(n) === key);
  });
}
