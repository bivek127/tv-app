const authService = require('../services/auth.service');
const logger = require('../utils/logger');
const { logActivity } = require('../services/activity.service');
const { ensureDefaultProject } = require('../services/projects.service');

// Fire-and-forget: never block auth response if default-project seeding fails.
function seedDefaultProject(userId) {
    ensureDefaultProject(userId).catch((err) => {
        logger.warn(`ensureDefaultProject failed for ${userId}: ${err.message}`);
    });
}

const REFRESH_COOKIE = 'refreshToken';
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

async function register(req, res, next) {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.register(email, password);
        res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
        logger.info(`User registered: ${email}`);
        seedDefaultProject(user.id);
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
        logActivity({ userId: user.id, action: 'user_login' });
        seedDefaultProject(user.id);
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
    // Best effort: log logout using refresh token's user_id if available
    if (rawToken) {
        try {
            const { verifyRefreshToken } = require('../utils/token');
            const payload = verifyRefreshToken(rawToken);
            logActivity({ userId: payload.id, action: 'user_logout' });
        } catch { /* token already invalid, skip logging */ }
    }
    res.json({ success: true, data: { message: 'Logged out successfully' } });
}

module.exports = { register, login, refresh, logout };
