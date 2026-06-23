import Fuse from 'fuse.js';
import type { Meeting, Person, Project, SearchFilters, Team } from './models';
import { meetingInvolvesPerson } from './meeting-participation';

export interface SearchHit {
  meeting: Meeting;
  score?: number;
}

export function searchMeetings(
  meetings: Meeting[],
  people: Person[],
  teams: Team[],
  projects: Project[],
  filters: SearchFilters,
): SearchHit[] {
  let list = [...meetings];

  if (filters.teamId) {
    list = list.filter((m) => m.teamIds.includes(filters.teamId!));
  }
  if (filters.projectId) {
    list = list.filter((m) => m.projectIds.includes(filters.projectId!));
  }
  if (filters.personId) {
    const person = people.find((p) => p.id === filters.personId);
    list = person
      ? list.filter((m) => meetingInvolvesPerson(m, person))
      : list.filter((m) => m.personIds.includes(filters.personId!));
  }

  if (!filters.q?.trim()) {
    return list
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
      .map((meeting) => ({ meeting }));
  }

  const peopleById = new Map(people.map((p) => [p.id, p]));
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  const enriched = list.map((m) => ({
    ...m,
    searchBlob: [
      ...m.teamIds.map((id) => teamsById.get(id)?.name),
      ...m.projectIds.map((id) => projectsById.get(id)?.name),
      ...m.personIds.map((id) => peopleById.get(id)?.displayName),
    ]
      .filter(Boolean)
      .join(' '),
  }));

  const f = new Fuse(enriched, {
    keys: [
      { name: 'title', weight: 0.35 },
      { name: 'summary', weight: 0.25 },
      { name: 'participants', weight: 0.2 },
      { name: 'bodyPreview', weight: 0.35 },
      { name: 'searchBlob', weight: 0.05 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  return f.search(filters.q.trim()).map((r) => ({
    meeting: r.item as Meeting,
    score: r.score,
  }));
}
