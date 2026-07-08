const { DataTypes } = require('sequelize');
const db = require('../Config/db');
const Student = require('./Student');

const EnrolledClass = db.define('enrolledclass', {
  enrolledclassID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  StudentID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ClassID: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
