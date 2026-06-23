import { getGraph } from '../services/suggestions-graph.js';

export async function getGraphSnapshot(
  uid: string,
  opts?: { limit?: number; center?: string; depth?: number; types?: string[] },
) {
  return getGraph(uid, opts);
}
