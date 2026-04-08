const pool = require('../db');

async function findOrCreateGoogleUser(profile) {
    const email = profile.emails[0].value;
    const providerId = profile.id;

    // Check if this Google account is already linked
    const existing = await pool.query(
        'SELECT id, email, provider, created_at FROM users WHERE provider = $1 AND provider_id = $2',
        ['google', providerId]
    );
    if (existing.rows[0]) return existing.rows[0];

    // Check if email is already registered with password login
    const localUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND provider = $2',
        [email, 'local']
    );
    if (localUser.rows[0]) {
        const err = new Error('Email already registered with password login');
        err.status = 409;
        throw err;
    }

    // Create new Google user
    const result = await pool.query(
        `INSERT INTO users (email, provider, provider_id)
         VALUES ($1, 'google', $2)
         RETURNING id, email, provider, created_at`,
        [email, providerId]
    );
    return result.rows[0];
}

module.exports = { findOrCreateGoogleUser };
