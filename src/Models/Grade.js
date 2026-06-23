const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Grade = db.define('grade', {
  GradeID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  StudentID: {
    type: DataTypes.INTEGER,
  },
  AssignmentsID: {
    type: DataTypes.INTEGER,
  },
  Grade: {
    type: DataTypes.DECIMAL(5, 2),
  },
  Feedback: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'grades',
  timestamps: false,
});

module.exports = Grade;
