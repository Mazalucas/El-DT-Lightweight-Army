import crypto from 'node:crypto';

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function meetingIdFromDocId(docId: string): string {
  return `doc_${sha256(docId).slice(0, 16)}`;
}

export function meetingIdFromPath(sourcePath: string): string {
  return `file_${sha256(sourcePath).slice(0, 16)}`;
}
