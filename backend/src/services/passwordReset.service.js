const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { hashToken } = require('../utils/token');
const usersService = require('./users.service');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cryptographically random token, store its SHA-256 hash in DB.
 * Returns the raw token so it can be sent to the user.
 */
async function createPasswordResetToken(userId) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
    );

    return rawToken;
}

/**
 * Validate token and update password.
 * Throws with appropriate status codes on failure.
 */
async function resetPassword(rawToken, newPassword) {
    const tokenHash = hashToken(rawToken);

    const result = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE token_hash = $1',
        [tokenHash]
    );
    const record = result.rows[0] || null;

    if (!record) {
        const err = new Error('Invalid or expired reset token');
        err.status = 400;
        throw err;
    }

    if (record.used_at) {
        const err = new Error('Reset token has already been used');
        err.status = 400;
        throw err;
    }

    if (new Date() > new Date(record.expires_at)) {
        const err = new Error('Reset token has expired');
        err.status = 400;
        throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and mark token as used in a single transaction
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [passwordHash, record.user_id]
        );
        await client.query(
            'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
            [tokenHash]
        );
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { createPasswordResetToken, resetPassword };
