/** Extrae ítems de acción desde secciones Gemini en notas mirror. */
const SECTION_MAP = [
    { name: 'Próximos pasos', key: 'proximos_pasos' },
    { name: 'Proximos pasos', key: 'proximos_pasos' },
    { name: 'Sugerencias', key: 'sugerencias' },
    { name: 'Siguientes pasos', key: 'proximos_pasos' },
    { name: 'Next steps', key: 'proximos_pasos' },
    { name: 'Action items', key: 'proximos_pasos' },
    { name: 'Elementos de acción', key: 'proximos_pasos' },
    { name: 'Tareas', key: 'proximos_pasos' },
    { name: 'Tareas pendientes', key: 'proximos_pasos' },
    { name: 'Acciones', key: 'proximos_pasos' },
];
const FALLBACK_SECTIONS = [
    { name: 'Resumen', key: 'sugerencias' },
    { name: 'Detalles', key: 'sugerencias' },
    { name: 'Detalles de la reunión', key: 'sugerencias' },
];
const ACTION_VERB_RE = /\b(enviar|mandar|preparar|revisar|agendar|coordinar|confirmar|seguir|contactar|llamar|escribir|completar|terminar|entregar|armar|diseñar|implementar|probar|testear|validar|aprobar|subir|publicar|compartir|sincronizar|actualizar|definir|resolver|investigar|analizar|presentar|cotizar|facturar|pagar|firmar|programar|organizar|planificar|delegar|asignar|priorizar|cerrar|abrir|crear|hacer|verificar|chequear|pedir|solicitar|conseguir|obtener|agendar|reprogramar|follow.?up|follow up)\b/i;
const NON_ACTION_LINE_RE = /^(se (discuti[oó]|habl[oó]|present[oó]|revis[oó]|acord[oó]|mencion[oó])|la reuni[oó]n|particip(aron|antes)|asist(ieron|encia)|duraci[oó]n|fecha:|equipo:|proyecto:|resumen|overview|temas tratados|asistentes|invitados|notas generales|contexto:|objetivo de la reuni)/i;
export function extractSection(body, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`##\\s*${escaped}[\\s\\S]*?(?=\\n##\\s|$)`, 'i');
    const m = body.match(re);
    return m ? m[0].replace(/^##[^\n]*\n+/, '').trim() : '';
}
function normalizeLine(raw) {
    return raw
        .replace(/\uE007/g, '')
        .replace(/^\s*[-*•]\s*/, '')
        .replace(/^\s*\d+[\.)]\s+/, '')
        .replace(/^\s*[-*•]?\s*\[[ xX]\]\s*/, '')
        .trim();
}
function isLikelyActionItem(text, strict = false) {
    const t = text.trim();
    if (t.length < 10 || t.length > 400)
        return false;
    if (NON_ACTION_LINE_RE.test(t))
        return false;
    if (/^\[.+\]\s*$/.test(t))
        return false;
    const hasAssignee = /^\[[^\]]+\]\s*.+/.test(t);
    const hasVerb = ACTION_VERB_RE.test(t);
    const hasDeadlineHint = /\b(hoy|mañana|manana|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|\d{4}-\d{2}-\d{2}|en \d+ d[ií]as?)\b/i.test(t);
    if (hasAssignee)
        return true;
    if (strict)
        return hasVerb || hasDeadlineHint;
    return hasVerb || hasDeadlineHint || t.includes(':') === false;
}
function parseSectionLines(section, strict = false) {
    if (!section)
        return [];
    const lines = [];
    for (const raw of section.split(/\n+/)) {
        const text = normalizeLine(raw);
        if (!text || !isLikelyActionItem(text, strict))
            continue;
        lines.push(text);
    }
    return lines;
}
function pushUniqueItem(items, seen, text, sourceSection) {
    const norm = normalizeTextForId(text);
    if (seen.has(norm))
        return;
    seen.add(norm);
    items.push({ text, sourceSection });
}
export function extractActionItemsFromBody(body) {
    const seen = new Set();
    const items = [];
    for (const { name, key } of SECTION_MAP) {
        const section = extractSection(body, name);
        if (!section)
            continue;
        for (const text of parseSectionLines(section, false)) {
            pushUniqueItem(items, seen, text, key);
            if (items.length >= 20)
                return items;
        }
    }
    if (!items.length) {
        for (const { name, key } of FALLBACK_SECTIONS) {
            const section = extractSection(body, name);
            if (!section)
                continue;
            for (const text of parseSectionLines(section, true)) {
                pushUniqueItem(items, seen, text, key);
                if (items.length >= 12)
                    return items;
            }
        }
    }
    return items;
}
/** @deprecated Usar extractActionItemsFromBody — devuelve solo textos. */
export function extractActionItemTexts(body) {
    return extractActionItemsFromBody(body).map((i) => i.text);
}
/** Separa asignatario entre corchetes del texto del todo. */
export function parseActionItemLine(raw) {
    const m = raw.match(/^\[([^\]]+)\]\s*(.+)$/);
    if (m)
        return { assigneeLabel: m[1].trim(), text: m[2].trim() };
    return { text: raw.trim() };
}
/** Normaliza texto para ID estable (ignora mayúsculas, espacios y puntuación final). */
export function normalizeTextForId(raw) {
    const { text } = parseActionItemLine(raw);
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,;:!?…]+$/g, '');
}
export function todoStableId(meetingId, raw) {
    const normalized = normalizeTextForId(raw);
    let h = 0;
    for (let i = 0; i < normalized.length; i++)
        h = (Math.imul(31, h) + normalized.charCodeAt(i)) >>> 0;
    return `${meetingId}-${h.toString(36)}`;
}
const WEEKDAY_ES = {
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
function nextWeekday(from, targetDow) {
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    const diff = (targetDow - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
}
/** Intenta extraer fecha límite desde el texto del action item. */
export function parseDueAtFromText(raw, referenceDate = new Date()) {
    const iso = raw.match(/\b(20\d{2}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?\b/);
    if (iso) {
        const base = iso[1];
        const time = iso[2] ? `T${iso[2]}:00` : 'T12:00:00';
        const parsed = new Date(`${base}${time}`);
        if (!Number.isNaN(parsed.getTime()))
            return parsed.toISOString();
    }
    const lower = raw.toLowerCase();
    const ref = new Date(referenceDate);
    ref.setHours(12, 0, 0, 0);
    if (/\b(hoy|para hoy)\b/.test(lower))
        return ref.toISOString();
    if (/\b(mañana|manana)\b/.test(lower)) {
        const d = new Date(ref);
        d.setDate(d.getDate() + 1);
        return d.toISOString();
    }
    if (/\bpasado mañana\b/.test(lower)) {
        const d = new Date(ref);
        d.setDate(d.getDate() + 2);
        return d.toISOString();
    }
    for (const [name, dow] of Object.entries(WEEKDAY_ES)) {
        if (lower.includes(name))
            return nextWeekday(ref, dow).toISOString();
    }
    const inDays = lower.match(/\ben\s+(\d{1,2})\s+d[ií]as?\b/);
    if (inDays) {
        const d = new Date(ref);
        d.setDate(d.getDate() + Number(inDays[1]));
        return d.toISOString();
    }
    return undefined;
}
