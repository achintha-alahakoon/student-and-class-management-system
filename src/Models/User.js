const { DataTypes } = require("sequelize");
const db = require("../Config/db");

const User = db.define(
  "user",
  {
    UserID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userrole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    TenantID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "user",
    timestamps: false,
  },
);

module.exports = User;
