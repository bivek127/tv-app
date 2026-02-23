const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const authRouter = require('./routes/auth.routes');
const tasksRouter = require('./routes/tasks.routes');
const { authenticate } = require('./middleware/auth.middleware');

const app = express();

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
    origin: 'http://localhost:5173',   // Vite dev server
    credentials: true,                 // Allow cookies to be sent cross-origin
}));
app.use(express.json());
app.use(cookieParser());               // Parse httpOnly refresh token cookie

// ── Public routes ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth: register, login, refresh, logout (all public — no token required)
app.use('/auth', authRouter);

// ── Protected routes ──────────────────────────────────────────────
app.use('/tasks', authenticate, tasksRouter);

module.exports = app;
