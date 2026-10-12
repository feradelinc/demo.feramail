const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { transform } = require("../support/rendering");

const Log = require("./Log"); // keep if used by hooks elsewhere

class Template extends Model {
  static async byIndex({ ownerUuid, name }) {
    return Template.findOne({ where: { ownerUuid, name } });
  }

  static escapeXml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  static hasXslMarkup(value = "") {
    return /<\s*xsl:/i.test(String(value || ""));
  }

  static hasXslStylesheet(value = "") {
    return /<\s*xsl:(stylesheet|transform)\b/i.test(String(value || ""));
  }

  static bodyXsl(html = "") {
    if (Template.hasXslStylesheet(html)) return html;

    const body = String(html || "");
    const content = /<[^>]+>/.test(body) ? body : Template.escapeXml(body);

    return [
      `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">`,
      `<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>`,
      `<xsl:template match="/data">${content}</xsl:template>`,
      `</xsl:stylesheet>`,
    ].join("");
  }

  xsl(area = "subject") {
    if (area === "subject") {
      const sourceSubject = this.subject || "";
      const safeSubject = Template.hasXslMarkup(sourceSubject) ? sourceSubject : Template.escapeXml(sourceSubject);
      return [
        `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">`,
        `<xsl:output method="text" encoding="UTF-8"/>`,
        `<xsl:template match="/data">${safeSubject}</xsl:template>`,
        `</xsl:stylesheet>`,
      ].join("");
    }

    // Fallback: valid no-op XSL
    return [
      `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">`,
      `<xsl:output method="text" encoding="UTF-8"/>`,
      `<xsl:template match="/data"></xsl:template>`,
      `</xsl:stylesheet>`,
    ].join("");
  }

  async build(xml) {
    try {
      const subject = await transform(this.xsl("subject"), xml);
      const body = await transform(Template.bodyXsl(this.html), xml);
      return { success: true, subject, body };
    } catch (error) {
      return {
        success: false,
        error: error?.message || String(error),
        meta: error?.meta || null,
      };
    }
  }

  async send(settings, recipient, subject, body, attachments = []) {
    try {
      const nodemailer = require("nodemailer");
      const port = Number(settings.port);

      const transporter = nodemailer.createTransport({
        host: settings.host, // e.g. email-smtp.us-east-1.amazonaws.com
        port,
        secure: port === 465 || port === 2465, // true only for TLS wrapper ports
        auth: {
          user: settings.user,      // SES SMTP username (NOT AWS access key)
          pass: settings.password,  // SES SMTP password
        },
        requireTLS: port === 587 || port === 25 || port === 2587,
      });

      const info = await transporter.sendMail({
        from: this.from,
        replyTo: this.replyTo || undefined,
        to: recipient,
        subject,
        html: body,
        attachments: Array.isArray(attachments) ? attachments : [],
      });

      return { success: true, info };
    } catch (error) {
      return {
        success: false,
        error: error?.message || String(error),
      };
    }
  }
}

Template.init(
  {
    uuid: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    ownerUuid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(10),
      defaultValue: "General",
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    from: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    replyTo: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    html: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Template",
    tableName: "Templates",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["ownerUuid", "name"],
        name: "ux_template_owner_name",
      },
    ],
  }
);

// Avoid sync() in model file; run migrations or centralized sync at app startup.
// Template.sync();

module.exports = Template;
