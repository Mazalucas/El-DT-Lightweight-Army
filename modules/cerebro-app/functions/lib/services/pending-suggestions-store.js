import { slugId } from '../core/profesional/parse-mirror-md.js';
export function ensurePendingSuggestions(store) {
    if (!store.pendingSuggestions)
        store.pendingSuggestions = [];
    return store.pendingSuggestions;
}
export function stableSuggestionId(kind, meetingId, key) {
    const base = `${kind}:${meetingId ?? 'global'}:${slugId(key)}`;
    let h = 0;
    for (let i = 0; i < base.length; i++)
        h = (Math.imul(31, h) + base.charCodeAt(i)) >>> 0;
    return `ps-${h.toString(36)}`;
}
export function upsertPendingSuggestion(store, input) {
    const list = ensurePendingSuggestions(store);
    const key = input.stableKey ?? input.title;
    const id = stableSuggestionId(input.kind, input.meetingId, key);
    const now = new Date().toISOString();
    const existing = list.find((s) => s.id === id);
    if (existing) {
        if (existing.status === 'dismissed')
            return existing;
        existing.title = input.title;
        existing.detail = input.detail ?? existing.detail;
        existing.payload = { ...existing.payload, ...(input.payload ?? {}) };
        existing.confidence = input.confidence ?? existing.confidence;
        existing.updatedAt = now;
        return existing;
    }
    const row = {
        id,
        kind: input.kind,
        status: 'pending',
        title: input.title,
        detail: input.detail,
        payload: input.payload ?? {},
        meetingId: input.meetingId,
        source: input.source,
        confidence: input.confidence,
        createdAt: now,
        updatedAt: now,
    };
    list.push(row);
    return row;
}
export function pendingToSuggestion(row) {
    return {
        id: row.id,
        kind: row.kind,
        title: row.title,
        detail: row.detail,
        payload: row.payload,
        createdAt: row.createdAt,
    };
}
export function listActivePendingSuggestions(store) {
    return ensurePendingSuggestions(store).filter((s) => s.status === 'pending');
}
export function listActiveSuggestionsFromStore(store) {
    return listActivePendingSuggestions(store).map(pendingToSuggestion);
}
export function dismissPendingSuggestion(store, id) {
    const row = ensurePendingSuggestions(store).find((s) => s.id === id);
    if (!row || row.status !== 'pending')
        return false;
    row.status = 'dismissed';
    row.updatedAt = new Date().toISOString();
    return true;
}
export function restorePendingSuggestion(store, id) {
    const row = ensurePendingSuggestions(store).find((s) => s.id === id);
    if (!row || row.status !== 'dismissed')
        return false;
    row.status = 'pending';
    row.updatedAt = new Date().toISOString();
    return true;
}
export function restorePendingSuggestionsInStore(store, ids) {
    let restored = 0;
    for (const id of ids) {
        if (restorePendingSuggestion(store, id))
            restored++;
    }
    if (restored > 0)
        store.savedAt = new Date().toISOString();
    return restored;
}
export function revertSuggestionAcceptInStore(store, snapshot) {
    const row = ensurePendingSuggestions(store).find((s) => s.id === snapshot.suggestionId);
    if (!row || row.status !== 'accepted')
        return false;
    row.status = 'pending';
    row.updatedAt = new Date().toISOString();
    if (snapshot.meetingId) {
        const meeting = store.meetings.find((m) => m.id === snapshot.meetingId);
        if (meeting) {
            if (snapshot.addedProjectId) {
                meeting.projectIds = meeting.projectIds.filter((pid) => pid !== snapshot.addedProjectId);
            }
            if (snapshot.addedTeamId) {
                meeting.teamIds = meeting.teamIds.filter((tid) => tid !== snapshot.addedTeamId);
            }
            meeting.updatedAt = new Date().toISOString();
        }
    }
    store.savedAt = new Date().toISOString();
    return true;
}
export function revertSuggestionAcceptsInStore(store, snapshots) {
    let reverted = 0;
    for (const snap of snapshots) {
        if (revertSuggestionAcceptInStore(store, snap))
            reverted++;
    }
    return reverted;
}
export function acceptPendingSuggestion(store, id) {
    const row = ensurePendingSuggestions(store).find((s) => s.id === id);
    if (!row)
        return;
    row.status = 'accepted';
    row.updatedAt = new Date().toISOString();
}
function findOrCreateProject(store, name, tags = []) {
    const normalized = name.trim();
    const existing = store.projects.find((p) => p.name.toLowerCase() === normalized.toLowerCase());
    if (existing)
        return existing.id;
    const id = slugId(normalized);
    if (!store.projects.some((p) => p.id === id)) {
        store.projects.push({ id, name: normalized, tags });
    }
    return id;
}
export function acceptProjectSuggestionInStore(store, suggestionId, opts) {
    const row = ensurePendingSuggestions(store).find((s) => s.id === suggestionId);
    if (!row || row.kind !== 'assign_project' || row.status !== 'pending') {
        throw new Error('Sugerencia de proyecto no encontrada');
    }
    const meetingId = String(row.meetingId ?? row.payload.meetingId ?? '');
    const name = opts?.projectName?.trim() || String(row.payload.projectName ?? row.title);
    const projectId = opts?.existingProjectId ?? findOrCreateProject(store, name, []);
    let addedProjectId;
    if (meetingId) {
        const meeting = store.meetings.find((m) => m.id === meetingId);
        if (meeting && !meeting.projectIds.includes(projectId)) {
            meeting.projectIds = [...meeting.projectIds, projectId];
            meeting.updatedAt = new Date().toISOString();
            addedProjectId = projectId;
        }
    }
    acceptPendingSuggestion(store, suggestionId);
    store.savedAt = new Date().toISOString();
    return { suggestionId, meetingId, addedProjectId };
}
export function acceptTeamSuggestionInStore(store, suggestionId) {
    const row = ensurePendingSuggestions(store).find((s) => s.id === suggestionId);
    if (!row || row.kind !== 'assign_team' || row.status !== 'pending') {
        throw new Error('Sugerencia de equipo no encontrada');
    }
    const meetingId = String(row.meetingId ?? row.payload.meetingId ?? '');
    const teamId = String(row.payload.teamId ?? '');
    if (!teamId)
        throw new Error('teamId requerido en la sugerencia');
    let addedTeamId;
    if (meetingId) {
        const meeting = store.meetings.find((m) => m.id === meetingId);
        if (meeting && !meeting.teamIds.includes(teamId)) {
            meeting.teamIds = [...meeting.teamIds, teamId];
            meeting.updatedAt = new Date().toISOString();
            addedTeamId = teamId;
        }
    }
    acceptPendingSuggestion(store, suggestionId);
    store.savedAt = new Date().toISOString();
    return { suggestionId, meetingId, addedTeamId };
}
export function batchDismissSuggestionsInStore(store, ids) {
    let dismissed = 0;
    for (const id of ids) {
        if (dismissPendingSuggestion(store, id))
            dismissed++;
    }
    if (dismissed > 0)
        store.savedAt = new Date().toISOString();
    return dismissed;
}
export function batchAcceptProjectSuggestionsInStore(store, ids, opts) {
    let accepted = 0;
    let skipped = 0;
    const undoSnapshots = [];
    for (const id of ids) {
        try {
            undoSnapshots.push(acceptProjectSuggestionInStore(store, id, opts));
            accepted++;
        }
        catch {
            skipped++;
        }
    }
    return { accepted, skipped, undoSnapshots };
}
export function batchAcceptTeamSuggestionsInStore(store, ids) {
    let accepted = 0;
    let skipped = 0;
    const undoSnapshots = [];
    for (const id of ids) {
        try {
            undoSnapshots.push(acceptTeamSuggestionInStore(store, id));
            accepted++;
        }
        catch {
            skipped++;
        }
    }
    return { accepted, skipped, undoSnapshots };
}
export function emitProjectSuggestion(store, meetingId, projectName, source, opts) {
    const trimmed = projectName.trim();
    if (!trimmed || trimmed.length < 2)
        return;
    const alreadyOnMeeting = store.meetings
        .find((m) => m.id === meetingId)
        ?.projectIds.some((pid) => {
        const p = store.projects.find((x) => x.id === pid);
        return p && p.name.toLowerCase() === trimmed.toLowerCase();
    });
    if (alreadyOnMeeting)
        return;
    const inCatalog = store.projects.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (inCatalog) {
        const proj = store.projects.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
        const meeting = store.meetings.find((m) => m.id === meetingId);
        if (meeting && !meeting.projectIds.includes(proj.id)) {
            meeting.projectIds = [...meeting.projectIds, proj.id];
        }
        return;
    }
    upsertPendingSuggestion(store, {
        kind: 'assign_project',
        title: `Proyecto: ${trimmed}`,
        detail: opts?.meetingTitle,
        meetingId,
        source,
        confidence: opts?.confidence ?? 'medium',
        stableKey: trimmed,
        payload: { projectName: trimmed, meetingId },
    });
}
export function emitTeamSuggestion(store, meetingId, teamId, teamName, source) {
    const meeting = store.meetings.find((m) => m.id === meetingId);
    if (meeting?.teamIds.includes(teamId))
        return;
    upsertPendingSuggestion(store, {
        kind: 'assign_team',
        title: `Equipo: ${teamName}`,
        detail: meeting?.title,
        meetingId,
        source,
        confidence: 'medium',
        stableKey: teamId,
        payload: { teamId, teamName, meetingId },
    });
}
