const pool = require('../db');

/**
 * Inserts a row into activity_logs.
 * Fire-and-forget — errors are swallowed so logging never blocks the main request.
 *
 * @param {{ userId, action, entityType?, entityId?, metadata? }} params
 */
async function logActivity({ userId, action, entityType = null, entityId = null, metadata = null }) {
    try {
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null]
        );
    } catch (err) {
        // Never crash the request because of a logging failure
        console.error('[activity] Failed to log activity:', err.message);
    }
}

/**
 * Fetch all activity logs for a given user, newest first.
 */
async function getActivityByUserId(userId) {
    const result = await pool.query(
        `SELECT id, action, entity_type, entity_id, metadata, created_at
         FROM activity_logs
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows;
}

module.exports = { logActivity, getActivityByUserId };
