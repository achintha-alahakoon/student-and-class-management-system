const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Tutor = db.define('tutor', {
  TutorID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  FirstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  LastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    NICNo: {
    type: DataTypes.STRING,
  },
  Gender: {
    type: DataTypes.STRING,
  },
  Birthday: {
    type: DataTypes.DATEONLY,
  },
    TelNo: {
    type: DataTypes.STRING,
  },
    Email: {
    type: DataTypes.STRING,
  },
    Subject: {
    type: DataTypes.STRING,
  },
  Address: {
    type: DataTypes.STRING,
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  TenantID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'tutor',
  timestamps: false,
});

module.exports = Tutor;
