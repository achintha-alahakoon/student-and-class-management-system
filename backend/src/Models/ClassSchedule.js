const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const ClassSchedule = db.define('classschedule', {
  ScheduleID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ScheduleDate: {
    type: DataTypes.DATEONLY,
  },
  Start_Time: {
    type: DataTypes.TIME,
  },
  Repeat_On: {
    type: DataTypes.STRING,
  },
  Hall_Num: {
    type: DataTypes.STRING,
  },
  End_Time: {
    type: DataTypes.TIME,
  },
  ClassID: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'classschedule',
  timestamps: false,
});

module.exports = ClassSchedule;
