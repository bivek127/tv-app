const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

router.get('/', activityController.getUserActivity);

module.exports = router;
