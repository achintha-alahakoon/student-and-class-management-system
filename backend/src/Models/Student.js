const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Student = db.define('student', {
  StudentID: {
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
  Gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Grade: {
    type: DataTypes.STRING,
  },
  Birthday: {
    type: DataTypes.DATEONLY,
  },
  Address: {
    type: DataTypes.STRING,
  },
  TelNo: {
    type: DataTypes.STRING,
  },
  Email: {
    type: DataTypes.STRING,
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'student',
  timestamps: false,
});

module.exports = Student;
