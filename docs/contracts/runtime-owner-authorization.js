const { isGuid } = require('./string');
const { permitted } = require('./service');
const { resolveOwnerInstance } = require('./api-plane-scope');

// Keep the caller's token/API identity and ask Auth about the resource owner.
// A grant in the request's tenant must not authorize a body-selected tenant.
async function authorizeOwner(req, ownerUuid, permission) {
    if (!isGuid(ownerUuid)) throw { status: 400, message: 'Email owner is required' };
    await permitted(req, permission);
    if (req.headers?.['x-feradel-owner-instance']) {
        const signedOwner = resolveOwnerInstance(req, {
            secret: process.env.FERADEL_LIFECYCLE_CALLBACK_SECRET || process.env.FERADEL_LIFECYCLE_HOOK_SECRET || '',
        });
        if (signedOwner.toLowerCase() !== ownerUuid.toLowerCase()) {
            throw { status: 403, code: 'invalid_api_plane_scope', message: 'Email owner does not match the authenticated service scope.' };
        }
        // The signed service assertion binds the resource owner to the managed
        // Email identity. Keep Auth checks and action records in that identity.
        return req;
    }
    const scoped = { ...req, instance: ownerUuid,
        headers: { ...req.headers, instance: ownerUuid, 'x-instance': ownerUuid } };
    const requested = req.headers?.instance || req.headers?.['x-instance'] || global.settings?.instance;
    if (String(requested).toLowerCase() !== ownerUuid.toLowerCase()) {
        await permitted(scoped, permission);
    }
    return scoped;
}

module.exports = { authorizeOwner };
