const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { validateBody, loginSchema, registerSchema } = require('../validation/schemas');

// Rate limiter: 5 login attempts per minute per IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many login attempts. Please try again in a minute.' },
});

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
