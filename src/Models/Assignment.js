const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Assignment = db.define('assignment', {
  AssignmentsID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  assignment_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  UploadDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  ClassID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  assignment_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'assignments',
  timestamps: false,
});

module.exports = Assignment;
