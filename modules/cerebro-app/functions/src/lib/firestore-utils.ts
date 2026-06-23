import { FieldValue } from 'firebase-admin/firestore';

function isFirestoreSentinel(value: unknown): boolean {
  return value instanceof FieldValue;
}

/** Firestore rejects `undefined` field values — omit them before writes. */
export function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== 'object') {
    return value;
  }
  if (isFirestoreSentinel(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) {
      out[k] = isFirestoreSentinel(v) ? v : stripUndefined(v);
    }
  }
  return out as T;
}
