const { Configuration, Template } = require("./model");
const { record: recordAction } = require("../../../../support/service");

const { PERMISSION_SEND, ACTION_SEND } = require("./constants");
const { authorizeOwner } = require("../../../../support/owner-authorization");
const deliveryOperation = require("../../../../support/delivery-operation");
const { isGuid } = require("../../../../support/string");

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const htmlEscape = (value) => `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const firstText = (...values) => {
    for (const value of values) {
        if (hasText(value)) return value.trim();
    }
    return "";
};

const optOutUrlFrom = (values = {}) => firstText(
    values.unsubscribeUrl,
    values.optOutUrl,
    values.emailCampaignOptOutUrl,
    values.custom?.unsubscribeUrl,
    values.custom?.optOutUrl,
    values.custom?.emailCampaignOptOutUrl,
    values.json?.OptOut?.url,
    values.json?.optOut?.url,
    values.json?.Unsubscribe?.url,
    values.json?.unsubscribe?.url,
    values.json?.unsubscribeUrl,
    values.json?.emailCampaignOptOutUrl
);

const appendCampaignOptOutFooter = (body, optOutUrl) => {
    if (!hasText(optOutUrl)) return body || "";
    if (String(body || "").includes(optOutUrl)) return body || "";

    const url = htmlEscape(optOutUrl);
    return [
        body || "",
        `<hr style="border:0;border-top:1px solid #d8dee8;margin:24px 0 12px;" />`,
        `<p style="font-size:12px;line-height:1.5;color:#475569;margin:0;">`,
        `You can <a href="${url}" style="color:#0d6efd;">opt out of CRM email campaigns</a>.`,
        `</p>`
    ].join("");
};

const formattedAddress = ({ display, from }) => {
    if (!hasText(display)) return from;
    return { name: display.trim(), address: from };
};

const ownerDefaultSender = async (ownerUuid) => {
    const templates = await Template.findAll({
        where: { ownerUuid },
        attributes: ["from"],
        order: [["updatedAt", "DESC"]],
    });

    const template = templates.find((item) => looksLikeEmail(item.from));
    return template?.from?.trim() || null;
};

const createTransport = (settings) => {
    const nodemailer = require("nodemailer");
    const port = Number(settings.port);

    return nodemailer.createTransport({
        host: settings.host,
        port,
        secure: port === 465 || port === 2465,
        auth: {
            user: settings.user,
            pass: settings.password,
        },
        requireTLS: port === 587 || port === 25 || port === 2587,
    });
};

const sendRaw = async ({
    settings,
    from,
    display,
    to,
    cc,
    bcc,
    subject,
    body,
    attachments,
    fallbackFrom,
}) => {
    const transporter = createTransport(settings);
    const sender = hasText(from) ? from.trim() : fallbackFrom;

    if (!looksLikeEmail(sender)) {
        throw { status: 400, message: "Sender email is required" };
    }

    if (!hasText(to)) {
        throw { status: 400, message: "Recipient is required" };
    }

    const info = await transporter.sendMail({
        from: formattedAddress({ display, from: sender }),
        to,
        cc: hasText(cc) ? cc : undefined,
        bcc: hasText(bcc) ? bcc : undefined,
        subject: subject || "",
        html: body || "",
        attachments: Array.isArray(attachments) ? attachments : [],
    });

    return { success: true, info };
};

const attachRendered = (result, rendered) => ({
    ...result,
    rendered
});

// Exercise the same owner and configuration checks as delivery without sending
// mail, creating a delivery operation, or exposing SMTP credentials.
exports.preflight = async (req) => {
    const ownerUuid = req.query.owner ?? req.instance;
    await authorizeOwner(req, ownerUuid, PERMISSION_SEND);
    const settings = await Configuration.byIndex({ ownerUuid, name: req.query.configuration ?? req.query.name });
    if (!settings) throw { status: 404, message: "Configuration not found" };
    const template = hasText(req.query.name)
        ? await Template.byIndex({ ownerUuid, name: req.query.name }) : null;
    return { success: true, configurationReady: true, templateAvailable: Boolean(template) };
};

exports.send = async (req) => {
    const {
        name,
        configuration,
        xml,
        recipient,
        to,
        cc,
        bcc,
        from,
        display,
        subject,
        body,
        json,
        custom,
        unsubscribeUrl,
        optOutUrl,
        emailCampaignOptOutUrl,
        attachments,
        owner
    } = req.body;

    const ownerUuid = owner ?? req.instance;
    const ownerRequest = await authorizeOwner(req, ownerUuid, PERMISSION_SEND);

    const settings = await Configuration.byIndex({
        ownerUuid,
        name: configuration ?? name,
    });

    if (!settings) {
        throw { status: 404, message: "Configuration not found" };
    }

    if (!hasText(name)) {
        const fallbackFrom = await ownerDefaultSender(ownerUuid);
        const renderedBody = appendCampaignOptOutFooter(body || "", optOutUrlFrom({
            json,
            custom,
            unsubscribeUrl,
            optOutUrl,
            emailCampaignOptOutUrl
        }));
        const rendered = {
            from: hasText(from) ? from.trim() : fallbackFrom,
            display,
            to: to || recipient,
            cc,
            bcc,
            subject: subject || "",
            body: renderedBody,
            html: renderedBody,
            attachments: Array.isArray(attachments) ? attachments.map((attachment) => ({
                filename: attachment?.filename || attachment?.name || attachment?.path || null,
                cid: attachment?.cid || null
            })) : []
        };

        const sendMessage = () => sendRaw({
            settings,
            from,
            display,
            to: to || recipient,
            cc,
            bcc,
            subject,
            body: renderedBody,
            attachments,
            fallbackFrom,
        });
        const result = req.body.operationId === undefined ? await sendMessage() : await deliveryOperation.dispatch({
            operationId: req.body.operationId, ownerUuid, actorUuid: req.user, referenceUuid: settings.uuid,
            payload: { request: req.body, rendered }, send: sendMessage, clientBinding: req.body.completionDelivery,
        });

        if (result?.success && !result.duplicate) {
            await recordAction(ownerRequest, ACTION_SEND, settings.uuid);
        }

        return attachRendered(result, rendered);
    }

    const template = await Template.byIndex({
        ownerUuid,
        name,
    });

    if (!template) {
        throw { status: 404, message: "Template not found" };
    }

    const built = await template.build(xml);
    const renderedBody = appendCampaignOptOutFooter(built.body || "", optOutUrlFrom({
        json,
        custom,
        unsubscribeUrl,
        optOutUrl,
        emailCampaignOptOutUrl
    }));
    const rendered = {
        template: name,
        from: template.from,
        replyTo: template.replyTo,
        to: recipient,
        subject: built.subject || "",
        body: renderedBody,
        html: renderedBody,
        attachments: Array.isArray(attachments) ? attachments.map((attachment) => ({
            filename: attachment?.filename || attachment?.name || attachment?.path || null,
            cid: attachment?.cid || null
        })) : []
    };

    if (!built?.success) {
        return attachRendered(built, rendered);
    }

    const sendMessage = () => template.send(
        settings,
        recipient,
        built.subject,
        renderedBody,
        Array.isArray(attachments) ? attachments : []
    );
    const result = req.body.operationId === undefined ? await sendMessage() : await deliveryOperation.dispatch({
        operationId: req.body.operationId, ownerUuid, actorUuid: req.user, referenceUuid: template.uuid,
        payload: { request: req.body, rendered }, send: sendMessage, clientBinding: req.body.completionDelivery,
    });

    if (result?.success && !result.duplicate) {
        await recordAction(ownerRequest, ACTION_SEND, template.uuid);
    }

    return attachRendered(result, rendered);
};

exports.receipt = async req => {
    if (!isGuid(req.params.operationId) || !isGuid(req.user)) throw { status: 404, message: 'Email operation not found' };
    const item = await deliveryOperation.Operation.findOne({ where: { uuid: req.params.operationId, actorUuid: req.user } });
    if (!item) throw { status: 404, message: 'Email operation not found' };
    await authorizeOwner(req, item.ownerUuid, PERMISSION_SEND);
    return { success: item.state === 'accepted', operationId: item.uuid, state: item.state,
        payloadSha256: item.payloadSha256, clientBinding: item.clientBinding,
        ...(item.state === 'accepted' ? { info: deliveryOperation.receipt({ success: true, info: item.receipt }) } : {}) };
};
