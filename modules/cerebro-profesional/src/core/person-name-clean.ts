/** Prefijos habituales en chips Person de Google Docs / Gemini (contexto + nombre). */
const CHIP_LABEL_PREFIXES = [
  'Herramienta de Reporte',
  'Administración',
  'Aplicación',
  'Workshops',
  'Google',
  'Notion',
  'Nitro',
  'Nexo',
  'Reporte',
  'Herramienta',
];

export function normalizePersonNameKey(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "Lucas Mazalan Lucas Mazalan" → "Lucas Mazalan" */
export function dedupeRepeatedNameTokens(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 4 && words.length % 2 === 0) {
    const half = words.length / 2;
    const first = words.slice(0, half).join(' ');
    const second = words.slice(half).join(' ');
    if (normalizePersonNameKey(first) === normalizePersonNameKey(second)) return first;
  }
  return name.trim();
}

/** Quita contexto de chip / artefactos de Docs sobre el nombre de persona. */
export function cleanChipPersonName(raw: string): string {
  let name = dedupeRepeatedNameTokens(raw.replace(/\s+/g, ' ').trim());
  name = name.replace(/^(.+?)(?:'|\u2019)s Presentation$/i, '$1').trim();

  for (const prefix of [...CHIP_LABEL_PREFIXES].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`^${escapeRegExp(prefix)}\\s+(.+)$`, 'i');
    const m = name.match(re);
    if (m?.[1]) {
      name = m[1].trim();
      break;
    }
  }

  return name.trim();
}

export function isChipLabelVariant(raw: string, cleaned: string): boolean {
  return normalizePersonNameKey(raw) !== normalizePersonNameKey(cleaned);
}

/** Candidatos para buscar/crear contacto (más específico primero). */
export function personNameCandidates(raw: string): string[] {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return [];
  const cleaned = cleanChipPersonName(trimmed);
  const out: string[] = [];
  const push = (n: string) => {
    const t = n.trim();
    if (!t) return;
    if (!out.some((x) => normalizePersonNameKey(x) === normalizePersonNameKey(t))) out.push(t);
  };
  push(trimmed);
  push(cleaned);
  return out;
}

export function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0]?.replace(/[._+-]/g, ' ').trim() ?? email;
  return local
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function pickPersonDisplayName(rawName: string | undefined, email?: string): string {
  if (rawName?.trim()) {
    const cleaned = cleanChipPersonName(rawName);
    if (cleaned.length >= 2) return cleaned;
  }
  if (email) return displayNameFromEmail(email);
  return rawName?.trim() || 'Sin nombre';
}
