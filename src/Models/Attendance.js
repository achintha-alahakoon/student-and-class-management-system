const { DataTypes } = require("sequelize");
const db = require("../Config/db");

const Attendance = db.define(
  "attendance",
  {
    AttendanceID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    enrolledclassID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Date: {
      type: DataTypes.DATEONLY,
    },
    Time: {
      type: DataTypes.TIME,
    },
    Status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["Present", "Absent", "Late", "Excused"]],
      },
    },
    MarkedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "System",
    },
    TenantID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "attendance",
    timestamps: false,
  },
);

module.exports = Attendance;
