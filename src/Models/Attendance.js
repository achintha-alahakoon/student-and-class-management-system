const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Attendance = db.define('attendance', {
  AttendanceID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  enrolledclassID: {
    type: DataTypes.INTEGER,
  },
  Status: {
    type: DataTypes.STRING,
  },
  AttendanceDate: {
    type: DataTypes.DATEONLY,
  },
  AttendanceTime: {
    type: DataTypes.TIME,
  },
}, {
  tableName: 'attendance',
  timestamps: false,
});

module.exports = Attendance;
