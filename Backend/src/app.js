require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

// Import your Sequelize database connection
// Make sure you actually created the "config" folder and "database.js" file inside "src"!
const sequelize = require('./config/database'); 

// This will look for src/routes/index.js by default
const apiRoutes = require('./routes');

const app = express();

/* Middlewares */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Routes */
app.use('/api', apiRoutes); 

/* Health check */
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Backend is running 🚀' });
});

/* Initialize & Sync MySQL Database */
// Only sync if the sequelize object was successfully imported
if (sequelize) {
    sequelize.sync({ alter: true })
        .then(() => console.log('✅ MySQL & Sequelize Synced Successfully'))
        .catch(err => console.error('❌ Database Sync Error:', err));
}

/* Global Error Handler */
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.stack);
    res.status(500).json({ error: 'Something broke inside the server!' });
});

module.exports = app;