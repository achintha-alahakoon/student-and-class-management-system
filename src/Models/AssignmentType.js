const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const AssignmentType = db.define('assignment_type', {
  assignment_type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'assignment_type',
  timestamps: false,
});

module.exports = AssignmentType;
