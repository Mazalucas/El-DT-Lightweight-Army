import type { EmailSource, Person } from './models';
import {
  cleanChipPersonName,
  isChipLabelVariant,
  normalizePersonNameKey,
  personNameCandidates,
  pickPersonDisplayName,
} from './person-name-clean';
import { slugId } from './parse-mirror-md';

export interface PersonSignal {
  name?: string;
  email?: string;
  source: EmailSource;
  seenAt?: string;
}

export { cleanChipPersonName, normalizePersonNameKey as normalizePersonName };

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function emptyPerson(id: string, displayName: string): Person {
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
  private people = new Map<string, Person>();
  private emailIndex = new Map<string, string>();
  private nameIndex = new Map<string, string>();

  constructor(existing: Person[]) {
    for (const p of existing) {
      const normalized = this.normalizeStoredPerson(p);
      this.people.set(normalized.id, normalized);
      this.indexPerson(normalized);
    }
  }

  getAll(): Person[] {
    return [...this.people.values()];
  }

  resolve(signal: PersonSignal): string | null {
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
      if (rawName) this.maybeAddAlias(nameMatch, rawName);
      return nameMatch;
    }

    const displayName = pickPersonDisplayName(rawName, email);
    return this.createPerson(displayName, email, signal.source, seenAt, rawName);
  }

  private normalizeStoredPerson(p: Person): Person {
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

  private indexPerson(p: Person): void {
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
  private findBySuffixName(incoming: string): string | undefined {
    const norm = normalizePersonNameKey(incoming);
    let best: { id: string; len: number } | undefined;

    for (const [key, id] of this.nameIndex) {
      const wordCount = key.split(/\s+/).filter(Boolean).length;
      if (wordCount < 2) continue;
      if (norm === key || norm.endsWith(` ${key}`)) {
        if (!best || key.length > best.len) best = { id, len: key.length };
      }
    }
    return best?.id;
  }

  private findByAmbiguousFirstName(firstName: string): string | undefined {
    const needle = normalizePersonNameKey(firstName);
    const matches = new Set<string>();
    for (const [key, id] of this.nameIndex) {
      const parts = key.split(/\s+/).filter(Boolean);
      if (parts.length >= 2 && parts[0] === needle) matches.add(id);
    }
    if (matches.size === 1) return [...matches][0];
    return undefined;
  }

  private findByNameCandidates(rawName: string): string | undefined {
    for (const candidate of personNameCandidates(rawName)) {
      const id = this.nameIndex.get(normalizePersonNameKey(candidate));
      if (id) return id;
    }
    const cleaned = cleanChipPersonName(rawName);
    const bySuffix = this.findBySuffixName(cleaned);
    if (bySuffix) return bySuffix;
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return this.findByAmbiguousFirstName(words[0]);
    }
    return undefined;
  }

  private attachEmail(
    personId: string,
    email: string,
    source: EmailSource,
    seenAt: string,
  ): void {
    const p = this.people.get(personId);
    if (!p) return;
    const emails = p.emails.includes(email) ? p.emails : [...p.emails, email];
    const meta = { ...(p.emailMeta ?? {}) };
    const prev = meta[email] ?? { sources: [] as EmailSource[] };
    meta[email] = {
      sources: [...new Set([...prev.sources, source])],
      firstSeenAt: prev.firstSeenAt ?? seenAt,
      lastSeenAt: seenAt,
    };
    this.people.set(personId, { ...p, emails, emailMeta: meta });
    this.emailIndex.set(email, personId);
  }

  private maybeUpgradeDisplayName(personId: string, rawName: string): void {
    const p = this.people.get(personId);
    if (!p) return;
    const cleaned = cleanChipPersonName(rawName);
    const currentClean = cleanChipPersonName(p.displayName);
    if (!isChipLabelVariant(p.displayName, currentClean)) return;
    if (cleaned.length < 2) return;
    if (normalizePersonNameKey(cleaned) === normalizePersonNameKey(currentClean)) return;
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

  private maybeAddAlias(personId: string, name: string): void {
    let p = this.people.get(personId);
    if (!p) return;
    const cleaned = cleanChipPersonName(name);
    for (const variant of [name, cleaned]) {
      if (!variant) continue;
      if (normalizePersonNameKey(variant) === normalizePersonNameKey(p.displayName)) continue;
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

  private createPerson(
    displayName: string,
    email: string,
    source: EmailSource,
    seenAt: string,
    rawAlias?: string,
  ): string {
    let id = slugId(email);
    if (this.people.has(id)) {
      id = `${id}-${this.people.size + 1}`;
    }
    const person = emptyPerson(id, displayName.trim());
    this.people.set(id, person);
    for (const candidate of personNameCandidates(displayName)) {
      this.nameIndex.set(normalizePersonNameKey(candidate), id);
    }
    if (email) this.attachEmail(id, email, source, seenAt);
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

export function isLikelyTranscriptSpeaker(name: string): boolean {
  const trimmed = cleanChipPersonName(name);
  if (trimmed.length < 2 || trimmed.length >= 80) return false;
  const key = normalizePersonNameKey(trimmed);
  if (TRANSCRIPT_LABEL_BLOCKLIST.has(key)) return false;
  if (/^\d/.test(trimmed)) return false;
  return true;
}

export function extractTranscriptSpeakers(text: string): string[] {
  const names = new Set<string>();
  const re = /^([A-Za-zÁÉÍÓÚÑáéíóúñ][^\n:]{0,70}?):\s+/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = cleanChipPersonName(m[1].trim());
    if (isLikelyTranscriptSpeaker(name)) names.add(name);
  }
  return [...names];
}

/** Email primero — evita crear contactos duplicados solo por etiquetas de chip. */
export function prioritizePersonSignals(signals: PersonSignal[]): PersonSignal[] {
  const rank = (s: PersonSignal): number => {
    if (s.email) return 0;
    if (s.source === 'participant') return 1;
    if (s.source === 'invite' || s.source === 'drive' || s.source === 'owner') return 2;
    return 3;
  };
  return [...signals].sort((a, b) => rank(a) - rank(b));
}

export function collectSignalsFromMirror(parsed: {
  participants: string[];
  invitees: { name?: string; email: string }[];
  mentionedEmails: string[];
  sharedWith: { email: string; name?: string }[];
  ownerEmail?: string;
  body: string;
  participantNames: string[];
}): PersonSignal[] {
  const signals: PersonSignal[] = [];
  const push = (s: PersonSignal) => signals.push(s);

  const participantSet = new Set<string>();
  const registerParticipant = (raw: string) => {
    const cleaned = cleanChipPersonName(raw);
    if (cleaned) participantSet.add(cleaned);
  };

  for (const name of parsed.participants) registerParticipant(name);
  for (const name of parsed.participantNames) registerParticipant(name);

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
    if (email.includes('@')) push({ email, source: 'mention' });
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

export function extractTranscriptSection(body: string): string {
  const re = /##\s*Transcripci[oó]n[\s\S]*?(?=\n##\s|$)/i;
  const m = body.match(re);
  return m ? m[0] : body;
}
