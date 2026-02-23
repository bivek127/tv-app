const authService = require('../services/auth.service');
const { verifyRefreshToken, generateAccessToken } = require('../utils/token');
const usersService = require('../services/users.service');
const logger = require('../utils/logger');

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,       // set to true in production (HTTPS)
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

async function register(req, res, next) {
    try {
        // req.body already validated by Zod middleware
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
    const token = req.cookies?.[REFRESH_COOKIE];

    if (!token) {
        return res.status(401).json({ success: false, error: 'No refresh token provided' });
    }

    try {
        const payload = verifyRefreshToken(token);
        const user = await usersService.findUserById(payload.id);
        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }
        const accessToken = generateAccessToken(user);
        res.json({ success: true, data: { accessToken } });
    } catch (err) {
        res.clearCookie(REFRESH_COOKIE);
        res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }
}

async function logout(req, res) {
    res.clearCookie(REFRESH_COOKIE);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
}

module.exports = { register, login, refresh, logout };
