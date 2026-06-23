/** Coerce legacy / Firestore values to display strings (objects, numbers, etc.). */
export function coerceString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    if (typeof row.name === 'string' && row.name.trim()) return row.name.trim();
    if (typeof row.text === 'string' && row.text.trim()) return row.text.trim();
    if (typeof row.title === 'string' && row.title.trim()) return row.title.trim();
    if (typeof row.email === 'string' && row.email.includes('@')) {
      const local = row.email.split('@')[0]?.replace(/[._+-]/g, ' ').trim();
      return local || row.email;
    }
  }
  return String(value);
}

export function truncateString(value: unknown, max: number): string | undefined {
  const text = coerceString(value, '').trim();
  if (!text) return undefined;
  return text.length > max ? text.slice(0, max) : text;
}

export function coerceStringArray(values: unknown[] | undefined, itemMax?: number): string[] {
  if (!values?.length) return [];
  const out: string[] = [];
  for (const value of values) {
    const text = itemMax != null ? truncateString(value, itemMax) : coerceString(value, '').trim();
    if (text) out.push(text);
  }
  return out;
}
