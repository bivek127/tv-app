const { verifyAccessToken } = require('../utils/token');

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    } else if (req.path === '/events' && req.query.token) {
        // EventSource cannot set custom headers — allow token as query param for SSE only.
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.id, email: payload.email };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired access token' });
    }
}

module.exports = { authenticate };
