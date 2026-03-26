const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize (Database name, Username, Password)
const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, 
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false // Set to true if you want to see the raw SQL queries in the terminal
    }
);

module.exports = sequelize;