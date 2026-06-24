const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const UserMessageReadStatus = db.define('usermessagereadstatus', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userID: {
    type: DataTypes.INTEGER,
  },
  messageID: {
    type: DataTypes.INTEGER,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
  },
}, {
  tableName: 'usermessagereadstatus',
  timestamps: false,
});

module.exports = UserMessageReadStatus;
