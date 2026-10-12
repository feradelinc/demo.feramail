const { isGuid } = require("../../../../support/string");
const { v4: uuidv4 } = require("uuid");
const { Template } = require("./model");
const { record: recordAction, permitted: checkPermission } = require("../../../../support/service");

const { PERMISSION_EDIT, PERMISSION_VIEW, ACTION_UPDATE } = require("./constants");

const GLOBAL_OWNER = () => global.settings?.instance;

function cloneJson(value) {
    if (value == null) return value;

    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}

async function uniqueTemplateName(ownerUuid, baseName) {
    const source = String(baseName || "Imported Email Template").trim() || "Imported Email Template";
    let name = source.slice(0, 60);
    let index = 2;

    while (await Template.byIndex({ ownerUuid, name })) {
        const suffix = ` (${index})`;
        name = `${source.slice(0, 60 - suffix.length)}${suffix}`;
        index += 1;
    }

    return name;
}

exports.createOrUpdate = async (req) => {
    await checkPermission(req, PERMISSION_EDIT);

    const { uuid, category, name, from, replyTo, subject, html, meta } = req.body;
    const ownerUuid = req.instance;

    let item = null;

    if (isGuid(uuid)) {
        item = await Template.findOne({
            where: { uuid, ownerUuid },
        });
    } else {
        item = await Template.byIndex({ ownerUuid, name });
    }

    if (!item) {
        item = await Template.create({
            uuid: isGuid(uuid) ? uuid : uuidv4(),
            ownerUuid,
            category,
            name,
            from,
            replyTo,
            subject,
            html,
            meta,
        });
    } else {
        item.category = category;
        item.name = name;
        item.from = from;
        item.replyTo = replyTo;
        item.subject = subject;
        item.html = html;
        item.meta = meta;
        await item.save();
    }

    await recordAction(req, ACTION_UPDATE, item.uuid);
    return { uuid: item.uuid, success: true };
};

exports.global = async (req) => {
    await checkPermission(req, PERMISSION_VIEW);

    const results = await Template.findAll({
        where: {
            ownerUuid: GLOBAL_OWNER(),
        },
        attributes: [
            "uuid", "category", "name", "from", "replyTo", "subject", "html", "meta"
        ],
        order: [["name", "ASC"]],
    });

    return { success: Boolean(results?.length), items: results };
};

exports.register = async (req) => {
    await checkPermission(req, PERMISSION_EDIT);

    const ownerUuid = req.instance;
    const sourceUuid = req.params.uuid || req.body.uuid || req.body.parentUuid;

    if (!isGuid(ownerUuid) || !isGuid(sourceUuid)) {
        throw { status: 400, message: "Invalid email template registration." };
    }

    const source = await Template.findOne({
        where: {
            uuid: sourceUuid,
            ownerUuid: GLOBAL_OWNER(),
        },
    });

    if (!source) {
        throw { status: 404, message: "Importable email template not found." };
    }

    const name = await uniqueTemplateName(ownerUuid, req.body.name || source.name);
    const item = await Template.create({
        uuid: uuidv4(),
        ownerUuid,
        category: source.category,
        name,
        from: source.from,
        replyTo: source.replyTo,
        subject: source.subject,
        html: source.html,
        meta: cloneJson(source.meta),
    });

    await recordAction(req, ACTION_UPDATE, item.uuid);

    return {
        success: true,
        data: {
            ...item.dataValues,
            parentUuid: source.uuid,
        },
    };
};

exports.search = async (req) => {
    await checkPermission(req, PERMISSION_VIEW);

    const fields = req.params.fields;
    let attributes;

    if (fields && fields !== "ALL") {
        attributes = JSON.parse(fields);
    }

    const item = await Template.byIndex({
        ownerUuid: req.instance,
        name: req.params.named,
        attributes,
    });

    if (!item) {
        throw { status: 404, success: false, message: "Template not found" };
    }

    return item;
};

exports.get = async (req) => {
    await checkPermission(req, PERMISSION_VIEW);
    const where = {
        ownerUuid: req.instance
    };
    if (isGuid(req.params?.uuid)) {
        where.uuid = req.params.uuid
    };

    const results = await Template.findAll({
        where,
        attributes: [
            "uuid", "category", "name", "from", "replyTo", "subject", "html", "meta"
        ]
    })
    return results;
}

exports.destroy = async (req) => {
    await checkPermission(req, PERMISSION_EDIT);
    await Template.destroy({
        where: {
            ownerUuid: req.instance,
            uuid: req.params.uuid
        }
    });
    return { success: true };
}

