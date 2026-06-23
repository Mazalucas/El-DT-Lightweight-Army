const MAX_CHARS = 6000;
export function compactToolResult(value) {
    const json = JSON.stringify(value);
    if (json.length <= MAX_CHARS)
        return value;
    if (Array.isArray(value)) {
        const slice = value.slice(0, 30);
        return {
            truncated: true,
            total: value.length,
            items: slice,
            note: `Mostrando ${slice.length} de ${value.length} elementos`,
        };
    }
    if (value && typeof value === 'object') {
        const obj = value;
        const out = { truncated: true };
        for (const [k, v] of Object.entries(obj)) {
            const part = JSON.stringify(v);
            if (part.length > 2000) {
                if (Array.isArray(v)) {
                    out[k] = { total: v.length, sample: v.slice(0, 10) };
                }
                else {
                    out[k] = '[truncated]';
                }
            }
            else {
                out[k] = v;
            }
        }
        return out;
    }
    return { truncated: true, preview: json.slice(0, MAX_CHARS) };
}
