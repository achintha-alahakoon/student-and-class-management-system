const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const EnrolledClass = db.define('enrolledclass', {
  enrolledclassID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  UserID: {
    type: DataTypes.INTEGER,
  },
  ClassID: {
    type: DataTypes.INTEGER,
  },
  TenantID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'enrolledclasses',
  timestamps: false,
});

module.exports = EnrolledClass;
