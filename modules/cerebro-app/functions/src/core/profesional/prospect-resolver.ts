import type { EmailSource, PersonProspect } from './types.js';
import { cleanChipPersonName, isLikelyPersonName, normalizePersonNameKey, personNameCandidates } from './person-name-clean.js';
import { slugId } from './parse-mirror-md.js';

export class ProspectResolver {
  private prospects = new Map<string, PersonProspect>();
  private nameIndex = new Map<string, string>();
  private dismissedKeys: Set<string>;
  private dismissedIds: Set<string>;

  constructor(
    existing: PersonProspect[] = [],
    dismissedKeys: Iterable<string> = [],
    dismissedIds: Iterable<string> = [],
  ) {
    this.dismissedKeys = new Set(dismissedKeys);
    this.dismissedIds = new Set(dismissedIds);
    for (const p of existing) {
      if (p.linkedPersonId) continue;
      this.prospects.set(p.id, { ...p });
      this.indexProspect(p);
    }
  }

  getAll(): PersonProspect[] {
    return [...this.prospects.values()];
  }

  record(name: string, meetingId: string, source: EmailSource, rawLabel?: string): string {
    const displayName = cleanChipPersonName(name);
    if (!displayName || !isLikelyPersonName(displayName)) return '';

    for (const candidate of personNameCandidates(name)) {
      const candidateKey = normalizePersonNameKey(cleanChipPersonName(candidate));
      if (candidateKey && this.dismissedKeys.has(candidateKey)) return '';
    }

    const key = normalizePersonNameKey(displayName);
    let id = this.nameIndex.get(key);
    if (!id) {
      id = slugId(displayName);
      if (this.prospects.has(id)) id = `${id}-${this.prospects.size + 1}`;
      if (this.dismissedIds.has(id)) return '';
      const prospect: PersonProspect = {
        id,
        displayName,
        aliases: [],
        meetingIds: [],
        sources: [],
        lastSeenAt: new Date().toISOString(),
      };
      this.prospects.set(id, prospect);
      this.indexProspect(prospect);
    }

    if (this.dismissedIds.has(id)) return '';

    const p = this.prospects.get(id)!;
    const meetingIds = p.meetingIds.includes(meetingId)
      ? p.meetingIds
      : [...p.meetingIds, meetingId];
    const sources = [...new Set([...(p.sources ?? []), source])];
    const aliases = new Set(p.aliases);
    if (rawLabel && normalizePersonNameKey(rawLabel) !== key) aliases.add(rawLabel.trim());
    if (normalizePersonNameKey(name) !== key) aliases.add(name.trim());

    this.prospects.set(id, {
      ...p,
      meetingIds,
      sources,
      aliases: [...aliases],
      lastSeenAt: new Date().toISOString(),
    });
    return id;
  }

  private indexProspect(p: PersonProspect): void {
    this.nameIndex.set(normalizePersonNameKey(p.displayName), p.id);
    for (const a of p.aliases) {
      this.nameIndex.set(normalizePersonNameKey(cleanChipPersonName(a)), p.id);
    }
  }
}
