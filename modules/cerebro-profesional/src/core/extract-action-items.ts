/** Extrae ítems de acción desde secciones Gemini en notas mirror. */

import type { TodoSourceSection } from './models';

const SECTION_MAP: { name: string; key: TodoSourceSection }[] = [
  { name: 'Próximos pasos', key: 'proximos_pasos' },
  { name: 'Proximos pasos', key: 'proximos_pasos' },
  { name: 'Sugerencias', key: 'sugerencias' },
];

export interface ExtractedActionItem {
  text: string;
  sourceSection: TodoSourceSection;
}

export function extractSection(body: string, name: string): string {
  const re = new RegExp(`##\\s*${name}[\\s\\S]*?(?=\\n##\\s|$)`, 'i');
  const m = body.match(re);
  return m ? m[0].replace(/^##[^\n]*\n+/, '').trim() : '';
}

function parseSectionLines(section: string): string[] {
  if (!section) return [];
  return section
    .replace(/\uE007/g, '')
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, '').trim())
    .filter((l) => l.length > 8 && l.length < 400);
}

export function extractActionItemsFromBody(body: string): ExtractedActionItem[] {
  const seen = new Set<string>();
  const items: ExtractedActionItem[] = [];

  for (const { name, key } of SECTION_MAP) {
    const section = extractSection(body, name);
    if (!section) continue;
    for (const text of parseSectionLines(section)) {
      const norm = normalizeTextForId(text);
      if (seen.has(norm)) continue;
      seen.add(norm);
      items.push({ text, sourceSection: key });
      if (items.length >= 20) return items;
    }
  }

  return items;
}

/** @deprecated Usar extractActionItemsFromBody — devuelve solo textos. */
export function extractActionItemTexts(body: string): string[] {
  return extractActionItemsFromBody(body).map((i) => i.text);
}

/** Separa asignatario entre corchetes del texto del todo. */
export function parseActionItemLine(raw: string): { assigneeLabel?: string; text: string } {
  const m = raw.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (m) return { assigneeLabel: m[1].trim(), text: m[2].trim() };
  return { text: raw.trim() };
}

/** Normaliza texto para ID estable (ignora mayúsculas, espacios y puntuación final). */
export function normalizeTextForId(raw: string): string {
  const { text } = parseActionItemLine(raw);
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?…]+$/g, '');
}

export function todoStableId(meetingId: string, raw: string): string {
  const normalized = normalizeTextForId(raw);
  let h = 0;
  for (let i = 0; i < normalized.length; i++) h = (Math.imul(31, h) + normalized.charCodeAt(i)) >>> 0;
  return `${meetingId}-${h.toString(36)}`;
}
