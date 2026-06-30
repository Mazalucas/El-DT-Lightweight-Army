/** Cerebro Elements — entity refs, lifecycle, and mutation effects (SPA + Cloud Functions). */
export function entityDomId(ref) {
    return `${ref.kind}:${ref.id}`;
}
export function parseEntityDomId(value) {
    const idx = value.indexOf(':');
    if (idx <= 0)
        return null;
    const kind = value.slice(0, idx);
    const id = value.slice(idx + 1);
    if (!id)
        return null;
    return { kind, id };
}
