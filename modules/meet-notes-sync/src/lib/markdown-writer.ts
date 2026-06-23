import fs from 'node:fs';
import path from 'node:path';
import type { MeetingFrontmatter } from './types.js';
import { buildMarkdownBody, cleanChipPersonName } from './doc-to-markdown.js';
import type { ParsedDocContent } from './doc-to-markdown.js';

export const CURRENT_SYNC_VERSION = 2;

export function serializeFrontmatter(fm: MeetingFrontmatter): string {
  const lines = ['---'];
  lines.push(`meetingId: "${fm.meetingId}"`);
  if (fm.docId) lines.push(`docId: "${fm.docId}"`);
  lines.push(`sourceFile: ${yamlQuote(fm.sourceFile)}`);
  lines.push(`title: ${yamlQuote(fm.title)}`);
  if (fm.startedAt) lines.push(`startedAt: "${fm.startedAt}"`);
  if (fm.timezone) lines.push(`timezone: "${fm.timezone}"`);
  if (fm.participants.length) {
    lines.push('participants:');
    for (const p of fm.participants) lines.push(`  - ${yamlQuote(p)}`);
  }
  if (fm.summary) lines.push(`summary: ${yamlQuote(fm.summary)}`);
  if (fm.teamId) lines.push(`teamId: "${fm.teamId}"`);
  if (fm.ownerEmail) lines.push(`ownerEmail: "${fm.ownerEmail}"`);
  if (fm.invitees?.length) {
    lines.push('invitees:');
    for (const inv of fm.invitees) {
      lines.push('  -');
      if (inv.name) lines.push(`    name: ${yamlQuote(inv.name)}`);
      lines.push(`    email: ${yamlQuote(inv.email)}`);
    }
  }
  if (fm.mentionedEmails?.length) {
    lines.push('mentionedEmails:');
    for (const e of fm.mentionedEmails) lines.push(`  - ${yamlQuote(e)}`);
  }
  if (fm.sharedWith?.length) {
    lines.push('sharedWith:');
    for (const s of fm.sharedWith) {
      lines.push('  -');
      lines.push(`    email: ${yamlQuote(s.email)}`);
      if (s.name) lines.push(`    name: ${yamlQuote(s.name)}`);
      if (s.role) lines.push(`    role: ${yamlQuote(s.role)}`);
    }
  }
  if (fm.tabTitles?.length) {
    lines.push('tabTitles:');
    for (const t of fm.tabTitles) lines.push(`  - ${yamlQuote(t)}`);
  }
  lines.push(`syncedAt: "${fm.syncedAt}"`);
  lines.push(`contentHash: "${fm.contentHash}"`);
  lines.push(`syncVersion: ${fm.syncVersion}`);
  lines.push('---');
  return lines.join('\n');
}

function yamlQuote(s: string): string {
  if (/[:#{}[\],&*?]|^\s|\s$/.test(s)) return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return `"${s.replace(/"/g, '\\"')}"`;
}

export function writeMeetingMarkdown(
  mirrorPath: string,
  meetingId: string,
  fm: MeetingFrontmatter,
  body: string,
): string {
  const filePath = path.join(mirrorPath, `${meetingId}.md`);
  fs.writeFileSync(filePath, `${serializeFrontmatter(fm)}\n\n${body}\n`, 'utf8');
  return filePath;
}

export function writeFromParsedDoc(
  mirrorPath: string,
  fm: MeetingFrontmatter,
  parsed: ParsedDocContent,
): string {
  const participants = [
    ...new Set([
      ...fm.participants.map(cleanChipPersonName).filter(Boolean),
      ...parsed.participants.map(cleanChipPersonName).filter(Boolean),
      ...(parsed.invitees.map((i) => (i.name ? cleanChipPersonName(i.name) : '')).filter(Boolean) as string[]),
    ]),
  ];
  const fullFm: MeetingFrontmatter = {
    ...fm,
    participants,
    summary: fm.summary ?? parsed.summary,
    invitees: parsed.invitees,
    mentionedEmails: parsed.mentionedEmails,
    tabTitles: parsed.tabs.map((t) => t.title),
    syncVersion: CURRENT_SYNC_VERSION,
  };
  const body = buildMarkdownBody(parsed);
  return writeMeetingMarkdown(mirrorPath, fm.meetingId, fullFm, body);
}

export function writeStubMarkdown(
  mirrorPath: string,
  fm: MeetingFrontmatter,
  note: string,
): string {
  const body = `## Pendiente de contenido\n\n${note}\n`;
  return writeMeetingMarkdown(mirrorPath, fm.meetingId, { ...fm, syncVersion: CURRENT_SYNC_VERSION }, body);
}
