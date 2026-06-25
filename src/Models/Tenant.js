const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Tenant = db.define('tenant', {
  TenantID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'tenant',
  timestamps: false,
});

module.exports = Tenant;
