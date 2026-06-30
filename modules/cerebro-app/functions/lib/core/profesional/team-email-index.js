export function buildTeamEmailIndex(teams) {
    const map = new Map();
    for (const team of teams) {
        for (const raw of team.emails ?? []) {
            const email = raw.toLowerCase().trim();
            if (email)
                map.set(email, team.id);
        }
    }
    return map;
}
export function normalizeTeamEmails(emails) {
    const out = [];
    const seen = new Set();
    for (const raw of emails ?? []) {
        const email = raw.toLowerCase().trim();
        if (!email || !email.includes('@') || seen.has(email))
            continue;
        seen.add(email);
        out.push(email);
    }
    return out;
}
export function looksLikeTeamEmail(email) {
    const lower = email.toLowerCase();
    return (lower.includes('group') ||
        lower.startsWith('team-') ||
        lower.includes('equipo') ||
        lower.includes('all-') ||
        lower.includes('noreply') ||
        lower.includes('no-reply'));
}
