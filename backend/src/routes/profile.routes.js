const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);
router.patch('/password', profileController.updatePassword);

module.exports = router;
