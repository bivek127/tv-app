const express = require('express');
const router = express.Router();
const sseController = require('../controllers/sse.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/events', authenticate, sseController.subscribe);

module.exports = router;
