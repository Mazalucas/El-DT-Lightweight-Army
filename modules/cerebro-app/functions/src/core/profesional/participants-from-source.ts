/** Misma heurística que meet-notes-sync/parse-filename (títulos Meet + Gemini). */
export function participantsFromSourceFile(sourceFile: string): string[] {
  const base = sourceFile
    .replace(/\.gdoc$/i, '')
    .replace(/\s*-\s*Notas de Gemini\s*$/i, '');
  return extractParticipantsFromTitle(base);
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
