const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Parent = db.define('parent', {
  ParentID: {
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
  TelNo: {
    type: DataTypes.STRING,
  },
  Email: {
    type: DataTypes.STRING,
  },
  NICNo: {
    type: DataTypes.STRING,
  },
  StudentNo: {
    type: DataTypes.STRING,
  },
  Gender: {
    type: DataTypes.STRING,
  },
  Address: {
    type: DataTypes.STRING,
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'parent',
  timestamps: false,
});

module.exports = Parent;
