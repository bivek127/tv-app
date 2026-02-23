const authService = require('../services/auth.service');

async function register(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const { user, token } = await authService.register(email, password);
        res.status(201).json({ user, token });
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
        const { user, token } = await authService.login(email, password);
        res.json({ user, token });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

module.exports = { register, login };
