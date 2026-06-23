import { upsertAiActionItemsAsTodos } from './meeting-todos-store.js';
import { emitProjectSuggestion, ensurePendingSuggestions, } from '../../services/pending-suggestions.js';
export function applyAnalysisToStoreInMemory(store, analysis) {
    ensurePendingSuggestions(store);
    const meeting = store.meetings.find((m) => m.id === analysis.meetingId);
    if (meeting) {
        if (analysis.summary)
            meeting.summary = analysis.summary;
        if (analysis.actionItems)
            meeting.actionItems = analysis.actionItems;
        meeting.analysisStatus = analysis.needsReview ? 'needs_review' : 'analyzed';
        meeting.updatedAt = new Date().toISOString();
        const projectNames = [
            ...(analysis.projects ?? []),
            ...(analysis.themes ?? []).filter((t) => t.length >= 3 && t.length <= 80),
        ];
        for (const pname of projectNames) {
            emitProjectSuggestion(store, analysis.meetingId, pname, 'ai', {
                confidence: analysis.confidence ?? 'medium',
                meetingTitle: meeting.title,
            });
        }
    }
    if (analysis.actionItems?.length) {
        upsertAiActionItemsAsTodos(store, analysis.meetingId, analysis.actionItems);
    }
    return store;
}
