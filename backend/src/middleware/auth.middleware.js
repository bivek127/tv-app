const { verifyAccessToken } = require('../utils/token');

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    const token = authHeader.slice(7);

    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.id, email: payload.email };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired access token' });
    }
}

module.exports = { authenticate };
