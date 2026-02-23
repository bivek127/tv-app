const pool = require('../db');

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Store a hashed refresh token in the database.
 */
async function storeRefreshToken(userId, tokenHash) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const result = await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, tokenHash, expiresAt]
    );
    return result.rows[0];
}

/**
 * Find a refresh token record by its hash.
 * Returns null if not found.
 */
async function findByHash(tokenHash) {
    const result = await pool.query(
        `SELECT * FROM refresh_tokens WHERE token_hash = $1`,
        [tokenHash]
    );
    return result.rows[0] || null;
}

/**
 * Mark a single token as revoked by its hash.
 */
async function revokeByHash(tokenHash) {
    await pool.query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
        [tokenHash]
    );
}

/**
 * Revoke ALL active refresh tokens for a user.
 * Called on reuse-attack detection.
 */
async function revokeAllForUser(userId) {
    await pool.query(
        `UPDATE refresh_tokens SET revoked_at = NOW()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
    );
}

module.exports = { storeRefreshToken, findByHash, revokeByHash, revokeAllForUser };
