import type { CerebroStore, GraphSnapshot, OrgMember, Suggestion } from '../shared/types.js';
import { getUserEmail } from '../lib/auth-middleware.js';
import { sortMeetingsByRecency } from '../domain/meeting-sort.js';
import { isLikelyPersonName, normalizePersonNameKey } from '../core/profesional/person-name-clean.js';
import { isProspectDismissed, listActiveProspectsForMaintenance } from '../core/profesional/prospect-dismiss.js';
import { looksLikeTeamEmail } from '../core/profesional/team-email-index.js';
import { listActiveSuggestionsFromStore } from './pending-suggestions.js';
import { buildGraphSnapshot } from './graph-edges.js';
import { loadStore } from './store.js';

export type DerivedSuggestionsOptions = {
  /** Límite de prospects en la lista (default 25). `null` = sin límite (mantenimiento). */
  maxProspects?: number | null;
};

export { listActiveProspectsForMaintenance } from '../core/profesional/prospect-dismiss.js';

export function buildDerivedSuggestions(
  store: CerebroStore,
  opts?: DerivedSuggestionsOptions,
): Suggestion[] {
  const now = new Date().toISOString();
  const out: Suggestion[] = [];
  const maxProspects = opts?.maxProspects ?? 25;

  for (const t of store.todos.filter((x) => x.status === 'suggested').slice(0, 20)) {
    out.push({
      id: `todo-${t.id}`,
      kind: 'accept_todo',
      title: t.text.slice(0, 120),
      detail: t.meetingTitle,
      payload: { todoId: t.id },
      createdAt: t.updatedAt ?? now,
    });
  }

  const activeProspects = listActiveProspectsForMaintenance(store);
  const prospectRows =
    maxProspects === null ? activeProspects : activeProspects.slice(0, Math.max(0, maxProspects));

  for (const p of prospectRows) {
    out.push({
      id: `prospect-${p.id}`,
      kind: 'promote_prospect',
      title: p.displayName,
      detail: `${p.meetingIds.length} reuniones sin email`,
      payload: { prospectId: p.id },
      createdAt: p.lastSeenAt ?? now,
    });
  }

  for (const m of sortMeetingsByRecency(store.meetings.filter((x) => x.analysisStatus === 'needs_review')).slice(0, 10)) {
    out.push({
      id: `meeting-${m.id}`,
      kind: 'review_meeting',
      title: m.title,
      detail: 'Revisar análisis IA',
      payload: { meetingId: m.id },
      createdAt: m.updatedAt,
    });
  }

  const dismissedMerge = new Set(store.dismissedMergeContactKeys ?? []);

  const byEmail = new Map<string, string[]>();
  for (const p of store.people) {
    for (const e of p.emails ?? []) {
      const key = e.toLowerCase();
      if (!byEmail.has(key)) byEmail.set(key, []);
      byEmail.get(key)!.push(p.id);
    }
  }
  for (const [email, ids] of byEmail) {
    if (ids.length < 2) continue;
    const suggestionId = `merge-email-${email}`;
    if (dismissedMerge.has(suggestionId)) continue;
    out.push({
      id: suggestionId,
      kind: 'merge_contacts',
      title: `Unificar ${ids.length} contactos`,
      detail: email,
      payload: { personIds: ids, reason: 'same_email' },
      createdAt: now,
    });
  }

  const nameBuckets = new Map<string, string[]>();
  for (const p of store.people) {
    const key = normalizePersonNameKey(p.displayName);
    if (key.split(/\s+/).length < 2) continue;
    if (!nameBuckets.has(key)) nameBuckets.set(key, []);
    nameBuckets.get(key)!.push(p.id);
  }
  for (const [name, ids] of nameBuckets) {
    if (ids.length < 2) continue;
    const suggestionId = `merge-name-${name}`;
    if (dismissedMerge.has(suggestionId)) continue;
    out.push({
      id: suggestionId,
      kind: 'merge_contacts',
      title: `¿Mismo contacto? (${ids.length})`,
      detail: name,
      payload: { personIds: ids, reason: 'similar_name' },
      createdAt: now,
    });
  }

  const teamEmailSet = new Set(
    store.teams.flatMap((t) => (t.emails ?? []).map((e) => e.toLowerCase())),
  );
  for (const p of store.people) {
    for (const e of p.emails ?? []) {
      const lower = e.toLowerCase();
      const dismissKey = `${p.id}:${lower}`;
      if ((store.dismissedTeamEmailKeys ?? []).includes(dismissKey)) continue;
      if (teamEmailSet.has(lower)) continue;
      const looksTeam =
        looksLikeTeamEmail(lower) || normalizePersonNameKey(p.displayName) === normalizePersonNameKey(lower);
      if (!looksTeam) continue;
      const local = lower.split('@')[0] ?? '';
      const suggestedTeam = store.teams.find(
        (t) => t.name.toLowerCase().includes(local) || local.includes(t.id),
      );
      out.push({
        id: `reassign-team-email-${p.id}-${lower}`,
        kind: 'reassign_team_email',
        title: `Mover email de equipo: ${e}`,
        detail: p.displayName,
        payload: { personId: p.id, email: e, suggestedTeamId: suggestedTeam?.id },
        createdAt: now,
      });
    }
  }

  return out;
}

export function buildSuggestionsFromStore(store: CerebroStore): Suggestion[] {
  const pending = listActiveSuggestionsFromStore(store);
  const derived = buildDerivedSuggestions(store);
  const seen = new Set<string>();
  const merged: Suggestion[] = [];

  for (const s of [...pending, ...derived]) {
    const key = `${s.kind}:${s.title}:${JSON.stringify(s.payload)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(s);
  }

  return merged.slice(0, 80);
}

export async function getSuggestions(uid: string): Promise<Suggestion[]> {
  const store = await loadStore(uid);
  return buildSuggestionsFromStore(store);
}

export function buildGraphFromStore(
  store: CerebroStore,
  opts?: {
    limit?: number;
    center?: string;
    depth?: number;
    types?: string[];
    members?: OrgMember[];
    userEmail?: string;
    memberUid?: string;
  },
): GraphSnapshot {
  return buildGraphSnapshot(store, opts);
}

export async function getGraph(
  uid: string,
  opts?: { limit?: number; center?: string; depth?: number; types?: string[] },
): Promise<GraphSnapshot> {
  const store = await loadStore(uid);
  const userEmail = await getUserEmail(uid);
  return buildGraphSnapshot(store, { ...opts, userEmail, memberUid: uid });
}
