import { cleanChipPersonName, normalizePersonNameKey } from './person-name-clean.js';
import { slugId } from './parse-mirror-md.js';
export class ProspectResolver {
    prospects = new Map();
    nameIndex = new Map();
    constructor(existing = []) {
        for (const p of existing) {
            if (p.linkedPersonId)
                continue;
            this.prospects.set(p.id, { ...p });
            this.indexProspect(p);
        }
    }
    getAll() {
        return [...this.prospects.values()];
    }
    record(name, meetingId, source, rawLabel) {
        const displayName = cleanChipPersonName(name);
        if (!displayName || displayName.length < 2)
            return '';
        const key = normalizePersonNameKey(displayName);
        let id = this.nameIndex.get(key);
        if (!id) {
            id = slugId(displayName);
            if (this.prospects.has(id))
                id = `${id}-${this.prospects.size + 1}`;
            const prospect = {
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
        const p = this.prospects.get(id);
        const meetingIds = p.meetingIds.includes(meetingId)
            ? p.meetingIds
            : [...p.meetingIds, meetingId];
        const sources = [...new Set([...(p.sources ?? []), source])];
        const aliases = new Set(p.aliases);
        if (rawLabel && normalizePersonNameKey(rawLabel) !== key)
            aliases.add(rawLabel.trim());
        if (normalizePersonNameKey(name) !== key)
            aliases.add(name.trim());
        this.prospects.set(id, {
            ...p,
            meetingIds,
            sources,
            aliases: [...aliases],
            lastSeenAt: new Date().toISOString(),
        });
        return id;
    }
    indexProspect(p) {
        this.nameIndex.set(normalizePersonNameKey(p.displayName), p.id);
        for (const a of p.aliases) {
            this.nameIndex.set(normalizePersonNameKey(cleanChipPersonName(a)), p.id);
        }
    }
}
