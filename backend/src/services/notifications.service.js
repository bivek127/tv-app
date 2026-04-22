const pool = require('../db');

const DEFAULTS = {
    email_enabled: false,
    push_enabled: false,
};

async function getPreferences(userId) {
    const result = await pool.query(
        `SELECT email_enabled, push_enabled
         FROM notification_preferences
         WHERE user_id = $1`,
        [userId]
    );
    if (result.rows.length === 0) return { ...DEFAULTS };
    return result.rows[0];
}

async function upsertPreferences(userId, { email_enabled, push_enabled }) {
    const result = await pool.query(
        `INSERT INTO notification_preferences (user_id, email_enabled, push_enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
             email_enabled = EXCLUDED.email_enabled,
             push_enabled  = EXCLUDED.push_enabled,
             updated_at    = NOW()
         RETURNING email_enabled, push_enabled`,
        [userId, email_enabled, push_enabled]
    );
    return result.rows[0];
}

async function savePushSubscription(userId, { endpoint, p256dh, auth }) {
    await pool.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (endpoint) DO UPDATE SET
             user_id = EXCLUDED.user_id,
             p256dh  = EXCLUDED.p256dh,
             auth    = EXCLUDED.auth`,
        [userId, endpoint, p256dh, auth]
    );
}

async function deletePushSubscription(userId, endpoint) {
    await pool.query(
        `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
        [userId, endpoint]
    );
}

async function getPushSubscriptions(userId) {
    const result = await pool.query(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
        [userId]
    );
    return result.rows;
}

/**
 * Find all pending reminders whose `reminder_at` has passed. Only includes
 * tasks whose owner has at least one notification channel enabled, and
 * which are still open (not done). Returns one row per task.
 */
async function getPendingReminders() {
    const result = await pool.query(
        `
        SELECT
            t.id           AS task_id,
            t.title        AS title,
            t.due_date     AS due_date,
            t.reminder_at  AS reminder_at,
            t.project_id   AS project_id,
            p.name         AS project_name,
            u.id           AS user_id,
            u.email        AS email,
            u.name         AS user_name,
            np.email_enabled,
            np.push_enabled
        FROM tasks t
        JOIN users u                     ON u.id = t.user_id
        JOIN notification_preferences np ON np.user_id = u.id
        LEFT JOIN projects p             ON p.id = t.project_id
        WHERE
            t.reminder_at IS NOT NULL
            AND t.reminder_sent_at IS NULL
            AND t.reminder_at <= NOW()
            AND t.status <> 'done'
            AND (np.email_enabled = true OR np.push_enabled = true)
        ORDER BY t.reminder_at ASC
        LIMIT 500
        `
    );
    return result.rows;
}

async function markReminderSent(taskId) {
    await pool.query(
        `UPDATE tasks SET reminder_sent_at = NOW() WHERE id = $1`,
        [taskId]
    );
}

module.exports = {
    getPreferences,
    upsertPreferences,
    savePushSubscription,
    deletePushSubscription,
    getPushSubscriptions,
    getPendingReminders,
    markReminderSent,
};
