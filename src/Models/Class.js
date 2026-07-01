const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Class = db.define('class', {
  ClassID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ClassName: { 
    type: DataTypes.STRING,
  },
  Subject: {
    type: DataTypes.STRING,
  },
  Grade: {
    type: DataTypes.STRING,
  },
  TutorID: {
    type: DataTypes.INTEGER,
  },
  Fees: {
    type: DataTypes.DECIMAL(10, 2),
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive:  { 
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  TenantID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'class',
  timestamps: false,
});

module.exports = Class;
