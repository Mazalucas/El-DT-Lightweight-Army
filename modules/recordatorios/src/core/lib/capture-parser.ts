const DAY_NAMES: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(9, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function nextWeekday(from: Date, targetDay: number): Date {
  const d = startOfDay(from);
  const diff = (targetDay + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export function parseRelativeDate(text: string, now = new Date()): string | undefined {
  const lower = text.toLowerCase().trim();
  if (!lower) return undefined;

  if (/\bmañana\b/.test(lower)) {
    return addDays(startOfDay(now), 1).toISOString();
  }
  if (/\bpasado mañana\b/.test(lower)) {
    return addDays(startOfDay(now), 2).toISOString();
  }
  if (/\bhoy\b/.test(lower)) {
    return startOfDay(now).toISOString();
  }

  const inDays = lower.match(/\ben\s+(\d+)\s+d[ií]as?\b/);
  if (inDays) {
    return addDays(startOfDay(now), parseInt(inDays[1], 10)).toISOString();
  }

  for (const [name, day] of Object.entries(DAY_NAMES)) {
    if (lower.includes(`el ${name}`) || lower.includes(name)) {
      const target = nextWeekday(now, day);
      if (lower.includes('el ') || lower.includes(name)) {
        return target.toISOString();
      }
    }
  }

  return undefined;
}

export function stripDatePhrases(text: string): string {
  return text
    .replace(/\b(pasado )?mañana\b/gi, '')
    .replace(/\bhoy\b/gi, '')
    .replace(/\ben\s+\d+\s+d[ií]as?\b/gi, '')
    .replace(/\bel\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const CATEGORY_PATTERN = /@(personal|trabajo|proyecto:[a-z0-9-]+)/gi;
const TAG_PATTERN = /#([a-zA-Z0-9_\u00C0-\u024F-]+)/g;

export function parseCapture(
  raw: string,
  defaultCategoryId = 'personal',
): import('../models/pending-reminder').ParsedCapture {
  let categoryId = defaultCategoryId;
  const tags: string[] = [];

  const categoryMatches = [...raw.matchAll(CATEGORY_PATTERN)];
  if (categoryMatches.length > 0) {
    categoryId = categoryMatches[categoryMatches.length - 1][1].toLowerCase();
    if (!categoryId.startsWith('proyecto:')) {
      categoryId = categoryId.toLowerCase();
    }
  }

  for (const m of raw.matchAll(TAG_PATTERN)) {
    const tag = m[1].toLowerCase();
    if (!tags.includes(tag)) tags.push(tag);
  }

  const dueAt = parseRelativeDate(raw);
  let title = raw
    .replace(CATEGORY_PATTERN, '')
    .replace(TAG_PATTERN, '')
    .trim();
  title = stripDatePhrases(title);
  title = title.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();

  return { title, categoryId, tags, dueAt };
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}
