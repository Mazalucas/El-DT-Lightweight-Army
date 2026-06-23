import { bucket } from '../lib/firebase.js';
import { getOrganization, requireOrgRole, updateOrganization } from './org.js';
const ALLOWED_MIME = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
};
export async function uploadOrgLogo(uid, orgId, dataBase64, mimeType, fileName) {
    await requireOrgRole(orgId, uid, ['org_owner', 'org_admin']);
    const ext = ALLOWED_MIME[mimeType];
    if (!ext)
        throw new Error('Formato de imagen no soportado');
    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > 512 * 1024)
        throw new Error('Logo demasiado grande (máx. 512 KB)');
    const objectPath = `orgs/${orgId}/branding/logo.${ext}`;
    const file = bucket.file(objectPath);
    await file.save(buffer, {
        metadata: { contentType: mimeType, cacheControl: 'public, max-age=3600' },
    });
    await file.makePublic();
    const logoUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    const org = await updateOrganization(uid, orgId, {
        branding: { logoUrl },
    });
    void fileName;
    return { logoUrl, org };
}
export async function getOrgBrandingPublicUrl(orgId) {
    const org = await getOrganization(orgId);
    return org?.branding?.logoUrl;
}
