import type { docs_v1 } from 'googleapis';
import { cleanChipPersonName } from './person-name-clean.js';

const SECTION_ALIASES: Record<string, string> = {
  participantes: 'Participantes',
  attendees: 'Participantes',
  asistentes: 'Participantes',
  resumen: 'Resumen',
  summary: 'Resumen',
  detalles: 'Detalles',
  notes: 'Detalles',
  notas: 'Detalles',
  highlights: 'Detalles',
  transcripcion: 'Transcripción',
  transcripción: 'Transcripción',
  transcript: 'Transcripción',
  sugerencias: 'Próximos pasos',
  'próximos pasos': 'Próximos pasos',
  'proximos pasos': 'Próximos pasos',
  'next steps': 'Próximos pasos',
  'action items': 'Próximos pasos',
  'elementos de acción': 'Próximos pasos',
};

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export interface DocInvitee {
  name?: string;
  email: string;
}

export interface DocSharedWith {
  email: string;
  name?: string;
  role?: string;
  type?: string;
}

export interface DocTabSlice {
  id: string;
  title: string;
  text: string;
  sections: Map<string, string>;
}

export interface ParsedDocContent {
  plainText: string;
  sections: Map<string, string>;
  tabs: DocTabSlice[];
  participants: string[];
  invitees: DocInvitee[];
  mentionedEmails: string[];
  summary?: string;
}

interface ParsedBody {
  plainText: string;
  sections: Map<string, string>;
  participants: string[];
  invitees: DocInvitee[];
}

export function googleDocToParsed(doc: docs_v1.Schema$Document): ParsedDocContent {
  const tabBodies = collectTabBodies(doc);
  const tabs: DocTabSlice[] = [];
  const allSections = new Map<string, string>();
  const allInvitees: DocInvitee[] = [];
  const allParticipants: string[] = [];
  const textParts: string[] = [];

  for (const tab of tabBodies) {
    const parsed = parseBodyContent(tab.body);
    tabs.push({
      id: tab.id,
      title: tab.title,
      text: parsed.plainText,
      sections: parsed.sections,
    });
    for (const [k, v] of parsed.sections) {
      const key = tabBodies.length > 1 ? `${tab.title} — ${k}` : k;
      if (!allSections.has(key)) allSections.set(key, v);
    }
    allInvitees.push(...parsed.invitees);
    allParticipants.push(...parsed.participants);
    if (parsed.plainText.trim()) {
      textParts.push(tabBodies.length > 1 ? `## ${tab.title}\n\n${parsed.plainText}` : parsed.plainText);
    }
  }

  const plainText = textParts.join('\n\n');
  const mentionedEmails = extractMentionedEmails(plainText);
  const invitees = dedupeInvitees(allInvitees);
  const participantsFromList = allParticipants.map((p) => cleanChipPersonName(p)).filter(Boolean);
  const participantsFromChips = invitees
    .map((i) => (i.name ? cleanChipPersonName(i.name) : ''))
    .filter(Boolean);
  const participants = [...new Set([...participantsFromList, ...participantsFromChips])];

  return {
    plainText,
    sections: allSections,
    tabs,
    participants,
    invitees,
    mentionedEmails,
    summary: allSections.get('Resumen')?.split('\n')[0]?.trim(),
  };
}

function collectTabBodies(
  doc: docs_v1.Schema$Document,
): { id: string; title: string; body: docs_v1.Schema$Body }[] {
  const out: { id: string; title: string; body: docs_v1.Schema$Body }[] = [];

  const walk = (tabs: docs_v1.Schema$Tab[] | undefined) => {
    for (const tab of tabs ?? []) {
      if (tab.documentTab?.body) {
        out.push({
          id: tab.tabProperties?.tabId ?? `tab-${out.length}`,
          title: tab.tabProperties?.title?.trim() || `Pestaña ${out.length + 1}`,
          body: tab.documentTab.body,
        });
      }
      if (tab.childTabs?.length) walk(tab.childTabs);
    }
  };

  if (doc.tabs?.length) {
    walk(doc.tabs);
  } else if (doc.body) {
    out.push({ id: 'legacy', title: 'Documento', body: doc.body });
  }

  return out;
}

function parseBodyContent(body: docs_v1.Schema$Body): ParsedBody {
  const lines: string[] = [];
  const sections = new Map<string, string>();
  let currentSection = 'Cuerpo';
  const sectionBuffers = new Map<string, string[]>();
  sectionBuffers.set(currentSection, []);
  const invitees: DocInvitee[] = [];

  const walk = (content: docs_v1.Schema$StructuralElement[] | undefined) => {
    for (const el of content ?? []) {
      if (el.paragraph) {
        const { text, people } = paragraphTextWithPeople(el.paragraph);
        invitees.push(...people);
        if (!text.trim()) continue;
        const style = el.paragraph.paragraphStyle?.namedStyleType ?? '';
        if (style.startsWith('HEADING')) {
          const normalized = normalizeSectionTitle(text);
          if (normalized) {
            currentSection = normalized;
            if (!sectionBuffers.has(currentSection)) sectionBuffers.set(currentSection, []);
            lines.push(`## ${currentSection}`);
            continue;
          }
        }
        sectionBuffers.get(currentSection)?.push(text);
        lines.push(text);
        continue;
      }
      if (el.table) {
        for (const row of el.table.tableRows ?? []) {
          for (const cell of row.tableCells ?? []) {
            walk(cell.content);
          }
        }
      }
    }
  };

  walk(body.content);

  for (const [key, buf] of sectionBuffers) {
    const bodyText = buf.join('\n').trim();
    if (bodyText) sections.set(key, bodyText);
  }

  const plainText = lines.join('\n');
  const participants = parseParticipantsList(sections.get('Participantes') ?? '');

  return { plainText, sections, participants, invitees: dedupeInvitees(invitees) };
}

function paragraphTextWithPeople(p: docs_v1.Schema$Paragraph): { text: string; people: DocInvitee[] } {
  const people: DocInvitee[] = [];
  const parts = (p.elements ?? []).map((e) => {
    const email = e.person?.personProperties?.email?.trim();
    if (email) {
      const rawName = e.person?.personProperties?.name?.trim();
      const cleanName = rawName ? cleanChipPersonName(rawName) : undefined;
      people.push({
        name: cleanName || rawName || undefined,
        email: email.toLowerCase(),
      });
      return cleanName || rawName || email;
    }
    return e.textRun?.content ?? '';
  });
  return { text: parts.join('').replace(/\n$/, ''), people };
}

function normalizeSectionTitle(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/[:#*]/g, '');
  return SECTION_ALIASES[key] ?? (raw.trim() ? raw.trim() : null);
}

function parseParticipantsList(block: string): string[] {
  if (!block.trim()) return [];
  return block
    .split(/\n|,|•|·|–|-/)
    .map((s) => s.replace(/^\s*[-*]\s*/, '').trim())
    .filter((s) => s.length > 1 && s.length < 80 && !EMAIL_RE.test(s));
}

function extractMentionedEmails(text: string): string[] {
  const found = text.match(EMAIL_RE) ?? [];
  return [...new Set(found.map((e) => e.toLowerCase()))];
}

function dedupeInvitees(list: DocInvitee[]): DocInvitee[] {
  const byEmail = new Map<string, DocInvitee>();
  for (const item of list) {
    const email = item.email.toLowerCase().trim();
    if (!email) continue;
    const prev = byEmail.get(email);
    if (!prev) {
      byEmail.set(email, { ...item, email });
    } else if (!prev.name && item.name) {
      byEmail.set(email, { ...prev, name: item.name });
    }
  }
  return [...byEmail.values()];
}

export function buildMarkdownBody(parsed: ParsedDocContent): string {
  if (parsed.tabs.length > 1) {
    const parts: string[] = [];
    for (const tab of parsed.tabs) {
      const inner = buildSectionsMarkdown(tab.sections, tab.text);
      parts.push(`## ${tab.title}\n\n${inner}`);
    }
    return parts.join('\n\n');
  }
  return buildSectionsMarkdown(parsed.sections, parsed.plainText);
}

function buildSectionsMarkdown(sections: Map<string, string>, plainFallback: string): string {
  const order = ['Resumen', 'Detalles', 'Transcripción', 'Próximos pasos', 'Participantes', 'Cuerpo'];
  const parts: string[] = [];
  const used = new Set<string>();
  for (const name of order) {
    const text = sections.get(name);
    if (text?.trim()) {
      parts.push(`## ${name}\n\n${text.trim()}`);
      used.add(name);
    }
  }
  for (const [name, text] of sections) {
    if (!used.has(name) && text.trim()) {
      parts.push(`## ${name}\n\n${text.trim()}`);
    }
  }
  if (parts.length === 0 && plainFallback.trim()) {
    return plainFallback.trim();
  }
  return parts.join('\n\n');
}
