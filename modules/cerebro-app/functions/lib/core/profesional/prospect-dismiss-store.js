import { collectDismissedProspectKeys, collectProspectNameKeys, } from './prospect-dismiss.js';
function collectDismissedProspectKeysFromProspect(prospect) {
    return collectDismissedProspectKeys(prospect);
}
export function applyProspectDismissInStore(store, prospectId) {
    const meetingIds = [];
    const prospect = store.prospects.find((p) => p.id === prospectId);
    const dismissedKeysAdded = [];
    const dismissedKeys = new Set(store.dismissedProspectKeys ?? []);
    const dismissedIds = new Set(store.dismissedProspectIds ?? []);
    const addKeys = (keys) => {
        for (const key of keys) {
            if (!dismissedKeys.has(key))
                dismissedKeysAdded.push(key);
            dismissedKeys.add(key);
        }
    };
    if (prospect) {
        addKeys(collectDismissedProspectKeysFromProspect(prospect));
        dismissedIds.add(prospectId);
        store.prospects = store.prospects.filter((p) => p.id !== prospectId);
    }
    else {
        dismissedIds.add(prospectId);
        const slugAsName = prospectId.replace(/-\d+$/, '').replace(/-/g, ' ');
        addKeys(collectProspectNameKeys(slugAsName));
    }
    store.dismissedProspectKeys = [...dismissedKeys];
    store.dismissedProspectIds = [...dismissedIds];
    const now = new Date().toISOString();
    for (const m of store.meetings) {
        if (!m.prospectIds?.includes(prospectId))
            continue;
        m.prospectIds = m.prospectIds.filter((id) => id !== prospectId);
        m.updatedAt = now;
        meetingIds.push(m.id);
    }
    store.savedAt = now;
    const undoSnapshot = {
        prospectId,
        prospect: prospect ? { ...prospect } : undefined,
        meetingIds,
        dismissedKeysAdded,
    };
    return { affectedMeetingIds: meetingIds, undoSnapshot };
}
export function applyProspectRestoreInStore(store, snapshot) {
    const dismissedKeys = new Set(store.dismissedProspectKeys ?? []);
    const dismissedIds = new Set(store.dismissedProspectIds ?? []);
    dismissedIds.delete(snapshot.prospectId);
    for (const key of snapshot.dismissedKeysAdded)
        dismissedKeys.delete(key);
    store.dismissedProspectKeys = [...dismissedKeys];
    store.dismissedProspectIds = [...dismissedIds];
    if (snapshot.prospect) {
        const exists = store.prospects.some((p) => p.id === snapshot.prospectId);
        if (!exists)
            store.prospects.push({ ...snapshot.prospect });
    }
    const now = new Date().toISOString();
    for (const meetingId of snapshot.meetingIds) {
        const meeting = store.meetings.find((m) => m.id === meetingId);
        if (!meeting)
            continue;
        if (meeting.prospectIds?.includes(snapshot.prospectId))
            continue;
        meeting.prospectIds = [...(meeting.prospectIds ?? []), snapshot.prospectId];
        meeting.updatedAt = now;
    }
    store.savedAt = now;
}
