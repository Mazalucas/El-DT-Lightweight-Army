import { cleanChipPersonName, isChipLabelVariant, normalizePersonNameKey, personNameCandidates, pickPersonDisplayName, } from './person-name-clean.js';
import { slugId } from './parse-mirror-md.js';
export { cleanChipPersonName, normalizePersonNameKey as normalizePersonName };
function normalizeEmail(email) {
    return email.toLowerCase().trim();
}
function emptyPerson(id, displayName) {
    return {
        id,
        displayName,
        aliases: [],
        teamIds: [],
        projectIds: [],
        emails: [],
        emailMeta: {},
    };
}
export class PersonResolver {
    people = new Map();
    emailIndex = new Map();
    nameIndex = new Map();
    constructor(existing) {
        for (const p of existing) {
            const normalized = this.normalizeStoredPerson(p);
            this.people.set(normalized.id, normalized);
            this.indexPerson(normalized);
        }
    }
    getAll() {
        return [...this.people.values()];
    }
    resolve(signal) {
        const email = signal.email ? normalizeEmail(signal.email) : undefined;
        const rawName = signal.name?.trim();
        const seenAt = signal.seenAt ?? new Date().toISOString();
        if (!email) {
            return null;
        }
        const byEmail = this.emailIndex.get(email);
        if (byEmail) {
            this.attachEmail(byEmail, email, signal.source, seenAt);
            if (rawName) {
                this.maybeAddAlias(byEmail, rawName);
                this.maybeUpgradeDisplayName(byEmail, rawName);
            }
            return byEmail;
        }
        const nameMatch = rawName ? this.findByNameCandidates(rawName) : undefined;
        if (nameMatch) {
            this.attachEmail(nameMatch, email, signal.source, seenAt);
            if (rawName)
                this.maybeAddAlias(nameMatch, rawName);
            return nameMatch;
        }
        const displayName = pickPersonDisplayName(rawName, email);
        return this.createPerson(displayName, email, signal.source, seenAt, rawName);
    }
    normalizeStoredPerson(p) {
        const emails = [...new Set((p.emails ?? []).map(normalizeEmail).filter(Boolean))];
        return {
            ...p,
            emails,
            emailMeta: p.emailMeta ?? {},
            projectIds: p.projectIds ?? [],
            teamIds: p.teamIds ?? [],
            aliases: p.aliases ?? [],
        };
    }
    indexPerson(p) {
        for (const candidate of personNameCandidates(p.displayName)) {
            this.nameIndex.set(normalizePersonNameKey(candidate), p.id);
        }
        for (const a of p.aliases) {
            for (const candidate of personNameCandidates(a)) {
                this.nameIndex.set(normalizePersonNameKey(candidate), p.id);
            }
        }
        for (const email of p.emails) {
            this.emailIndex.set(email, p.id);
        }
    }
    /** Si el nombre termina en un contacto ya indexado (p. ej. "Notion Lucas Mazalan" → "Lucas Mazalan"). */
    findBySuffixName(incoming) {
        const norm = normalizePersonNameKey(incoming);
        let best;
        for (const [key, id] of this.nameIndex) {
            const wordCount = key.split(/\s+/).filter(Boolean).length;
            if (wordCount < 2)
                continue;
            if (norm === key || norm.endsWith(` ${key}`)) {
                if (!best || key.length > best.len)
                    best = { id, len: key.length };
            }
        }
        return best?.id;
    }
    findByAmbiguousFirstName(firstName) {
        const needle = normalizePersonNameKey(firstName);
        const matches = new Set();
        for (const [key, id] of this.nameIndex) {
            const parts = key.split(/\s+/).filter(Boolean);
            if (parts.length >= 2 && parts[0] === needle)
                matches.add(id);
        }
        if (matches.size === 1)
            return [...matches][0];
        return undefined;
    }
    findByNameCandidates(rawName) {
        for (const candidate of personNameCandidates(rawName)) {
            const id = this.nameIndex.get(normalizePersonNameKey(candidate));
            if (id)
                return id;
        }
        const cleaned = cleanChipPersonName(rawName);
        const bySuffix = this.findBySuffixName(cleaned);
        if (bySuffix)
            return bySuffix;
        const words = cleaned.split(/\s+/).filter(Boolean);
        if (words.length === 1) {
            return this.findByAmbiguousFirstName(words[0]);
        }
        return undefined;
    }
    attachEmail(personId, email, source, seenAt) {
        const p = this.people.get(personId);
        if (!p)
            return;
        const emails = p.emails.includes(email) ? p.emails : [...p.emails, email];
        const meta = { ...(p.emailMeta ?? {}) };
        const prev = meta[email] ?? { sources: [] };
        meta[email] = {
            sources: [...new Set([...prev.sources, source])],
            firstSeenAt: prev.firstSeenAt ?? seenAt,
            lastSeenAt: seenAt,
        };
        this.people.set(personId, { ...p, emails, emailMeta: meta });
        this.emailIndex.set(email, personId);
    }
    maybeUpgradeDisplayName(personId, rawName) {
        const p = this.people.get(personId);
        if (!p)
            return;
        const cleaned = cleanChipPersonName(rawName);
        const currentClean = cleanChipPersonName(p.displayName);
        if (!isChipLabelVariant(p.displayName, currentClean))
            return;
        if (cleaned.length < 2)
            return;
        if (normalizePersonNameKey(cleaned) === normalizePersonNameKey(currentClean))
            return;
        const oldName = p.displayName;
        this.people.set(personId, { ...p, displayName: cleaned });
        for (const candidate of personNameCandidates(cleaned)) {
            this.nameIndex.set(normalizePersonNameKey(candidate), personId);
        }
        this.maybeAddAlias(personId, oldName);
        if (normalizePersonNameKey(rawName) !== normalizePersonNameKey(cleaned)) {
            this.maybeAddAlias(personId, rawName);
        }
    }
    maybeAddAlias(personId, name) {
        let p = this.people.get(personId);
        if (!p)
            return;
        const cleaned = cleanChipPersonName(name);
        for (const variant of [name, cleaned]) {
            if (!variant)
                continue;
            if (normalizePersonNameKey(variant) === normalizePersonNameKey(p.displayName))
                continue;
            if (p.aliases.some((a) => normalizePersonNameKey(a) === normalizePersonNameKey(variant))) {
                continue;
            }
            p = { ...p, aliases: [...p.aliases, variant] };
            this.people.set(personId, p);
            for (const candidate of personNameCandidates(variant)) {
                this.nameIndex.set(normalizePersonNameKey(candidate), personId);
            }
        }
    }
    createPerson(displayName, email, source, seenAt, rawAlias) {
        let id = slugId(email);
        if (this.people.has(id)) {
            id = `${id}-${this.people.size + 1}`;
        }
        const person = emptyPerson(id, displayName.trim());
        this.people.set(id, person);
        for (const candidate of personNameCandidates(displayName)) {
            this.nameIndex.set(normalizePersonNameKey(candidate), id);
        }
        if (email)
            this.attachEmail(id, email, source, seenAt);
        if (rawAlias && normalizePersonNameKey(rawAlias) !== normalizePersonNameKey(displayName)) {
            this.maybeAddAlias(id, rawAlias);
        }
        return id;
    }
}
/** Etiquetas de sección que Meet/Gemini a veces formatean como "Título:" al inicio de línea. */
export const TRANSCRIPT_LABEL_BLOCKLIST = new Set([
    'próximos pasos',
    'proximos pasos',
    'detalles',
    'sugerencias',
    'resumen',
    'transcripción',
    'transcripcion',
    'notas',
    'participantes',
    'asistentes',
    'invitados',
    'temas tratados',
    'action items',
    'summary',
    'details',
    'suggestions',
    'transcript',
]);
export function isLikelyTranscriptSpeaker(name) {
    const trimmed = cleanChipPersonName(name);
    if (trimmed.length < 2 || trimmed.length >= 80)
        return false;
    const key = normalizePersonNameKey(trimmed);
    if (TRANSCRIPT_LABEL_BLOCKLIST.has(key))
        return false;
    if (/^\d/.test(trimmed))
        return false;
    return true;
}
export function extractTranscriptSpeakers(text) {
    const names = new Set();
    const re = /^([A-Za-zÁÉÍÓÚÑáéíóúñ][^\n:]{0,70}?):\s+/gm;
    let m;
    while ((m = re.exec(text)) !== null) {
        const name = cleanChipPersonName(m[1].trim());
        if (isLikelyTranscriptSpeaker(name))
            names.add(name);
    }
    return [...names];
}
/** Email primero — evita crear contactos duplicados solo por etiquetas de chip. */
export function prioritizePersonSignals(signals) {
    const rank = (s) => {
        if (s.email)
            return 0;
        if (s.source === 'participant')
            return 1;
        if (s.source === 'invite' || s.source === 'drive' || s.source === 'owner')
            return 2;
        return 3;
    };
    return [...signals].sort((a, b) => rank(a) - rank(b));
}
export function collectSignalsFromMirror(parsed) {
    const signals = [];
    const push = (s) => signals.push(s);
    const participantSet = new Set();
    const registerParticipant = (raw) => {
        const cleaned = cleanChipPersonName(raw);
        if (cleaned)
            participantSet.add(cleaned);
    };
    for (const name of parsed.participants)
        registerParticipant(name);
    for (const name of parsed.participantNames)
        registerParticipant(name);
    for (const name of participantSet) {
        push({ name, source: 'participant' });
    }
    for (const inv of parsed.invitees) {
        push({
            name: inv.name ? cleanChipPersonName(inv.name) : undefined,
            email: inv.email,
            source: 'invite',
        });
    }
    for (const email of parsed.mentionedEmails) {
        if (email.includes('@'))
            push({ email, source: 'mention' });
    }
    for (const s of parsed.sharedWith) {
        push({
            name: s.name ? cleanChipPersonName(s.name) : undefined,
            email: s.email,
            source: 'drive',
        });
    }
    if (parsed.ownerEmail) {
        push({ email: parsed.ownerEmail, source: 'owner' });
    }
    const transcript = extractTranscriptSection(parsed.body);
    for (const name of extractTranscriptSpeakers(transcript)) {
        push({ name, source: 'transcript' });
    }
    return prioritizePersonSignals(signals);
}
export function extractTranscriptSection(body) {
    const re = /##\s*Transcripci[oó]n[\s\S]*?(?=\n##\s|$)/i;
    const m = body.match(re);
    return m ? m[0] : body;
}
