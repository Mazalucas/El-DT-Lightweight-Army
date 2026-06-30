/** Extrae título y fecha desde nombres de archivo Meet / Gemini (fuente canónica). */
const TZ_OFFSETS = {
    CET: '+01:00',
    CEST: '+02:00',
    UTC: '+00:00',
    GMT: '+00:00',
};
/** Datetime Gemini en cualquier posición: separador opcional + YYYY MM DD HH:MM [TZ] */
const RE_GEMINI_DATETIME = /(?:^|[\s:–—\-])(\d{4})[\s.\-/](\d{1,2})[\s.\-/](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([A-Za-z]{2,6}(?:[+-]\d{1,2}(?::?\d{2})?)?)?)?/g;
const RE_ISO_INLINE = /\b(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:([Zz]|([+-]\d{2}):?(\d{2})?))?)?/;
function pad2(n) {
    return String(n).padStart(2, '0');
}
function normalizeBase(name) {
    return name
        .replace(/\.gdoc$/i, '')
        .replace(/\s*-\s*Notas de Gemini\s*$/i, '')
        .replace(/\.[^.]+$/, '')
        .trim();
}
function tzToOffset(tz) {
    const u = tz.toUpperCase().trim();
    if (TZ_OFFSETS[u])
        return TZ_OFFSETS[u];
    const gmt = u.match(/^GMT([+-]\d{1,2})(?::?(\d{2}))?$/);
    if (gmt) {
        const sign = gmt[1].startsWith('-') ? '-' : '+';
        const hours = pad2(Math.abs(Number.parseInt(gmt[1], 10)));
        return `${sign}${hours}:${gmt[2] ?? '00'}`;
    }
    if (/^[+-]\d{2}:?\d{2}$/.test(u)) {
        const m = u.match(/^([+-])(\d{2}):?(\d{2})?$/);
        if (m)
            return `${m[1]}${m[2]}:${m[3] ?? '00'}`;
    }
    return '+01:00';
}
function buildIso(y, mo, d, h, mi, sec, tz) {
    if (!h || !mi)
        return `${y}-${pad2(mo)}-${pad2(d)}`;
    const offset = tz ? tzToOffset(tz) : '+00:00';
    return `${y}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}:${pad2(sec ?? '0')}${offset}`;
}
function titleBeforeMatch(base, index) {
    return base.slice(0, index).replace(/[\s:–—\-]+$/, '').trim();
}
function lastGeminiMatch(base) {
    const re = new RegExp(RE_GEMINI_DATETIME.source, 'gi');
    let last = null;
    let m;
    while ((m = re.exec(base)) !== null)
        last = m;
    return last;
}
export function parseDateFromMeetFilename(name) {
    const base = normalizeBase(name);
    if (!base)
        return { title: name.trim() || 'Reunión' };
    const isoPrefix = base.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?\s+(.+)$/);
    if (isoPrefix) {
        const [, y, mo, d, h, mi, sec, rest] = isoPrefix;
        return {
            startedAt: buildIso(y, mo, d, h, mi, sec),
            title: rest.trim(),
        };
    }
    const gemini = lastGeminiMatch(base);
    if (gemini) {
        const [, y, mo, d, h, mi, sec, tz] = gemini;
        const title = titleBeforeMatch(base, gemini.index) || base;
        return {
            title,
            startedAt: buildIso(y, mo, d, h, mi, sec, tz),
            timezone: tz?.trim(),
        };
    }
    const isoInline = base.match(RE_ISO_INLINE);
    if (isoInline) {
        const [, y, mo, d, h, mi, sec] = isoInline;
        const idx = isoInline.index ?? 0;
        const title = titleBeforeMatch(base, idx) || base.replace(isoInline[0], '').trim() || base;
        return {
            title,
            startedAt: buildIso(y, mo, d, h, mi, sec),
        };
    }
    const dateOnly = base.match(/\b(\d{4})[\s.\-/](\d{1,2})[\s.\-/](\d{1,2})\b/);
    if (dateOnly) {
        const idx = dateOnly.index ?? 0;
        const title = titleBeforeMatch(base, idx) ||
            (base.slice(0, idx) + base.slice(idx + dateOnly[0].length)).replace(/\s+/g, ' ').trim() ||
            base;
        return {
            title,
            startedAt: `${dateOnly[1]}-${pad2(dateOnly[2])}-${pad2(dateOnly[3])}`,
        };
    }
    return { title: base };
}
