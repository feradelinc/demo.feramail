const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { isGuid } = require("../support/string");

class Configuration extends Model {
  static async add({ uuid, name, type }) {
    await Configuration.upsert({ uuid, name, type });
  }

  static async byUuid({ uuid }) {
    if (!isGuid(uuid)) return null;
    
    const result = await Configuration.findOne({
      where: {
        uuid
      }
    });
    return result;
  }

  static async byIndex({ ownerUuid, name }) {    
    const result = await Configuration.findOne({
      where: {
        ownerUuid, name
      }
    });
    return result;
  }

}

Configuration.init(
  {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    ownerUuid: {
      type: DataTypes.UUID
    },
    name: {
      type: DataTypes.STRING(128),
      required: true,
    },
    host: {
      type: DataTypes.STRING(320),
    },
    port: {
      type: DataTypes.INTEGER,
      defaultValue: 587
    },
    secure: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    user: {
      type: DataTypes.STRING(128)
    },
    password: {
      type: DataTypes.STRING(128)
    }
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: "Configuration", // We need to choose the model name
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["ownerUuid", "name"], // Secondary unique index
      },
    ],
  }
);

Configuration.sync();
module.exports = Configuration;
