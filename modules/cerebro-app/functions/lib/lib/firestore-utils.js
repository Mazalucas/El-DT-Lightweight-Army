import { FieldValue } from 'firebase-admin/firestore';
function isFirestoreSentinel(value) {
    return value instanceof FieldValue;
}
/** Firestore rejects `undefined` field values — omit them before writes. */
export function stripUndefined(value) {
    if (value === undefined || value === null || typeof value !== 'object') {
        return value;
    }
    if (isFirestoreSentinel(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => stripUndefined(item));
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (v !== undefined) {
            out[k] = isFirestoreSentinel(v) ? v : stripUndefined(v);
        }
    }
    return out;
}
