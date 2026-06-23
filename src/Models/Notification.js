const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Notification = db.define('notification', {
  NotificationID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Sender: {
    type: DataTypes.STRING,
  },
  Recipient_Type: {
    type: DataTypes.STRING,
  },
  Grade: {
    type: DataTypes.STRING,
  },
  Subject: {
    type: DataTypes.STRING,
  },
  Tutor: {
    type: DataTypes.STRING,
  },
  Date: {
    type: DataTypes.DATEONLY,
  },
  Time: {
    type: DataTypes.TIME,
  },
  Content: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'notification',
  timestamps: false,
});

module.exports = Notification;
