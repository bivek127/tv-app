const pool = require('../db');

/**
 * Find a user by email.
 */
async function findUserByEmail(email) {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

/**
 * Find a user by id.
 */
async function findUserById(id) {
    const result = await pool.query(
        'SELECT id, email, name, provider, created_at FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

/**
 * Create a new local user.
 */
async function createUser(email, passwordHash) {
    const result = await pool.query(
        `INSERT INTO users (email, password_hash, provider)
         VALUES ($1, $2, 'local')
         RETURNING id, email, provider, created_at`,
        [email, passwordHash]
    );
    return result.rows[0];
}

/**
 * Find or create a user from an OAuth provider.
 */
async function findOrCreateOAuthUser(email, provider, providerId) {
    const existing = await pool.query(
        'SELECT id, email, provider, created_at FROM users WHERE provider = $1 AND provider_id = $2',
        [provider, providerId]
    );
    if (existing.rows[0]) return existing.rows[0];

    const result = await pool.query(
        `INSERT INTO users (email, provider, provider_id)
         VALUES ($1, $2, $3)
         RETURNING id, email, provider, created_at`,
        [email, provider, providerId]
    );
    return result.rows[0];
}

async function updateProfile(userId, { name }) {
    const result = await pool.query(
        `UPDATE users SET name = $1 WHERE id = $2
         RETURNING id, email, name, provider, created_at`,
        [name, userId]
    );
    return result.rows[0] || null;
}

async function updatePassword(userId, newPasswordHash) {
    await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, userId]
    );
}

module.exports = { findUserByEmail, findUserById, createUser, findOrCreateOAuthUser, updateProfile, updatePassword };
