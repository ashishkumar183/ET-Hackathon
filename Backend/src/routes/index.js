const express = require('express');
const router = express.Router();

// Import our controllers
const { register, login } = require('../controllers/authController');
const { handleChat } = require('../controllers/chatController');

// --- AUTHENTICATION ROUTES ---
router.post('/auth/register', register);
router.post('/auth/login', login);

// --- AI CONCIERGE ROUTE ---
router.post('/chat', handleChat);

module.exports = router;