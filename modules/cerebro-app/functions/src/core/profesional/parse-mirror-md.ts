import { parse as parseYaml } from 'yaml';
import { coerceStringArray } from '../../lib/text-coerce.js';

export interface MirrorInvitee {
  name?: string;
  email: string;
}

export interface MirrorSharedWith {
  email: string;
  name?: string;
  role?: string;
}

export interface ParsedMirrorMd {
  frontmatter: Record<string, unknown>;
  body: string;
  participants: string[];
  invitees: MirrorInvitee[];
  mentionedEmails: string[];
  sharedWith: MirrorSharedWith[];
  ownerEmail?: string;
  summary?: string;
}

export function parseMirrorMarkdown(raw: string): ParsedMirrorMd {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: {},
      body: raw,
      participants: [],
      invitees: [],
      mentionedEmails: [],
      sharedWith: [],
    };
  }
  const fmBlock = match[1];
  const body = match[2].trim();
  const frontmatter = parseFrontmatter(fmBlock);
  const participants = Array.isArray(frontmatter.participants)
    ? coerceStringArray(frontmatter.participants as unknown[])
    : [];
  const invitees = normalizeInvitees(frontmatter.invitees);
  const mentionedEmails = Array.isArray(frontmatter.mentionedEmails)
    ? (frontmatter.mentionedEmails as string[]).map((e) => String(e).toLowerCase())
    : [];
  const sharedWith = normalizeSharedWith(frontmatter.sharedWith);
  const ownerEmail =
    typeof frontmatter.ownerEmail === 'string'
      ? frontmatter.ownerEmail.toLowerCase()
      : undefined;
  const summary =
    typeof frontmatter.summary === 'string' ? frontmatter.summary : undefined;
  const base = {
    frontmatter,
    body,
    participants,
    invitees,
    mentionedEmails,
    sharedWith,
    ownerEmail,
    summary,
  };
  return enrichParsedFromBody(base);
}

const BODY_EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/** Mirrors v2 (solo texto) — recupera emails y participantes desde el cuerpo. */
export function enrichParsedFromBody(parsed: ParsedMirrorMd): ParsedMirrorMd {
  const emails = new Set(parsed.mentionedEmails);
  for (const inv of parsed.invitees) emails.add(inv.email);
  for (const s of parsed.sharedWith) emails.add(s.email);

  if (!parsed.invitees.length) {
    for (const match of parsed.body.match(BODY_EMAIL_RE) ?? []) {
      emails.add(match.toLowerCase());
    }
    if (emails.size) {
      parsed.invitees = [...emails].map((email) => ({ email }));
    }
  }

  parsed.mentionedEmails = [...emails];

  if (!parsed.participants.length) {
    const section = parsed.body.match(/##\s*Participantes\s*([\s\S]*?)(?=\n##\s|$)/i);
    if (section?.[1]) {
      parsed.participants = section[1]
        .split(/\n|,|•|·/)
        .map((s) => s.replace(/^\s*[-*]\s*/, '').trim())
        .filter((s) => s.length > 1 && s.length < 80 && !s.includes('@'));
    }
  }

  return parsed;
}

function parseFrontmatter(block: string): Record<string, unknown> {
  try {
    const parsed = parseYaml(block);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function normalizeInvitees(raw: unknown): MirrorInvitee[] {
  if (!Array.isArray(raw)) return [];
  const out: MirrorInvitee[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const email = String(row.email ?? '').toLowerCase().trim();
    if (!email.includes('@')) continue;
    const name = row.name ? String(row.name).trim() : undefined;
    out.push({ email, name: name || undefined });
  }
  return out;
}

function normalizeSharedWith(raw: unknown): MirrorSharedWith[] {
  if (!Array.isArray(raw)) return [];
  const out: MirrorSharedWith[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const email = String(row.email ?? '').toLowerCase().trim();
    if (!email.includes('@')) continue;
    out.push({
      email,
      name: row.name ? String(row.name).trim() : undefined,
      role: row.role ? String(row.role) : undefined,
    });
  }
  return out;
}

export function slugId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'unknown';
}

export function extractSearchableBody(body: string): string {
  return body;
}
