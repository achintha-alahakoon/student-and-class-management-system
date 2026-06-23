const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const EnrolledClass = db.define('enrolledclass', {
  enrolledclassID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  UserID: {
    type: DataTypes.INTEGER,
  },
  ClassID: {
    type: DataTypes.INTEGER,
  },
  TutorID: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'enrolledclasses',
  timestamps: false,
});

module.exports = EnrolledClass;
