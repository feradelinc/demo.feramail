const { v4: uuidv4 } = require("uuid");
const { Configuration } = require("./model");
const { isGuid } = require("../../../../support/string");

const { record: recordAction, permitted: checkPermission } = require("../../../../support/service");

const { PERMISSION_EDIT, PERMISSION_VIEW, ACTION_UPDATE } = require("./constants");
const { authorizeOwner } = require("../../../../support/owner-authorization");

exports.createOrUpdate = async (req) => {
    let { uuid, owner, name, host, port, secure, user, password } = req.body;
    if (!isGuid(owner)) owner = req.instance;
    const ownerRequest = await authorizeOwner(req, owner, PERMISSION_EDIT);

    let item = isGuid(uuid) ?
        await Configuration.findOne({
            where: { uuid, ownerUuid: owner }
        }) :
        await Configuration.byIndex({ ownerUuid: owner, name });
    
    if (!item) {
        item = await Configuration.create({ uuid: uuidv4(), ownerUuid: owner, name, host, port, secure, user, password });
    } else {
        item.host = host;
        item.port = port;
        item.secure = secure;
        item.user = user;
        item.password = password;
        await item.save();
    }
    
    await recordAction(ownerRequest, ACTION_UPDATE, item.uuid);
    return { uuid: item.uuid, success: true };
}


exports.get = async (req) => {
    await checkPermission(req, PERMISSION_VIEW);
    const where = { ownerUuid: req.instance };
    if (req.params.name) where.name = req.params.name;

    const results = await Configuration.findAll({
        where,
        attributes: [
            "uuid", "name", "host", "port", "secure", "user"
        ]
    });
    return results;
};

exports.destroy = async (req) => {
    await checkPermission(req, PERMISSION_EDIT);
    await Configuration.destroy({
        where: {
            ownerUuid: req.instance,
            uuid: req.params.uuid
        }
    });
    return { success: true };
}

