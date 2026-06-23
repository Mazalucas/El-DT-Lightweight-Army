/**
 * Embeddings de mirrors para búsqueda semántica y RAG del asistente.
 *
 * Indexa el contenido de las notas de reunión (mirrors GCS) en chunks con
 * vectores BYOK (Gemini text-embedding-004 u OpenAI text-embedding-3-small),
 * persistidos en Firestore. La búsqueda calcula similitud coseno en memoria —
 * suficiente para cientos de reuniones por usuario.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { LlmProviderId, SemanticSearchHit } from '../shared/types.js';
import { meetingEmbeddingsCol } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { getUserLlmCredentials, userHasLlmKey } from './llm-service.js';
import { getMirrorContent, listMeetings } from './sync.js';

const EMBEDDING_MODELS: Record<LlmProviderId, string> = {
  google_gemini: 'text-embedding-004',
  openai: 'text-embedding-3-small',
};

const CHUNK_CHARS = 1500;
const CHUNK_OVERLAP = 200;
const MAX_CHUNKS_PER_MEETING = 12;
const MAX_MEETINGS_PER_RUN = 40;

export interface EmbeddedChunk {
  idx: number;
  text: string;
  vector: number[];
}

export interface MeetingEmbeddingDoc {
  meetingId: string;
  title: string;
  startedAt?: string;
  contentHash?: string;
  model: string;
  chunks: EmbeddedChunk[];
  indexedAt: string;
}

function chunkText(body: string): string[] {
  const chunks: string[] = [];
  let pos = 0;
  while (pos < body.length && chunks.length < MAX_CHUNKS_PER_MEETING) {
    chunks.push(body.slice(pos, pos + CHUNK_CHARS));
    pos += CHUNK_CHARS - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedTexts(uid: string, texts: string[]): Promise<{ model: string; vectors: number[][] }> {
  const { providerId, key } = await getUserLlmCredentials(uid);
  const model = EMBEDDING_MODELS[providerId];

  if (providerId === 'google_gemini') {
    const gen = new GoogleGenerativeAI(key);
    const m = gen.getGenerativeModel({ model });
    const vectors: number[][] = [];
    // batchEmbedContents admite hasta 100 requests por llamada
    for (let i = 0; i < texts.length; i += 100) {
      const batch = texts.slice(i, i + 100);
      const r = await m.batchEmbedContents({
        requests: batch.map((text) => ({ content: { role: 'user', parts: [{ text }] } })),
      });
      for (const e of r.embeddings) vectors.push(e.values);
    }
    return { model, vectors };
  }

  const client = new OpenAI({ apiKey: key });
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += 512) {
    const batch = texts.slice(i, i + 512);
    const r = await client.embeddings.create({ model, input: batch });
    for (const d of r.data) vectors.push(d.embedding);
  }
  return { model, vectors };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Indexa mirrors nuevos o cambiados. Devuelve cuántas reuniones se indexaron. */
export async function indexMeetingEmbeddings(uid: string, opts?: { force?: boolean }): Promise<number> {
  if (!(await userHasLlmKey(uid))) return 0;

  const manifest = (await listMeetings(uid)).filter((m) => m.syncStatus === 'synced');
  if (!manifest.length) return 0;

  const existingSnap = await meetingEmbeddingsCol(uid).select('contentHash').get();
  const existingHash = new Map<string, string | undefined>();
  for (const d of existingSnap.docs) {
    existingHash.set(d.id, (d.data() as { contentHash?: string }).contentHash);
  }

  let indexed = 0;
  for (const entry of manifest) {
    if (indexed >= MAX_MEETINGS_PER_RUN) break;
    const known = existingHash.get(entry.meetingId);
    const upToDate = existingHash.has(entry.meetingId) && known === entry.contentHash;
    if (upToDate && !opts?.force) continue;

    const md = await getMirrorContent(uid, entry.meetingId);
    if (!md) continue;
    const body = md.replace(/^---[\s\S]*?---\n/, '').trim();
    if (!body) continue;

    const chunks = chunkText(body);
    const { model, vectors } = await embedTexts(uid, chunks);

    const doc: MeetingEmbeddingDoc = {
      meetingId: entry.meetingId,
      title: entry.title,
      startedAt: entry.startedAt,
      contentHash: entry.contentHash,
      model,
      chunks: chunks.map((text, idx) => ({ idx, text, vector: vectors[idx] ?? [] })),
      indexedAt: new Date().toISOString(),
    };
    await meetingEmbeddingsCol(uid).doc(entry.meetingId).set(stripUndefined(doc));
    indexed++;
  }
  return indexed;
}

/** Búsqueda semántica sobre mirrors indexados. Devuelve null si no hay índice o key. */
export async function semanticSearchMeetings(
  uid: string,
  query: string,
  limit = 8,
): Promise<SemanticSearchHit[] | null> {
  if (!query.trim()) return [];
  if (!(await userHasLlmKey(uid))) return null;

  const snap = await meetingEmbeddingsCol(uid).limit(500).get();
  if (snap.empty) return null;

  const { vectors } = await embedTexts(uid, [query]);
  const qv = vectors[0];
  if (!qv) return null;

  const hits: SemanticSearchHit[] = [];
  for (const d of snap.docs) {
    const doc = d.data() as MeetingEmbeddingDoc;
    let best = 0;
    let bestChunk: EmbeddedChunk | undefined;
    for (const chunk of doc.chunks) {
      const score = cosine(qv, chunk.vector);
      if (score > best) {
        best = score;
        bestChunk = chunk;
      }
    }
    if (bestChunk && best > 0.3) {
      hits.push({
        meetingId: doc.meetingId,
        title: doc.title,
        startedAt: doc.startedAt,
        score: Math.round(best * 1000) / 1000,
        snippet: bestChunk.text.slice(0, 400),
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
