import { getGraph } from '../services/suggestions-graph.js';
export async function getGraphSnapshot(uid, opts) {
    return getGraph(uid, opts);
}
