/**
 * Suggestion Engine v2 — sugerencias generadas por LLM con evidencia, ranking y caducidad.
 *
 * Corre tras cada pipeline (y tras el batch de análisis IA). Lee el store
 * normalizado + mirrors recientes, y produce SmartSuggestions accionables:
 * follow-ups detectados en transcripts, compromisos sin tarea, reuniones sin
 * próximos pasos, relaciones que se enfrían. Cada una con evidencia citada y
 * una acción de un click. Sin API key, no genera nada (modo básico).
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  CerebroStore,
  DailyDigest,
  Meeting,
  SmartSuggestion,
  SmartSuggestionAction,
  SmartSuggestionEvidence,
  SmartSuggestionKind,
} from '../shared/types.js';
import { digestsCol, smartSuggestionsCol } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { callUserLlmJson, userHasLlmKey } from './llm-service.js';
import { getMirrorContent } from './sync.js';
import { loadStore, saveStore } from './store.js';
import { listSmartSuggestions, saveSmartSuggestions } from './smart-suggestions.js';
import {
  materializeSmartTodoCandidatesInStore,
  type SmartTodoCandidate,
} from '../core/profesional/meeting-todos-store.js';

const MAX_SUGGESTIONS = 8;
const RECENT_MEETING_WINDOW_DAYS = 14;
const MAX_RECENT_MEETINGS = 8;
const MAX_MIRROR_FETCH = 3;
const MIRROR_SNIPPET_CHARS = 6000;
const COOLING_DAYS = 30;
const DEFAULT_EXPIRY_DAYS = 7;

const VALID_KINDS: SmartSuggestionKind[] = [
  'follow_up',
  'commitment',
  'no_next_steps',
  'reconnect',
  'prepare',
  'insight',
];

interface RawSuggestion {
  kind?: string;
  title?: string;
  reason?: string;
  evidence?: SmartSuggestionEvidence;
  action?: { kind?: string; payload?: Record<string, unknown> };
  score?: number;
  expiresInDays?: number;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

function recentMeetings(store: CerebroStore): Meeting[] {
  const cutoff = daysAgo(RECENT_MEETING_WINDOW_DAYS).toISOString();
  return [...store.meetings]
    .filter((m) => m.startedAt && m.startedAt >= cutoff)
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
    .slice(0, MAX_RECENT_MEETINGS);
}

function coolingRelationships(store: CerebroStore): Array<{ name: string; personId: string; lastMeeting: string; count: number }> {
  const byPerson = new Map<string, { count: number; last: string }>();
  for (const m of store.meetings) {
    if (!m.startedAt) continue;
    for (const pid of m.personIds) {
      const prev = byPerson.get(pid);
      if (!prev) byPerson.set(pid, { count: 1, last: m.startedAt });
      else byPerson.set(pid, { count: prev.count + 1, last: m.startedAt > prev.last ? m.startedAt : prev.last });
    }
  }
  const cutoff = daysAgo(COOLING_DAYS).toISOString();
  const result: Array<{ name: string; personId: string; lastMeeting: string; count: number }> = [];
  for (const [pid, info] of byPerson) {
    if (info.count >= 3 && info.last < cutoff) {
      const person = store.people.find((p) => p.id === pid);
      if (person) result.push({ name: person.displayName, personId: pid, lastMeeting: info.last, count: info.count });
    }
  }
  return result.sort((a, b) => b.count - a.count).slice(0, 5);
}

async function buildContext(uid: string, store: CerebroStore): Promise<string> {
  const meetings = recentMeetings(store);
  const todosByMeeting = new Map<string, { total: number; open: number }>();
  for (const t of store.todos) {
    const entry = todosByMeeting.get(t.meetingId) ?? { total: 0, open: 0 };
    entry.total++;
    if (t.status === 'open' || t.status === 'suggested') entry.open++;
    todosByMeeting.set(t.meetingId, entry);
  }

  const lines: string[] = [];
  lines.push(`Fecha de hoy: ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push('## Reuniones recientes');

  let mirrorsFetched = 0;
  for (const m of meetings) {
    const counts = todosByMeeting.get(m.id);
    lines.push('');
    lines.push(`### [${m.id}] ${m.title} — ${m.startedAt?.slice(0, 10) ?? 'sin fecha'}`);
    lines.push(`Participantes: ${m.participants.join(', ') || 'desconocidos'}`);
    lines.push(`Tareas extraídas: ${counts?.total ?? 0} (${counts?.open ?? 0} abiertas)`);
    if (m.summary) lines.push(`Resumen IA: ${m.summary}`);
    if (m.actionItems?.length) lines.push(`Action items del doc: ${m.actionItems.join(' | ')}`);
    if (!m.summary && mirrorsFetched < MAX_MIRROR_FETCH) {
      mirrorsFetched++;
      try {
        const md = await getMirrorContent(uid, m.id);
        if (md) {
          const body = md.replace(/^---[\s\S]*?---\n/, '').trim().slice(0, MIRROR_SNIPPET_CHARS);
          lines.push(`Notas (extracto):\n${body}`);
        }
      } catch {
        /* mirror no disponible — seguimos con metadata */
      }
    }
  }

  const openTodos = store.todos
    .filter((t) => t.status === 'open')
    .sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999'))
    .slice(0, 30);
  lines.push('');
  lines.push('## Tareas abiertas');
  if (!openTodos.length) lines.push('(ninguna)');
  for (const t of openTodos) {
    lines.push(`- "${t.text}"${t.dueAt ? ` (vence ${t.dueAt.slice(0, 10)})` : ''}${t.meetingTitle ? ` — de «${t.meetingTitle}»` : ''}`);
  }

  const cooling = coolingRelationships(store);
  if (cooling.length) {
    lines.push('');
    lines.push(`## Relaciones sin contacto reciente (>${COOLING_DAYS} días)`);
    for (const c of cooling) {
      lines.push(`- ${c.name} [personId: ${c.personId}] — última reunión ${c.lastMeeting.slice(0, 10)}, ${c.count} reuniones en total`);
    }
  }

  return lines.join('\n');
}

const SYSTEM_INSTRUCTION = `Sos el motor de inteligencia de Cerebro, una app de productividad profesional.
Analizás reuniones, tareas y relaciones del usuario y generás sugerencias ACCIONABLES en español rioplatense.

Reglas estrictas:
- Solo sugerí cosas con evidencia real en los datos. Nunca inventes reuniones, personas ni compromisos.
- Cada sugerencia cita su evidencia (reunión + fecha, o cita textual de las notas).
- Priorizá: compromisos asumidos sin tarea creada > follow-ups con fecha próxima > reuniones sin próximos pasos > relaciones que se enfrían > insights.
- Máximo ${MAX_SUGGESTIONS} sugerencias. Mejor 3 buenas que 8 mediocres.
- No repitas sugerencias equivalentes a las ya descartadas por el usuario (lista provista).
- score: 0-100 según urgencia (fechas cercanas o vencidas = alto) y relevancia.
- PROHIBIDO sugerir solo metadata (equipo, proyecto, fecha de reunión). Cada title debe ser un verbo + objeto concreto.
- Al menos la mitad de las sugerencias deben tener action.kind = "create_todo" con payload.text accionable (imperativo, ≤120 chars).
- Nunca uses como title el nombre del equipo, proyecto o título de reunión.

Respondé SOLO con JSON válido:
{
  "suggestions": [
    {
      "kind": "follow_up|commitment|no_next_steps|reconnect|prepare|insight",
      "title": "imperativo corto, ej: Enviar propuesta a Ana",
      "reason": "por qué, citando evidencia, ej: En «Reunión X» (10/06) quedaste en enviarla el martes",
      "evidence": { "meetingId": "...", "meetingTitle": "...", "meetingDate": "YYYY-MM-DD", "quote": "cita textual si existe", "personNames": ["..."] },
      "action": { "kind": "create_todo|open_meeting|open_person|none", "payload": { "text": "...", "dueAt": "YYYY-MM-DD", "meetingId": "...", "personId": "..." } },
      "score": 80,
      "expiresInDays": 7
    }
  ]
}`;

function sanitizeSuggestion(raw: RawSuggestion, now: string): SmartSuggestion | null {
  const kind = VALID_KINDS.includes(raw.kind as SmartSuggestionKind) ? (raw.kind as SmartSuggestionKind) : null;
  const title = raw.title?.trim();
  const reason = raw.reason?.trim();
  if (!kind || !title || !reason) return null;

  const actionKind = raw.action?.kind;
  const action: SmartSuggestionAction =
    actionKind === 'create_todo' || actionKind === 'open_meeting' || actionKind === 'open_person'
      ? { kind: actionKind, payload: raw.action?.payload }
      : { kind: 'none' };

  const score = Math.max(0, Math.min(100, Math.round(raw.score ?? 50)));
  const expiresDays = Math.max(1, Math.min(30, Math.round(raw.expiresInDays ?? DEFAULT_EXPIRY_DAYS)));

  return {
    id: uuidv4(),
    kind,
    title: title.slice(0, 140),
    reason: reason.slice(0, 500),
    evidence: raw.evidence,
    action,
    score,
    status: 'pending',
    expiresAt: new Date(Date.now() + expiresDays * 86400000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

async function listRecentlyHandled(uid: string): Promise<string[]> {
  const cutoff = daysAgo(30).toISOString();
  const [dismissed, accepted] = await Promise.all([
    smartSuggestionsCol(uid).where('status', '==', 'dismissed').get(),
    smartSuggestionsCol(uid).where('status', '==', 'accepted').get(),
  ]);
  return [...dismissed.docs, ...accepted.docs]
    .map((d) => d.data() as SmartSuggestion)
    .filter((s) => s.updatedAt >= cutoff)
    .map((s) => s.title);
}

export interface SuggestionEngineResult {
  generated: number;
  skipped?: 'no_llm' | 'no_data';
}

export async function runSuggestionEngine(uid: string): Promise<SuggestionEngineResult> {
  if (!(await userHasLlmKey(uid))) return { generated: 0, skipped: 'no_llm' };

  const store = await loadStore(uid);
  if (!store.meetings.length) return { generated: 0, skipped: 'no_data' };

  const [context, handledTitles, previousPending] = await Promise.all([
    buildContext(uid, store),
    listRecentlyHandled(uid),
    listSmartSuggestions(uid, { status: 'pending' }),
  ]);

  const handledBlock = handledTitles.length
    ? `\n## Sugerencias ya resueltas o descartadas (NO repetir)\n${handledTitles.map((t) => `- ${t}`).join('\n')}\n`
    : '';

  const raw = await callUserLlmJson(uid, `${context}${handledBlock}\n\nGenerá las sugerencias.`, {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.3,
  });

  let parsed: { suggestions?: RawSuggestion[] };
  try {
    parsed = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, '').trim()) as { suggestions?: RawSuggestion[] };
  } catch {
    throw new Error('Suggestion Engine: respuesta LLM no es JSON válido');
  }

  const now = new Date().toISOString();
  const fresh: SmartSuggestion[] = [];
  const seen = new Set<string>();
  for (const r of parsed.suggestions ?? []) {
    const s = sanitizeSuggestion(r, now);
    if (!s) continue;
    const key = normalizeTitle(s.title);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(s);
    if (fresh.length >= MAX_SUGGESTIONS) break;
  }

  // Las pendientes anteriores se reemplazan por la nueva generación; si una se
  // repite (mismo título), conserva su id para no perder referencias.
  const expireOld: SmartSuggestion[] = [];
  for (const old of previousPending) {
    const match = fresh.find((s) => normalizeTitle(s.title) === normalizeTitle(old.title));
    if (match) {
      match.id = old.id;
      match.createdAt = old.createdAt;
    } else {
      expireOld.push({ ...old, status: 'expired', updatedAt: now });
    }
  }

  await saveSmartSuggestions(uid, [...expireOld, ...fresh]);

  const todoCandidates: SmartTodoCandidate[] = fresh
    .filter((s) => s.action.kind === 'create_todo')
    .map((s) => {
      const payload = s.action.payload ?? {};
      const text = String(payload.text ?? s.title).trim();
      const meetingId = String(s.evidence?.meetingId ?? payload.meetingId ?? '').trim() || undefined;
      return {
        text,
        meetingId,
        meetingTitle: s.evidence?.meetingTitle,
        meetingStartedAt: s.evidence?.meetingDate,
        dueAt: typeof payload.dueAt === 'string' ? payload.dueAt : undefined,
      };
    })
    .filter((c) => c.text.length >= 10);

  if (todoCandidates.length) {
    const storeAfter = await loadStore(uid);
    const materialized = materializeSmartTodoCandidatesInStore(storeAfter, todoCandidates);
    if (materialized > 0) {
      storeAfter.savedAt = new Date().toISOString();
      await saveStore(uid, storeAfter);
    }
  }

  return { generated: fresh.length };
}

// --- Digest diario ---

const DIGEST_SYSTEM = `Sos el asistente diario de Cerebro. Generás un digest corto y útil en español rioplatense.
Respondé SOLO con JSON válido:
{
  "headline": "una frase con lo más importante de hoy",
  "summary": "2-3 frases con el estado general: reuniones recientes, tareas, focos",
  "focus": ["3 a 5 bullets concretos de en qué enfocarse hoy"]
}
No inventes datos. Si hay poco que decir, sé breve.`;

export async function generateDailyDigest(uid: string): Promise<DailyDigest | null> {
  if (!(await userHasLlmKey(uid))) return null;

  const store = await loadStore(uid);
  const suggestions = await listSmartSuggestions(uid, { status: 'pending', limit: 5 });

  const today = new Date().toISOString().slice(0, 10);
  const dueTodos = store.todos.filter(
    (t) => t.status === 'open' && t.dueAt && t.dueAt.slice(0, 10) <= today,
  );
  const meetings = recentMeetings(store).slice(0, 5);

  const lines: string[] = [];
  lines.push(`Fecha: ${today}`);
  lines.push(`Tareas que vencen hoy o vencidas: ${dueTodos.length}`);
  for (const t of dueTodos.slice(0, 10)) lines.push(`- "${t.text}" (vence ${t.dueAt?.slice(0, 10)})`);
  lines.push(`Tareas abiertas en total: ${store.todos.filter((t) => t.status === 'open').length}`);
  lines.push('');
  lines.push('Reuniones recientes:');
  for (const m of meetings) lines.push(`- ${m.title} (${m.startedAt?.slice(0, 10)})${m.summary ? `: ${m.summary.slice(0, 200)}` : ''}`);
  lines.push('');
  lines.push('Sugerencias top del motor:');
  for (const s of suggestions) lines.push(`- [${s.kind}] ${s.title} — ${s.reason}`);

  const raw = await callUserLlmJson(uid, lines.join('\n'), {
    systemInstruction: DIGEST_SYSTEM,
    temperature: 0.4,
  });

  let parsed: { headline?: string; summary?: string; focus?: string[] };
  try {
    parsed = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, '').trim()) as typeof parsed;
  } catch {
    return null;
  }
  if (!parsed.headline || !parsed.summary) return null;

  const digest: DailyDigest = {
    id: today,
    date: today,
    generatedAt: new Date().toISOString(),
    headline: parsed.headline.slice(0, 200),
    summary: parsed.summary.slice(0, 1000),
    focus: (parsed.focus ?? []).slice(0, 5).map((f) => String(f).slice(0, 200)),
    suggestionIds: suggestions.map((s) => s.id),
  };

  await digestsCol(uid).doc(today).set(stripUndefined(digest as unknown as Record<string, unknown>));
  return digest;
}

/** Embeddings + engine + digest en secuencia; errores se loguean sin romper el pipeline. */
export async function runIntelligence(uid: string): Promise<{ suggestions: number; digest: boolean }> {
  let suggestions = 0;
  let digest = false;
  try {
    const { indexMeetingEmbeddings } = await import('./embeddings.js');
    await indexMeetingEmbeddings(uid);
  } catch (e) {
    console.error(`[intelligence] indexado de embeddings falló para ${uid}:`, e);
  }
  try {
    const r = await runSuggestionEngine(uid);
    suggestions = r.generated;
  } catch (e) {
    console.error(`[intelligence] suggestion engine falló para ${uid}:`, e);
  }
  try {
    digest = (await generateDailyDigest(uid)) !== null;
  } catch (e) {
    console.error(`[intelligence] digest falló para ${uid}:`, e);
  }
  return { suggestions, digest };
}
