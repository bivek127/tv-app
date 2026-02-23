const usersService = require('../services/users.service');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');

const SALT_ROUNDS = 10;

async function register(email, password) {
    const existing = await usersService.findUserByEmail(email);
    if (existing) {
        const err = new Error('Email already in use');
        err.status = 409;
        throw err;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await usersService.createUser(email, passwordHash);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { user, accessToken, refreshToken };
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
}

module.exports = { register, login };
