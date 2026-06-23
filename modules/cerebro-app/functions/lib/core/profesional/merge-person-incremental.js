/** Campos que el operador edita a mano — no se pisan en reindex. */
export function hasManualPersonData(p) {
    return ((p.teamIds?.length ?? 0) > 0 ||
        (p.projectIds?.length ?? 0) > 0 ||
        Boolean(p.notes?.trim()));
}
export function mergePersonPreservingManual(existing, incoming) {
    const emails = [...new Set([...(existing.emails ?? []), ...(incoming.emails ?? [])])];
    const emailMeta = { ...(existing.emailMeta ?? {}) };
    for (const [e, metaRaw] of Object.entries(incoming.emailMeta ?? {})) {
        const meta = metaRaw;
        const prev = emailMeta[e];
        emailMeta[e] = prev
            ? {
                sources: [...new Set([...prev.sources, ...meta.sources])],
                firstSeenAt: prev.firstSeenAt ?? meta.firstSeenAt,
                lastSeenAt: meta.lastSeenAt ?? prev.lastSeenAt,
            }
            : meta;
    }
    const aliases = new Set([...existing.aliases, ...incoming.aliases]);
    if (incoming.displayName !== existing.displayName)
        aliases.add(incoming.displayName);
    return {
        ...existing,
        emails,
        emailMeta,
        aliases: [...aliases].filter((a) => a !== existing.displayName),
        // Manual siempre gana
        displayName: existing.displayName,
        teamIds: existing.teamIds,
        projectIds: existing.projectIds ?? [],
        notes: existing.notes,
    };
}
export function isValidContact(p) {
    return (p.emails?.length ?? 0) > 0;
}
