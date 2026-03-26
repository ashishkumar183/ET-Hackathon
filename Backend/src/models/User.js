const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // The 3-minute AI profiling progress
    onboardingComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    goal: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    interests: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    urgency: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    // Save chat history to resume later
    chatHistory: {
        type: DataTypes.JSON, 
        defaultValue: [],
    }
}, {
    timestamps: true,
    tableName: 'users'
});

module.exports = User;