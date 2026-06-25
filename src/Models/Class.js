const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Class = db.define('class', {
  ClassID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  Tutor: {
    type: DataTypes.STRING,
  },
  Fees: {
    type: DataTypes.DECIMAL(10, 2),
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
