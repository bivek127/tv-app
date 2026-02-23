const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
    const status = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log all 5xx errors; skip noisy 4xx client errors from logs
    if (status >= 500) {
        logger.error(`${req.method} ${req.path} → ${status}: ${err.message}`, err);
    } else {
        logger.warn(`${req.method} ${req.path} → ${status}: ${err.message}`);
    }

    res.status(status).json({
        success: false,
        error: isProduction && status >= 500 ? 'Internal server error' : err.message,
    });
}

module.exports = errorMiddleware;
