export function mergeProviderDeclarations(providers) {
    const map = new Map();
    for (const p of providers) {
        for (const d of p.declarations)
            map.set(d.name, d);
    }
    return [...map.values()];
}
export async function executeViaProviders(providers, ctx, name, args) {
    for (const p of providers) {
        if (!p.toolNames.includes(name))
            continue;
        return p.execute(ctx, name, args);
    }
    return undefined;
}
