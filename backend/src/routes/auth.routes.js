const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const passwordResetController = require('../controllers/passwordReset.controller');
const { issueTokens } = require('../services/auth.service');
const { logActivity } = require('../services/activity.service');
const logger = require('../utils/logger');
const {
    validateBody,
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require('../validation/schemas');

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
router.post('/forgot-password', validateBody(forgotPasswordSchema), passwordResetController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), passwordResetController.resetPassword);

// ── Google OAuth ─────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const { accessToken, refreshToken } = await issueTokens(req.user);
            res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
            logger.info(`Google OAuth login: ${req.user.email}`);
            logActivity({ userId: req.user.id, action: 'user_login_google' });
            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendURL}/?token=${accessToken}`);
        } catch (err) {
            logger.error(`Google OAuth callback error: ${err.message}`);
            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendURL}/login?error=oauth_failed`);
        }
    }
);

module.exports = router;
