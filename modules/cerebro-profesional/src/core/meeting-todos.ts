import { db } from './db';
import { normalizeTextForId, parseActionItemLine, todoStableId } from './extract-action-items';
import { mergeTodoPersonIds } from './meeting-contacts';
import type { Meeting, MeetingTodo, MeetingTodoStatus, Person, Team, TodoSourceSection } from './models';
import { cleanChipPersonName, normalizePersonNameKey } from './person-name-clean';
import { slugId } from './parse-mirror-md';

export const MANUAL_TODO_MEETING_ID = 'manual';

export interface ExtractedTodoDto {
  meetingId: string;
  text: string;
  meetingTitle?: string;
  startedAt?: string;
  teamIds?: string[];
  projectIds?: string[];
  sourceSection?: TodoSourceSection;
}

/** Resuelve asignatario por nombre exacto (chip limpio) — evita arrastrar todos los "Lucas". */
export function resolvePersonIds(label: string | undefined, people: Person[]): string[] {
  if (!label) return [];
  const key = normalizePersonNameKey(cleanChipPersonName(label));
  if (!key || key === 'el grupo' || key === 'grupo') return [];

  for (const p of people) {
    const names = [p.displayName, ...p.aliases].filter(Boolean);
    for (const n of names) {
      if (normalizePersonNameKey(cleanChipPersonName(n)) === key) return [p.id];
    }
  }

  const words = key.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const matches = people.filter((p) => {
      const dn = normalizePersonNameKey(cleanChipPersonName(p.displayName));
      return dn.split(/\s+/)[0] === words[0];
    });
    if (matches.length === 1) return [matches[0].id];
  }

  return [];
}

export function buildTodoFromExtracted(
  item: ExtractedTodoDto,
  people: Person[],
  meeting?: Meeting,
  opts?: { status?: MeetingTodo['status']; source?: MeetingTodo['source'] },
): MeetingTodo {
  const { assigneeLabel, text } = parseActionItemLine(item.text);
  const meetingId = item.meetingId;
  const assigneeIds = resolvePersonIds(assigneeLabel, people);
  const personIds = mergeTodoPersonIds(assigneeIds, meeting, people);
  const teamIds = [...new Set([...(item.teamIds ?? []), ...(meeting?.teamIds ?? [])])];
  const projectIds = [...new Set([...(item.projectIds ?? []), ...(meeting?.projectIds ?? [])])];
  const now = new Date().toISOString();
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
    status: opts?.status ?? 'suggested',
    source: opts?.source ?? 'extracted',
    sourceSection: item.sourceSection,
    extractedAt: now,
    updatedAt: now,
  };
}

export interface CreateManualTodoInput {
  id?: string;
  text: string;
  teamIds?: string[];
  projectIds?: string[];
  personIds?: string[];
  meetingId?: string;
  meetingTitle?: string;
  meetingStartedAt?: string;
  dueAt?: string;
  tags?: string[];
  notes?: string;
  categoryId?: string;
  source?: MeetingTodo['source'];
  status?: MeetingTodo['status'];
}

export async function createManualTodo(input: CreateManualTodoInput): Promise<MeetingTodo> {
  const text = input.text.trim();
  if (text.length < 3) throw new Error('El to-do debe tener al menos 3 caracteres');
  const now = new Date().toISOString();
  const linkedMeeting =
    input.meetingId && input.meetingId !== MANUAL_TODO_MEETING_ID
      ? await db.meetings.get(input.meetingId)
      : undefined;
  const todo: MeetingTodo = {
    id: input.id ?? `manual-${crypto.randomUUID()}`,
    text,
    meetingId: linkedMeeting?.id ?? MANUAL_TODO_MEETING_ID,
    meetingTitle: linkedMeeting?.title ?? input.meetingTitle,
    meetingStartedAt: linkedMeeting?.startedAt ?? input.meetingStartedAt ?? now.slice(0, 10),
    personIds: input.personIds ?? [],
    teamIds: input.teamIds ?? linkedMeeting?.teamIds ?? [],
    projectIds: input.projectIds ?? linkedMeeting?.projectIds ?? [],
    status: input.status ?? 'open',
    source: input.source ?? 'manual',
    dueAt: input.dueAt,
    tags: input.tags?.length ? input.tags : undefined,
    notes: input.notes,
    categoryId: input.categoryId,
    extractedAt: now,
    updatedAt: now,
  };
  await db.todos.put(todo);
  return todo;
}

export function isManualTodo(todo: MeetingTodo): boolean {
  return todo.source === 'manual' || todo.id.startsWith('manual-');
}

export async function updateTodo(
  id: string,
  input: CreateManualTodoInput,
): Promise<MeetingTodo> {
  const existing = await db.todos.get(id);
  if (!existing) throw new Error('To-do no encontrado');

  const text = input.text.trim();
  if (text.length < 3) throw new Error('El to-do debe tener al menos 3 caracteres');

  const linkedMeeting =
    input.meetingId && input.meetingId !== MANUAL_TODO_MEETING_ID
      ? await db.meetings.get(input.meetingId)
      : undefined;

  const now = new Date().toISOString();
  const updated: MeetingTodo = {
    ...existing,
    text,
    meetingId: linkedMeeting?.id ?? (input.meetingId ? existing.meetingId : MANUAL_TODO_MEETING_ID),
    meetingTitle: linkedMeeting?.title ?? (input.meetingId && !linkedMeeting ? existing.meetingTitle : undefined),
    meetingStartedAt:
      linkedMeeting?.startedAt ?? existing.meetingStartedAt ?? now.slice(0, 10),
    personIds: input.personIds ?? [],
    teamIds: linkedMeeting ? linkedMeeting.teamIds : (input.teamIds ?? []),
    projectIds: linkedMeeting ? linkedMeeting.projectIds : (input.projectIds ?? []),
    assigneeLabel: linkedMeeting ? existing.assigneeLabel : undefined,
    source: existing.source === 'extracted' ? existing.source : 'manual',
    dueAt: input.dueAt !== undefined ? input.dueAt : existing.dueAt,
    tags: input.tags !== undefined ? (input.tags.length ? input.tags : undefined) : existing.tags,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
    updatedAt: now,
  };

  if (!input.meetingId && !linkedMeeting) {
    updated.meetingId = MANUAL_TODO_MEETING_ID;
    updated.meetingTitle = undefined;
  }

  await db.todos.put(updated);
  return updated;
}

/** @deprecated Usar updateTodo */
export const updateManualTodo = updateTodo;

/** Upsert de un ítem extraído respetando decisiones previas del usuario. */
export async function upsertExtractedTodo(
  item: ExtractedTodoDto,
  people: Person[],
  meeting?: Meeting,
): Promise<'created' | 'updated' | 'skipped'> {
  const built = buildTodoFromExtracted(item, people, meeting);
  const prev = await db.todos.get(built.id);

  if (prev && isManualTodo(prev)) return 'skipped';
  if (prev?.status === 'dismissed') return 'skipped';

  if (prev?.status === 'open' || prev?.status === 'done') {
    await db.todos.put({
      ...prev,
      meetingTitle: built.meetingTitle,
      meetingStartedAt: built.meetingStartedAt,
      teamIds: built.teamIds,
      projectIds: built.projectIds,
      personIds: built.personIds,
      assigneeLabel: built.assigneeLabel,
      assigneePersonIds: built.assigneePersonIds,
      sourceSection: built.sourceSection ?? prev.sourceSection,
    });
    return 'updated';
  }

  if (prev?.status === 'suggested') {
    await db.todos.put({
      ...prev,
      ...built,
      status: 'suggested',
      extractedAt: prev.extractedAt,
      updatedAt: new Date().toISOString(),
    });
    return 'updated';
  }

  await db.todos.put(built);
  return 'created';
}

/** Fusiona todos extraídos del mirror con estado guardado (suggested/done/dismissed). */
export async function syncExtractedTodos(items: ExtractedTodoDto[]): Promise<number> {
  const people = await db.people.toArray();
  const meetings = await db.meetings.toArray();
  const meetingsById = new Map(meetings.map((m) => [m.id, m]));
  let upserted = 0;

  for (const item of items) {
    const meeting = meetingsById.get(item.meetingId);
    const result = await upsertExtractedTodo(item, people, meeting);
    if (result !== 'skipped') upserted++;
  }
  return upserted;
}

export interface AcceptSuggestionInput {
  dueAt?: string;
  tags?: string[];
  notes?: string;
  categoryId?: string;
  text?: string;
  teamIds?: string[];
  projectIds?: string[];
  personIds?: string[];
}

/** Acepta una sugerencia → pasa a tarea abierta (opcionalmente con fecha de recordatorio). */
export async function acceptSuggestion(
  id: string,
  input: AcceptSuggestionInput = {},
): Promise<MeetingTodo> {
  const todo = await db.todos.get(id);
  if (!todo) throw new Error('Sugerencia no encontrada');
  if (todo.status !== 'suggested') throw new Error('Solo se pueden aceptar sugerencias pendientes');

  const text = (input.text ?? todo.text).trim();
  if (text.length < 3) throw new Error('El texto debe tener al menos 3 caracteres');

  const now = new Date().toISOString();
  const newId =
    normalizeTextForId(text) !== normalizeTextForId(todo.text)
      ? todoStableId(todo.meetingId, text)
      : todo.id;

  if (newId !== todo.id) {
    const conflict = await db.todos.get(newId);
    if (conflict && conflict.status !== 'dismissed') {
      throw new Error('Ya existe una tarea con ese texto');
    }
    await db.todos.delete(id);
  }

  const accepted: MeetingTodo = {
    ...todo,
    id: newId,
    text,
    status: 'open',
    dueAt: input.dueAt ?? todo.dueAt,
    tags: input.tags?.length ? input.tags : todo.tags,
    notes: input.notes ?? todo.notes,
    categoryId: input.categoryId ?? todo.categoryId,
    teamIds: input.teamIds ?? todo.teamIds,
    projectIds: input.projectIds ?? todo.projectIds,
    personIds: input.personIds ?? todo.personIds,
    updatedAt: now,
  };
  await db.todos.put(accepted);
  return accepted;
}

/** Marca todas las sugerencias pendientes como descartadas; no toca open, done ni dismissed. */
export async function dismissAllSuggestions(): Promise<{
  dismissed: number;
  before: MeetingTodo[];
}> {
  const suggested = await db.todos.where('status').equals('suggested').toArray();
  if (suggested.length === 0) return { dismissed: 0, before: [] };

  const now = new Date().toISOString();
  const before = suggested.map((t) => ({ ...t }));
  const updated = suggested.map((t) => ({
    ...t,
    status: 'dismissed' as const,
    updatedAt: now,
  }));
  await db.todos.bulkPut(updated);
  return { dismissed: updated.length, before };
}

export async function restoreTodoSnapshotsBulk(snapshots: MeetingTodo[]): Promise<void> {
  if (!snapshots.length) return;
  await db.todos.bulkPut(snapshots);
}

export async function setTodosStatusBulk(
  ids: string[],
  status: MeetingTodoStatus,
): Promise<number> {
  let n = 0;
  for (const id of ids) {
    await setTodoStatus(id, status);
    n++;
  }
  return n;
}

export async function acceptSuggestionsBulk(
  ids: string[],
  input: AcceptSuggestionInput = {},
): Promise<number> {
  let n = 0;
  for (const id of ids) {
    const todo = await db.todos.get(id);
    if (todo?.status === 'suggested') {
      await acceptSuggestion(id, input);
      n++;
    }
  }
  return n;
}

export async function setTodoStatus(
  id: string,
  status: MeetingTodoStatus,
): Promise<void> {
  const todo = await db.todos.get(id);
  if (!todo) return;
  await db.todos.put({
    ...todo,
    status,
    completedAt: status === 'done' ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  });
}

/** Restaura un to-do exactamente como estaba (p. ej. deshacer). */
export async function restoreTodoSnapshot(snapshot: MeetingTodo): Promise<void> {
  await db.todos.put({ ...snapshot });
}

/** Elimina un to-do manual (p. ej. deshacer creación). */
export async function deleteManualTodo(id: string): Promise<void> {
  const todo = await db.todos.get(id);
  if (!todo) throw new Error('To-do no encontrado');
  if (!isManualTodo(todo)) throw new Error('Solo se pueden eliminar to-dos creados en la app');
  await db.todos.delete(id);
}

export function filterOpenTodos(todos: MeetingTodo[]): MeetingTodo[] {
  return todos.filter((t) => t.status === 'open');
}

export function filterSuggestedTodos(todos: MeetingTodo[]): MeetingTodo[] {
  return todos.filter((t) => t.status === 'suggested');
}

export function teamChip(team: Team): { id: string; name: string; color: string } {
  return { id: team.id, name: team.name, color: team.color };
}

export function projectName(projectId: string, projects: { id: string; name: string }[]): string {
  return projects.find((p) => p.id === projectId)?.name ?? slugId(projectId);
}
