import { coerceString } from '../../lib/text-coerce.js';
import { extractActionItemsFromBody, normalizeTextForId, parseActionItemLine, parseDueAtFromText, todoStableId, } from './extract-action-items.js';
import { mergeTodoPersonIds } from './meeting-contacts.js';
import { cleanChipPersonName, normalizePersonNameKey } from './person-name-clean.js';
import { parseMirrorMarkdown } from './parse-mirror-md.js';
export const MANUAL_TODO_MEETING_ID = 'manual';
export function resolvePersonIds(label, people) {
    if (!label)
        return [];
    const key = normalizePersonNameKey(cleanChipPersonName(label));
    if (!key || key === 'el grupo' || key === 'grupo')
        return [];
    for (const p of people) {
        const names = [p.displayName, ...p.aliases].filter(Boolean);
        for (const n of names) {
            if (normalizePersonNameKey(cleanChipPersonName(n)) === key)
                return [p.id];
        }
    }
    const words = key.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        const matches = people.filter((p) => {
            const dn = normalizePersonNameKey(cleanChipPersonName(p.displayName));
            return dn.split(/\s+/)[0] === words[0];
        });
        if (matches.length === 1)
            return [matches[0].id];
    }
    return [];
}
export function buildTodoFromExtracted(item, people, meeting, opts) {
    const { assigneeLabel, text } = parseActionItemLine(item.text);
    const meetingId = item.meetingId;
    const assigneeIds = resolvePersonIds(assigneeLabel, people);
    const personIds = mergeTodoPersonIds(assigneeIds, meeting, people);
    const teamIds = [...new Set([...(item.teamIds ?? []), ...(meeting?.teamIds ?? [])])];
    const projectIds = [...new Set([...(item.projectIds ?? []), ...(meeting?.projectIds ?? [])])];
    const now = new Date().toISOString();
    const refDate = item.startedAt ? new Date(item.startedAt) : meeting?.startedAt ? new Date(meeting.startedAt) : new Date();
    const dueAt = parseDueAtFromText(item.text, refDate);
    return {
        id: todoStableId(meetingId, item.text),
        text,
        meetingId,
        meetingTitle: item.meetingTitle ?? meeting?.title,
        meetingStartedAt: item.startedAt ?? meeting?.startedAt,
        assigneeLabel,
        assigneePersonIds: assigneeIds.length ? assigneeIds : undefined,
        personIds,
        teamIds,
        projectIds,
        dueAt,
        status: opts?.status ?? 'suggested',
        source: opts?.source ?? 'extracted',
        sourceSection: item.sourceSection,
        extractedAt: now,
        createdAt: now,
        updatedAt: now,
    };
}
function isManualTodo(todo) {
    return todo.source === 'manual' || todo.id.startsWith('manual-');
}
export function upsertExtractedTodoInStore(store, item) {
    const people = store.people;
    const meeting = store.meetings.find((m) => m.id === item.meetingId);
    const built = buildTodoFromExtracted(item, people, meeting);
    const idx = store.todos.findIndex((t) => t.id === built.id);
    const prev = idx >= 0 ? store.todos[idx] : undefined;
    if (prev && isManualTodo(prev))
        return 'skipped';
    if (prev?.status === 'dismissed')
        return 'skipped';
    if (prev?.status === 'open' || prev?.status === 'done') {
        store.todos[idx] = {
            ...prev,
            meetingTitle: built.meetingTitle,
            meetingStartedAt: built.meetingStartedAt,
            teamIds: built.teamIds,
            projectIds: built.projectIds,
            personIds: built.personIds,
            assigneeLabel: built.assigneeLabel,
            assigneePersonIds: built.assigneePersonIds,
            sourceSection: built.sourceSection ?? prev.sourceSection,
            updatedAt: new Date().toISOString(),
        };
        return 'updated';
    }
    if (prev?.status === 'suggested') {
        store.todos[idx] = {
            ...prev,
            ...built,
            status: 'suggested',
            extractedAt: prev.extractedAt,
            createdAt: prev.createdAt,
            updatedAt: new Date().toISOString(),
        };
        return 'updated';
    }
    store.todos.push(built);
    return 'created';
}
export function syncExtractedTodosInStore(store, items) {
    let upserted = 0;
    for (const item of items) {
        const result = upsertExtractedTodoInStore(store, item);
        if (result !== 'skipped')
            upserted++;
    }
    return upserted;
}
/** Escanea mirrors y devuelve todos extraídos de secciones Gemini. */
export function collectExtractedTodosFromMirrors(mirrors, meetings) {
    const meetingsById = new Map(meetings.map((m) => [m.id, m]));
    const items = [];
    const seen = new Set();
    for (const file of mirrors) {
        const parsed = parseMirrorMarkdown(file.content);
        const meetingId = String(parsed.frontmatter.meetingId ?? file.id);
        const meeting = meetingsById.get(meetingId);
        const extracted = extractActionItemsFromBody(parsed.body);
        for (const { text, sourceSection } of extracted) {
            const norm = normalizeTextForId(text);
            if (seen.has(`${meetingId}:${norm}`))
                continue;
            seen.add(`${meetingId}:${norm}`);
            items.push({
                meetingId,
                text,
                meetingTitle: meeting?.title,
                startedAt: meeting?.startedAt,
                teamIds: meeting?.teamIds,
                projectIds: meeting?.projectIds,
                sourceSection,
            });
        }
        // Action items de análisis IA ya en meeting
        if (meeting?.actionItems?.length) {
            for (const raw of meeting.actionItems) {
                const text = coerceString(raw, '').trim();
                if (!text)
                    continue;
                const norm = normalizeTextForId(text);
                if (seen.has(`${meetingId}:${norm}`))
                    continue;
                seen.add(`${meetingId}:${norm}`);
                items.push({
                    meetingId,
                    text,
                    meetingTitle: meeting.title,
                    startedAt: meeting.startedAt,
                    teamIds: meeting.teamIds,
                    projectIds: meeting.projectIds,
                    sourceSection: 'analysis',
                });
            }
        }
    }
    return items;
}
export function upsertAiActionItemsAsTodos(store, meetingId, actionItems) {
    let n = 0;
    for (const text of actionItems) {
        const result = upsertExtractedTodoInStore(store, {
            meetingId,
            text,
            meetingTitle: store.meetings.find((m) => m.id === meetingId)?.title,
            startedAt: store.meetings.find((m) => m.id === meetingId)?.startedAt,
            sourceSection: 'analysis',
        });
        if (result !== 'skipped')
            n++;
    }
    return n;
}
/** Convierte sugerencias IA con acción create_todo en tareas sugeridas del tablero. */
export function materializeSmartTodoCandidatesInStore(store, candidates) {
    let n = 0;
    for (const c of candidates) {
        const text = c.text.trim();
        if (text.length < 10)
            continue;
        const meetingId = c.meetingId?.trim() || MANUAL_TODO_MEETING_ID;
        const result = upsertExtractedTodoInStore(store, {
            meetingId,
            text,
            meetingTitle: c.meetingTitle,
            startedAt: c.meetingStartedAt,
            sourceSection: 'analysis',
        });
        if (result !== 'skipped')
            n++;
    }
    return n;
}
