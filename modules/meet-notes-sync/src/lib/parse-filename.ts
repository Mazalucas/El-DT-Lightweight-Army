export interface ParsedFilename {
  title: string;
  startedAt?: string;
  timezone?: string;
  participantsFromTitle: string[];
}

const DATE_RE =
  /:\s*(\d{4})\s+(\d{2})\s+(\d{2})\s+(\d{2}):(\d{2})\s+(CET|CEST|GMT[^-]*|UTC)/i;

export function parseMeetFilename(fileName: string): ParsedFilename {
  const base = fileName.replace(/\.gdoc$/i, '').replace(/\s*-\s*Notas de Gemini\s*$/i, '');
  const participantsFromTitle = extractParticipantsFromTitle(base);
  const m = base.match(DATE_RE);
  if (!m) {
    return { title: base.trim(), participantsFromTitle };
  }
  const datePart = m[0];
  const title = base.slice(0, base.indexOf(datePart)).replace(/:\s*$/, '').trim();
  const [, y, mo, d, h, mi, tz] = m;
  const offset = tz.toUpperCase().startsWith('CEST') ? '+02:00' : '+01:00';
  const startedAt = `${y}-${mo}-${d}T${h}:${mi}:00${offset}`;
  return {
    title: title || base.trim(),
    startedAt,
    timezone: tz.trim(),
    participantsFromTitle,
  };
}

function extractParticipantsFromTitle(title: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\|\s*([^|]+)<>\s*([^|():]+)/,
    /([^|():]+)\s*<>\s*([^|():]+)/,
    /1\s*[- ]?1\s+([^|():]+)\s*\/\s*([^|():]+)/i,
    /1\s*[- ]?1\s+con\s+([^|():]+)/i,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (m) {
      if (m[1]) out.push(cleanName(m[1]));
      if (m[2]) out.push(cleanName(m[2]));
      return [...new Set(out.filter(Boolean))];
    }
  }
  return out;
}

function cleanName(s: string): string {
  return s.replace(/\s*\(.*\)\s*$/, '').replace(/\s+/g, ' ').trim();
}
