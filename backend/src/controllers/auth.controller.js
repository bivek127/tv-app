const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,      // set to true in production (HTTPS)
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

async function register(req, res, next) {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.register(email, password);
        res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
        logger.info(`User registered: ${email}`);
        res.status(201).json({ success: true, data: { user, accessToken } });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.login(email, password);
        res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
        logger.info(`User logged in: ${email}`);
        res.json({ success: true, data: { user, accessToken } });
    } catch (err) {
        next(err);
    }
}

async function refresh(req, res, next) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];

    if (!rawToken) {
        return res.status(401).json({ success: false, error: 'No refresh token provided' });
    }

    try {
        const { accessToken, refreshToken: newRefreshToken } = await authService.rotateRefreshToken(rawToken);
        // Set the NEW rotated refresh token cookie — old one is now revoked in DB
        res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS);
        res.json({ success: true, data: { accessToken } });
    } catch (err) {
        // Clear cookie on any refresh failure (expired, reuse, invalid)
        res.clearCookie(REFRESH_COOKIE);
        // Pass to global error handler (already has the right status on err.status)
        next(err);
    }
}

async function logout(req, res, next) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    try {
        if (rawToken) {
            await authService.revokeRefreshToken(rawToken);
        }
    } catch (err) {
        // Don't block logout even if DB revocation fails
        logger.warn(`Logout token revocation failed: ${err.message}`);
    }
    res.clearCookie(REFRESH_COOKIE);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
}

module.exports = { register, login, refresh, logout };
