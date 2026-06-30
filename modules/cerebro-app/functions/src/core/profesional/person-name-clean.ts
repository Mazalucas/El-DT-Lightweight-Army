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

const MAX_PERSON_NAME_WORDS = 5;
const MAX_PERSON_NAME_CHARS = 48;

/** Temas de agenda que Meet/Gemini formatean como "Título: contenido" (no son personas). */
const TOPIC_LINE_PREFIX =
  /^(implementaci[oó]n|desarrollo|revisi[oó]n|an[aá]lisis|definici[oó]n|creaci[oó]n|actualizaci[oó]n|configuraci[oó]n|integraci[oó]n|automatizaci[oó]n|estandarizaci[oó]n|validaci[oó]n|correcci[oó]n|despliegue|limpieza|uso|etapa|fase|modelo|variable|lista|encuesta|funci[oó]n|vista|notificaci[oó]n|alerta|evaluaci[oó]n|edici[oó]n|l[oó]gica|cuenta|proyecto|preventa|curaci[oó]n|filtro|f[oó]rmula|acceso|estado|estados|deep link|rollback|vitales|api|google|nitro|nexolaps|preventas)\s+(de|del|de la|en el|en la|para el|para la|para|con|y|en|los|las)\s+/i;

const TECH_TITLE_TOKEN =
  /\b(vlookup|deep link|deep links|pdf|url|urls|forms?|rollback|nexolaps|nitro|google forms)\b/i;

/** Etiquetas de sección en notas Meet/Gemini (no son personas). */
export const SECTION_LABEL_BLOCKLIST = new Set([
  'proximos pasos',
  'próximos pasos',
  'detalles',
  'sugerencias',
  'resumen',
  'transcripcion',
  'transcripción',
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

/** Encabezados de tema/agenda en notas Meet/Gemini (no son personas). */
const AGENDA_TOPIC_START =
  /^(problemas|protocolos|presentaci[oó]n|propuesta|situaci[oó]n|rendimiento|simplificaci[oó]n|pr[oó]ximos pasos|discusi[oó]n|descripci[oó]n|planificaci[oó]n|seguimiento|actualizaci[oó]n|contexto|objetivos?|conclusiones?|acuerdos?|decisiones?|riesgos?|bloqueos?|blockers?|demostraci[oó]n|recap|overview|agenda|tema|temas|entregables?|evaluaciones?|contrataciones?|programaci[oó]n|inteligencia artificial|estado del|status del|update del|updates del)\b/i;

/** Vocabulario típico de temas de reunión (no nombres). */
const TOPIC_VOCABULARY =
  /\b(entregables?|miniaplicaci[oó]n|triggers?|contrataciones?|inteligencia artificial|entregable|turbo|dpx|nexolaps?|vitales|deep links?|miniaplicacion)\b/i;

function isSectionLabelPrefix(key: string): boolean {
  for (const blocked of SECTION_LABEL_BLOCKLIST) {
    const norm = normalizePersonNameKey(blocked);
    if (key === norm || key.startsWith(`${norm} `) || key.startsWith(`${norm} y `)) return true;
  }
  return false;
}

/** Heurística conservadora: ¿parece un nombre de persona y no un tema de reunión? */
export function isLikelyPersonName(raw: string): boolean {
  const name = cleanChipPersonName(raw);
  if (name.length < 2 || name.length > MAX_PERSON_NAME_CHARS) return false;
  if (/^\d/.test(name)) return false;
  if (/["'«»]/.test(name)) return false;

  const key = normalizePersonNameKey(name);
  if (SECTION_LABEL_BLOCKLIST.has(key)) return false;
  if (isSectionLabelPrefix(key)) return false;

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > MAX_PERSON_NAME_WORDS) return false;
  if (words.length === 1 && words[0]!.length > 20) return false;

  if (TOPIC_LINE_PREFIX.test(name)) return false;
  if (AGENDA_TOPIC_START.test(name)) return false;
  if (TECH_TITLE_TOKEN.test(name)) return false;
  if (TOPIC_VOCABULARY.test(name)) return false;

  return true;
}
