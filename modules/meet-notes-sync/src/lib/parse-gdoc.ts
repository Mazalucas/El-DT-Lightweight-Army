import fs from 'node:fs';

export interface GdocPointer {
  doc_id: string;
  email?: string;
}

export function readGdocPointer(filePath: string): GdocPointer | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw) as GdocPointer & { doc_id?: string };
    const docId = data.doc_id;
    if (!docId || typeof docId !== 'string') return null;
    return { doc_id: docId, email: data.email };
  } catch {
    return null;
  }
}
