const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'system';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '1234';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;

const db = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false, // set to console.log to see SQL queries
});

db.authenticate()
  .then(() => {
    console.log('Connected to database using Sequelize');
  })
  .catch((err) => {
    console.error('Error connecting to database:', err);
  });

module.exports = db;
