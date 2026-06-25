const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const ParentChild = db.define('parentchild', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ParentID: {
    type: DataTypes.INTEGER,
  },
  StudentID: {
    type: DataTypes.INTEGER,
  },
  FirstName: {
    type: DataTypes.STRING,
  },
  TenantID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  LastName: {
    type: DataTypes.STRING,
  },
  Grade: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'parentchildren',
  timestamps: false,
});

module.exports = ParentChild;
