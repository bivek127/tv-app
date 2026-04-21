const pool = require('../db');

const DEFAULTS = {
    email_enabled: false,
    push_enabled: false,
    remind_days_before: [1],
};

async function getPreferences(userId) {
    const result = await pool.query(
        `SELECT email_enabled, push_enabled, remind_days_before
         FROM notification_preferences
         WHERE user_id = $1`,
        [userId]
    );
    if (result.rows.length === 0) return { ...DEFAULTS };
    return result.rows[0];
}

async function upsertPreferences(userId, { email_enabled, push_enabled, remind_days_before }) {
    const result = await pool.query(
        `INSERT INTO notification_preferences (user_id, email_enabled, push_enabled, remind_days_before)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET
             email_enabled      = EXCLUDED.email_enabled,
             push_enabled       = EXCLUDED.push_enabled,
             remind_days_before = EXCLUDED.remind_days_before,
             updated_at         = NOW()
         RETURNING email_enabled, push_enabled, remind_days_before`,
        [userId, email_enabled, push_enabled, remind_days_before]
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
 * Find users whose notification prefs include `daysFromNow`, and who have
 * at least one task due in exactly that many days. Returns each user along
 * with their due tasks for that window.
 */
async function getUsersForReminder(daysFromNow) {
    const result = await pool.query(
        `
        SELECT
            u.id        AS user_id,
            u.email     AS email,
            u.name      AS name,
            np.email_enabled,
            np.push_enabled,
            json_agg(
                json_build_object(
                    'id',           t.id,
                    'title',        t.title,
                    'due_date',     t.due_date,
                    'project_id',   t.project_id,
                    'project_name', p.name
                ) ORDER BY t.due_date ASC
            ) AS tasks
        FROM users u
        JOIN notification_preferences np ON np.user_id = u.id
        JOIN tasks t                     ON t.user_id = u.id
        LEFT JOIN projects p             ON p.id = t.project_id
        WHERE
            (np.email_enabled = true OR np.push_enabled = true)
            AND $1 = ANY (np.remind_days_before)
            AND t.due_date IS NOT NULL
            AND t.status <> 'done'
            AND DATE(t.due_date) = (CURRENT_DATE + ($1 || ' days')::INTERVAL)::DATE
        GROUP BY u.id, u.email, u.name, np.email_enabled, np.push_enabled
        `,
        [daysFromNow]
    );
    return result.rows;
}

module.exports = {
    getPreferences,
    upsertPreferences,
    savePushSubscription,
    deletePushSubscription,
    getPushSubscriptions,
    getUsersForReminder,
};
