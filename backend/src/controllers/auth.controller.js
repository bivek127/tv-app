const authService = require('../services/auth.service');
const { verifyRefreshToken, generateAccessToken } = require('../utils/token');
const usersService = require('../services/users.service');

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,       // set to true in production (HTTPS)
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

async function register(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const { user, accessToken, refreshToken } = await authService.register(email, password);
        res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
        res.status(201).json({ user, accessToken });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { user, accessToken, refreshToken } = await authService.login(email, password);
        res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
        res.json({ user, accessToken });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

async function refresh(req, res) {
    const token = req.cookies?.[REFRESH_COOKIE];

    if (!token) {
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
        const payload = verifyRefreshToken(token);
        const user = await usersService.findUserById(payload.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
    } catch (err) {
        // Expired or tampered refresh token → force re-login
        res.clearCookie(REFRESH_COOKIE);
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
}

async function logout(req, res) {
    res.clearCookie(REFRESH_COOKIE);
    res.json({ message: 'Logged out successfully' });
}

module.exports = { register, login, refresh, logout };
