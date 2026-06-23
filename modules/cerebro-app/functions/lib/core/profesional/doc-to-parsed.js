import { cleanChipPersonName } from './person-name-clean.js';
const SECTION_ALIASES = {
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
export function googleDocToParsed(doc) {
    const tabBodies = collectTabBodies(doc);
    const tabs = [];
    const allSections = new Map();
    const allInvitees = [];
    const allParticipants = [];
    const textParts = [];
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
            if (!allSections.has(key))
                allSections.set(key, v);
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
function collectTabBodies(doc) {
    const out = [];
    const walk = (tabs) => {
        for (const tab of tabs ?? []) {
            if (tab.documentTab?.body) {
                out.push({
                    id: tab.tabProperties?.tabId ?? `tab-${out.length}`,
                    title: tab.tabProperties?.title?.trim() || `Pestaña ${out.length + 1}`,
                    body: tab.documentTab.body,
                });
            }
            if (tab.childTabs?.length)
                walk(tab.childTabs);
        }
    };
    if (doc.tabs?.length) {
        walk(doc.tabs);
    }
    else if (doc.body) {
        out.push({ id: 'legacy', title: 'Documento', body: doc.body });
    }
    return out;
}
function parseBodyContent(body) {
    const lines = [];
    const sections = new Map();
    let currentSection = 'Cuerpo';
    const sectionBuffers = new Map();
    sectionBuffers.set(currentSection, []);
    const invitees = [];
    const walk = (content) => {
        for (const el of content ?? []) {
            if (el.paragraph) {
                const { text, people } = paragraphTextWithPeople(el.paragraph);
                invitees.push(...people);
                if (!text.trim())
                    continue;
                const style = el.paragraph.paragraphStyle?.namedStyleType ?? '';
                if (style.startsWith('HEADING')) {
                    const normalized = normalizeSectionTitle(text);
                    if (normalized) {
                        currentSection = normalized;
                        if (!sectionBuffers.has(currentSection))
                            sectionBuffers.set(currentSection, []);
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
        if (bodyText)
            sections.set(key, bodyText);
    }
    const plainText = lines.join('\n');
    const participants = parseParticipantsList(sections.get('Participantes') ?? '');
    return { plainText, sections, participants, invitees: dedupeInvitees(invitees) };
}
function paragraphTextWithPeople(p) {
    const people = [];
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
function normalizeSectionTitle(raw) {
    const key = raw.trim().toLowerCase().replace(/[:#*]/g, '');
    return SECTION_ALIASES[key] ?? (raw.trim() ? raw.trim() : null);
}
function parseParticipantsList(block) {
    if (!block.trim())
        return [];
    return block
        .split(/\n|,|•|·|–|-/)
        .map((s) => s.replace(/^\s*[-*]\s*/, '').trim())
        .filter((s) => s.length > 1 && s.length < 80 && !EMAIL_RE.test(s));
}
function extractMentionedEmails(text) {
    const found = text.match(EMAIL_RE) ?? [];
    return [...new Set(found.map((e) => e.toLowerCase()))];
}
function dedupeInvitees(list) {
    const byEmail = new Map();
    for (const item of list) {
        const email = item.email.toLowerCase().trim();
        if (!email)
            continue;
        const prev = byEmail.get(email);
        if (!prev) {
            byEmail.set(email, { ...item, email });
        }
        else if (!prev.name && item.name) {
            byEmail.set(email, { ...prev, name: item.name });
        }
    }
    return [...byEmail.values()];
}
export function buildMarkdownBody(parsed) {
    if (parsed.tabs.length > 1) {
        const parts = [];
        for (const tab of parsed.tabs) {
            const inner = buildSectionsMarkdown(tab.sections, tab.text);
            parts.push(`## ${tab.title}\n\n${inner}`);
        }
        return parts.join('\n\n');
    }
    return buildSectionsMarkdown(parsed.sections, parsed.plainText);
}
function buildSectionsMarkdown(sections, plainFallback) {
    const order = ['Resumen', 'Detalles', 'Transcripción', 'Próximos pasos', 'Participantes', 'Cuerpo'];
    const parts = [];
    const used = new Set();
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
