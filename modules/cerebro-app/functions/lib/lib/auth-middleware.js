import { getAuth } from 'firebase-admin/auth';
export async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'unauthorized', message: 'Bearer token required' });
        return;
    }
    try {
        const token = header.slice(7);
        const decoded = await getAuth().verifyIdToken(token);
        req.uid = decoded.uid;
        next();
    }
    catch {
        res.status(401).json({ error: 'invalid_token' });
    }
}
export function getUid(req) {
    if (!req.uid)
        throw new Error('Missing uid');
    return req.uid;
}
export async function getUserEmail(uid) {
    const user = await getAuth().getUser(uid);
    return (user.email ?? '').toLowerCase();
}
/** Primer nombre para saludo en digest/dashboard. */
export async function getUserFirstName(uid) {
    const user = await getAuth().getUser(uid);
    const fromDisplay = user.displayName?.trim().split(/\s+/)[0];
    if (fromDisplay)
        return fromDisplay;
    const emailLocal = user.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim().split(/\s+/)[0];
    if (emailLocal)
        return emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1);
    return 'ahí';
}
