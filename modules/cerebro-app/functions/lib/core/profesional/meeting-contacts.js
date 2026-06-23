import { cleanChipPersonName, displayNameFromEmail, normalizePersonNameKey, } from './person-name-clean.js';
import { participantsFromSourceFile } from './participants-from-source.js';
/** Nombres canónicos de asistentes: invitees con email primero; si no, heurística del mirror. */
export function buildCanonicalParticipantNames(parsed, sourceFile) {
    const fromInvitees = parsed.invitees
        .map((inv) => {
        const fromName = inv.name ? cleanChipPersonName(inv.name) : '';
        if (fromName.length >= 2)
            return fromName;
        return displayNameFromEmail(inv.email);
    })
        .filter(Boolean);
    if (fromInvitees.length > 0) {
        return [...new Set(fromInvitees)];
    }
    const fromYamlAndTitle = [...parsed.participants, ...participantsFromSourceFile(sourceFile)]
        .map((n) => cleanChipPersonName(n))
        .filter(isLikelyParticipantName);
    return [...new Set(fromYamlAndTitle)];
}
function isLikelyParticipantName(name) {
    const trimmed = name.trim();
    if (trimmed.length < 2)
        return false;
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2)
        return true;
    const key = normalizePersonNameKey(trimmed);
    if (key.length < 3)
        return false;
    return /^[A-ZÁÉÍÓÚÑ]/.test(trimmed);
}
/** IDs de contacto reales para una reunión (email primero; corrige personIds huérfanos). */
export function resolveMeetingPersonIds(meeting, people) {
    const byEmail = new Map();
    for (const p of people) {
        for (const e of p.emails ?? []) {
            byEmail.set(e.toLowerCase().trim(), p.id);
        }
    }
    const byId = new Map(people.map((p) => [p.id, p]));
    const ids = [];
    const push = (id) => {
        if (id && !ids.includes(id))
            ids.push(id);
    };
    for (const email of meeting.participantEmails ?? []) {
        push(byEmail.get(email.toLowerCase().trim()));
    }
    for (const id of meeting.personIds ?? []) {
        if (byId.has(id))
            push(id);
    }
    return ids;
}
export function mergeTodoPersonIds(assigneeIds, meeting, people) {
    const ids = [...assigneeIds];
    if (meeting) {
        for (const pid of resolveMeetingPersonIds(meeting, people)) {
            if (!ids.includes(pid))
                ids.push(pid);
        }
    }
    return ids;
}
