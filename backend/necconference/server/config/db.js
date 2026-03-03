/*
  This file now exports a Sequelize instance configured for MySQL.
  The previous MongoDB / mongoose connection has been replaced.
  Environment variables should include:
    DB_NAME, DB_USER, DB_PASS, DB_HOST (optional), DB_PORT (optional)
*/
const { Sequelize } = require('sequelize');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME || 'necconference',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
            logging: false, // disable verbose logging
            define: {
                // automatically add createdAt/updatedAt fields
                timestamps: true
            }
        }
);

// raw connection pool for legacy queries (payments, etc.)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'necconference',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    queueLimit: 0
});

// tune Sequelize pool as well for production concurrency
sequelize.options.pool = {
    max: parseInt(process.env.SEQ_POOL_MAX, 10) || 20,
    min: parseInt(process.env.SEQ_POOL_MIN, 10) || 2,
    acquire: parseInt(process.env.SEQ_POOL_ACQUIRE, 10) || 30000,
    idle: parseInt(process.env.SEQ_POOL_IDLE, 10) || 10000
};

// simple helper to test connection and apply any pending model definitions
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL Connected - Conference Database');
            // sync will create/alter tables to match models.
            // Using { force: false } to avoid the "too many keys" error in development
            // because alter: true would try to modify existing tables and hit the 64-key MySQL limit
            await sequelize.sync({ force: false });
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB, db };