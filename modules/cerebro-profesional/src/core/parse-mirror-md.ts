import { parse as parseYaml } from 'yaml';

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
    ? (frontmatter.participants as string[])
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
  return {
    frontmatter,
    body,
    participants,
    invitees,
    mentionedEmails,
    sharedWith,
    ownerEmail,
    summary,
  };
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
