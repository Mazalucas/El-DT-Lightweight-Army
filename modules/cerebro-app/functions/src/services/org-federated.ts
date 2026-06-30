import type { CerebroStore } from '../shared/types.js';
import { normalizePersonNameKey } from '../core/profesional/person-name-clean.js';
import { isProspectDismissed, isProspectIdDismissed } from '../core/profesional/prospect-dismiss.js';
import { slugId } from '../core/profesional/parse-mirror-md.js';
import { ensurePendingSuggestions } from './pending-suggestions.js';

/** Fusiona el store personal de un miembro en el target (vista federada, sin persistir). */
export function mergeMemberStoreIntoOrg(
  orgStore: CerebroStore,
  personal: CerebroStore,
  uid: string,
): number {
  ensurePendingSuggestions(orgStore);
  ensurePendingSuggestions(personal);
  let merged = 0;

  const meetingByDoc = new Map<string, number>();
  orgStore.meetings.forEach((m, i) => {
    if (m.docId) meetingByDoc.set(m.docId, i);
  });

  for (const m of personal.meetings) {
    const contributorUids = [...new Set([...(m.contributorUids ?? []), uid])];
    if (m.docId && meetingByDoc.has(m.docId)) {
      const idx = meetingByDoc.get(m.docId)!;
      const existing = orgStore.meetings[idx]!;
      orgStore.meetings[idx] = {
        ...existing,
        ...m,
        personIds: [...new Set([...existing.personIds, ...m.personIds])],
        prospectIds: [...new Set([...(existing.prospectIds ?? []), ...(m.prospectIds ?? [])])].filter(
          (id) => !isProspectIdDismissed(orgStore, id) && !isProspectIdDismissed(personal, id),
        ),
        teamIds: [...new Set([...existing.teamIds, ...m.teamIds])],
        projectIds: [...new Set([...existing.projectIds, ...m.projectIds])],
        contributorUids: [...new Set([...(existing.contributorUids ?? []), ...contributorUids])],
      };
      merged++;
    } else {
      orgStore.meetings.push({
        ...m,
        contributorUids,
        prospectIds: (m.prospectIds ?? []).filter(
          (id) => !isProspectIdDismissed(orgStore, id) && !isProspectIdDismissed(personal, id),
        ),
      });
      if (m.docId) meetingByDoc.set(m.docId, orgStore.meetings.length - 1);
    }
  }

  const peopleByEmail = new Map<string, string>();
  const peopleByName = new Map<string, string>();
  for (const p of orgStore.people) {
    for (const e of p.emails ?? []) peopleByEmail.set(e.toLowerCase(), p.id);
    peopleByName.set(normalizePersonNameKey(p.displayName), p.id);
  }
  for (const p of personal.people) {
    const email = p.emails?.[0]?.toLowerCase();
    const nameKey = normalizePersonNameKey(p.displayName);
    const existingId = (email ? peopleByEmail.get(email) : undefined) ?? peopleByName.get(nameKey);
    if (existingId) {
      const existing = orgStore.people.find((x) => x.id === existingId)!;
      existing.teamIds = [...new Set([...existing.teamIds, ...p.teamIds])];
      existing.projectIds = [...new Set([...existing.projectIds, ...(p.projectIds ?? [])])];
      existing.emails = [...new Set([...(existing.emails ?? []), ...(p.emails ?? [])])];
      existing.aliases = [...new Set([...existing.aliases, ...p.aliases])];
    } else {
      orgStore.people.push(p);
      for (const e of p.emails ?? []) peopleByEmail.set(e.toLowerCase(), p.id);
      peopleByName.set(nameKey, p.id);
    }
  }

  const prospectsByName = new Map<string, number>();
  orgStore.prospects.forEach((pr, i) => prospectsByName.set(normalizePersonNameKey(pr.displayName), i));
  for (const pr of personal.prospects) {
    if (isProspectDismissed(personal, pr) || isProspectDismissed(orgStore, pr)) continue;
    const key = normalizePersonNameKey(pr.displayName);
    const idx = prospectsByName.get(key);
    if (idx !== undefined) {
      const existing = orgStore.prospects[idx]!;
      existing.meetingIds = [...new Set([...existing.meetingIds, ...pr.meetingIds])];
      existing.aliases = [...new Set([...existing.aliases, ...pr.aliases])];
      existing.sources = [...new Set([...(existing.sources ?? []), ...(pr.sources ?? [])])];
    } else {
      orgStore.prospects.push(pr);
      prospectsByName.set(key, orgStore.prospects.length - 1);
    }
  }

  const projectsBySlug = new Map<string, string>();
  for (const p of orgStore.projects) projectsBySlug.set(slugId(p.name), p.id);
  for (const pr of personal.projects) {
    const slug = slugId(pr.name);
    const existingId = projectsBySlug.get(slug);
    if (existingId) {
      const existing = orgStore.projects.find((x) => x.id === existingId)!;
      existing.tags = [...new Set([...(existing.tags ?? []), ...(pr.tags ?? [])])];
    } else {
      const id = pr.id === slug || !orgStore.projects.some((x) => x.id === pr.id) ? slug : pr.id;
      orgStore.projects.push({ ...pr, id });
      projectsBySlug.set(slug, id);
    }
  }

  for (const t of personal.teams) {
    if (!orgStore.teams.some((x) => x.id === t.id)) orgStore.teams.push(t);
  }

  const todoIds = new Set(orgStore.todos.map((t) => t.id));
  for (const t of personal.todos) {
    if (!todoIds.has(t.id)) {
      orgStore.todos.push(t);
      todoIds.add(t.id);
    }
  }

  const pendingIds = new Set((orgStore.pendingSuggestions ?? []).map((s) => s.id));
  for (const s of orgStore.pendingSuggestions ?? []) {
    if (s.status === 'dismissed' || s.status === 'accepted') pendingIds.add(s.id);
  }
  for (const s of personal.pendingSuggestions ?? []) {
    if (s.status === 'dismissed' || s.status === 'accepted') pendingIds.add(s.id);
  }
  for (const s of personal.pendingSuggestions ?? []) {
    if (s.status === 'pending' && !pendingIds.has(s.id)) {
      orgStore.pendingSuggestions!.push(s);
      pendingIds.add(s.id);
    }
  }

  return merged;
}
