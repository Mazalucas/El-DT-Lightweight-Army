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
