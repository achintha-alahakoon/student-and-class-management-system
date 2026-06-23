const { DataTypes } = require('sequelize');
const db = require('../Config/db');

const Payment = db.define('payment', {
  PaymentID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  PaymentDate: {
    type: DataTypes.DATEONLY,
  },
  PaymentTime: {
    type: DataTypes.TIME,
  },
  Month: {
    type: DataTypes.STRING,
  },
  Amount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  Payment_Type: {
    type: DataTypes.STRING,
  },
  Status: {
    type: DataTypes.STRING,
  },
  StudentID: {
    type: DataTypes.INTEGER,
  },
  ClassID: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'payment',
  timestamps: false,
});

module.exports = Payment;
