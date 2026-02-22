const usersService = require('../services/users.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
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
    const token = signToken(user);
    return { user, token };
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

    const token = signToken(user);
    // Never return password_hash to the caller
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
}

module.exports = { register, login };
