import type { Person } from './models';
import { slugId } from './parse-mirror-md';
import {
  cleanChipPersonName,
  isChipLabelVariant,
  normalizePersonNameKey,
} from './person-name-clean';

export interface ConsolidatePeopleResult {
  people: Person[];
  /** id viejo → id canónico (incluye identidad). */
  idRemap: Map<string, string>;
}

function personScore(p: Person): number {
  let score = 0;
  score += (p.emails?.length ?? 0) * 100;
  const cleaned = cleanChipPersonName(p.displayName);
  if (!isChipLabelVariant(p.displayName, cleaned)) score += 50;
  score += cleaned.split(/\s+/).filter(Boolean).length * 10;
  score += (p.teamIds?.length ?? 0) * 5;
  return score;
}

function pickCanonical(a: Person, b: Person): Person {
  return personScore(a) >= personScore(b) ? a : b;
}

function mergeInto(target: Person, source: Person): Person {
  const aliases = new Set(target.aliases);
  if (source.displayName !== target.displayName) aliases.add(source.displayName);
  for (const a of source.aliases) aliases.add(a);
  aliases.delete(target.displayName);

  const teamIds = [...new Set([...target.teamIds, ...source.teamIds])];
  const projectIds = [...new Set([...(target.projectIds ?? []), ...(source.projectIds ?? [])])];
  const emails = [...new Set([...(target.emails ?? []), ...(source.emails ?? [])])];
  const emailMeta = { ...(target.emailMeta ?? {}) };
  for (const [e, meta] of Object.entries(source.emailMeta ?? {})) {
    const prev = emailMeta[e];
    emailMeta[e] = prev
      ? {
          sources: [...new Set([...prev.sources, ...meta.sources])],
          firstSeenAt: prev.firstSeenAt ?? meta.firstSeenAt,
          lastSeenAt: meta.lastSeenAt ?? prev.lastSeenAt,
        }
      : meta;
  }

  const cleanedTarget = cleanChipPersonName(target.displayName);
  const cleanedSource = cleanChipPersonName(source.displayName);
  const displayName =
    personScore({ ...target, displayName: cleanedTarget }) >=
    personScore({ ...source, displayName: cleanedSource })
      ? cleanedTarget
      : cleanedSource;

  return {
    ...target,
    displayName,
    aliases: [...aliases],
    teamIds,
    projectIds,
    emails,
    emailMeta,
    notes: target.notes ?? source.notes,
  };
}

class UnionFind {
  parent = new Map<string, string>();

  find(id: string): string {
    const parent = this.parent.get(id) ?? id;
    if (parent === id) {
      this.parent.set(id, id);
      return id;
    }
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }
}

/** Une duplicados (chips Gemini, alias, mismo email) antes de reindexar. */
export function consolidatePeopleRecords(people: Person[]): ConsolidatePeopleResult {
  if (people.length === 0) return { people: [], idRemap: new Map() };

  const byId = new Map(people.map((p) => [p.id, { ...p }]));
  const uf = new UnionFind();
  for (const p of people) uf.find(p.id);

  const unionPeople = (a: string, b: string) => {
    if (a === b) return;
    uf.union(a, b);
  };

  const emailOwner = new Map<string, string>();
  const cleanNameOwner = new Map<string, string>();

  for (const p of people) {
    for (const email of p.emails ?? []) {
      const key = email.toLowerCase();
      const existing = emailOwner.get(key);
      if (existing) unionPeople(p.id, existing);
      else emailOwner.set(key, p.id);
    }

    for (const label of [p.displayName, ...(p.aliases ?? [])]) {
      const cleaned = cleanChipPersonName(label);
      const nameKey = normalizePersonNameKey(cleaned);
      const wordCount = nameKey.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 2) {
        const existing = cleanNameOwner.get(nameKey);
        if (existing) unionPeople(p.id, existing);
        else cleanNameOwner.set(nameKey, p.id);
      }
    }
  }

  // Chip de 1 palabra ("Notion Lucas" → "Lucas") → contacto con mismo nombre de pila.
  for (const p of people) {
    const cleaned = cleanChipPersonName(p.displayName);
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length !== 1) continue;
    if (!isChipLabelVariant(p.displayName, cleaned)) continue;
    const first = normalizePersonNameKey(words[0]);
    const matches = new Set<string>();
    for (const [key, id] of cleanNameOwner) {
      if (key.startsWith(`${first} `)) matches.add(uf.find(id));
    }
    if (matches.size === 1) unionPeople(p.id, [...matches][0]);
  }

  const groups = new Map<string, Person[]>();
  for (const p of people) {
    const root = uf.find(p.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(byId.get(p.id)!);
  }

  const idRemap = new Map<string, string>();
  const consolidated: Person[] = [];
  const usedIds = new Set<string>();

  for (const group of groups.values()) {
    let merged = { ...group[0] };
    for (const p of group.slice(1)) {
      const picked = pickCanonical(merged, p);
      const other = picked.id === merged.id ? p : merged;
      merged = mergeInto(picked, other);
    }

    merged = {
      ...merged,
      displayName: cleanChipPersonName(merged.displayName),
      aliases: [
        ...new Set(
          [...merged.aliases, ...group.map((p) => p.displayName)]
            .filter(
              (a) => normalizePersonNameKey(a) !== normalizePersonNameKey(merged.displayName),
            ),
        ),
      ],
    };

    let finalId = slugId(merged.displayName);
    if (usedIds.has(finalId)) {
      finalId = `${finalId}-${usedIds.size + 1}`;
    }
    usedIds.add(finalId);
    merged = { ...merged, id: finalId };

    for (const p of group) idRemap.set(p.id, finalId);
    consolidated.push(merged);
  }

  return { people: consolidated, idRemap };
}

export function remapPersonIds(personIds: string[], idRemap: Map<string, string>): string[] {
  return [...new Set(personIds.map((id) => idRemap.get(id) ?? id))];
}

export function shouldKeepPerson(p: Person, usedPersonIds: Set<string>): boolean {
  if (usedPersonIds.has(p.id)) return true;
  if ((p.teamIds?.length ?? 0) > 0) return true;
  if ((p.projectIds?.length ?? 0) > 0) return true;
  if (p.notes?.trim()) return true;
  return false;
}
