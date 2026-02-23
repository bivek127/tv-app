const usersService = require('./users.service');
const refreshTokensService = require('./refreshTokens.service');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/token');

const SALT_ROUNDS = 10;

/**
 * Issue tokens, store refresh token hash in DB, return both tokens.
 * Shared by register and login.
 */
async function issueTokens(user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);
    await refreshTokensService.storeRefreshToken(user.id, tokenHash);
    return { accessToken, refreshToken };
}

async function register(email, password) {
    const existing = await usersService.findUserByEmail(email);
    if (existing) {
        const err = new Error('Email already in use');
        err.status = 409;
        throw err;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await usersService.createUser(email, passwordHash);
    const { accessToken, refreshToken } = await issueTokens(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
}

async function login(email, password) {
    const user = await usersService.findUserByEmail(email);
    if (!user) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
}

/**
 * Rotate refresh token:
 * 1. Verify token exists in DB and is not expired/revoked.
 * 2. If found but revoked → REUSE ATTACK → revoke all tokens for that user.
 * 3. If valid → revoke old, issue new access + refresh tokens.
 */
async function rotateRefreshToken(rawToken) {
    const tokenHash = hashToken(rawToken);
    const record = await refreshTokensService.findByHash(tokenHash);

    if (!record) {
        const err = new Error('Invalid refresh token');
        err.status = 401;
        throw err;
    }

    // Reuse detected — token was already revoked
    if (record.revoked_at) {
        await refreshTokensService.revokeAllForUser(record.user_id);
        const err = new Error('Refresh token reuse detected — all sessions revoked');
        err.status = 401;
        throw err;
    }

    // Token expired
    if (new Date() > new Date(record.expires_at)) {
        await refreshTokensService.revokeByHash(tokenHash);
        const err = new Error('Refresh token expired');
        err.status = 401;
        throw err;
    }

    // Valid — revoke old token, issue new pair
    await refreshTokensService.revokeByHash(tokenHash);

    const user = await usersService.findUserById(record.user_id);
    if (!user) {
        const err = new Error('User not found');
        err.status = 401;
        throw err;
    }

    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);
    return { accessToken, refreshToken: newRefreshToken, user };
}

/**
 * Logout: mark refresh token as revoked in DB.
 */
async function revokeRefreshToken(rawToken) {
    const tokenHash = hashToken(rawToken);
    await refreshTokensService.revokeByHash(tokenHash);
}

module.exports = { register, login, rotateRefreshToken, revokeRefreshToken };
