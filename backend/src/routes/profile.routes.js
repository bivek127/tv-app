const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { validateBody, updateProfileSchema, updatePasswordSchema } = require('../validation/schemas');

router.get('/', profileController.getProfile);
router.patch('/', validateBody(updateProfileSchema), profileController.updateProfile);
router.patch('/password', validateBody(updatePasswordSchema), profileController.updatePassword);

module.exports = router;
