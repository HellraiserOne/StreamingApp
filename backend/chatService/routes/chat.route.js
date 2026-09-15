const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/chat.controller');

router.get('/history/:videoId', authenticate, controller.listHistory);

module.exports = router;
