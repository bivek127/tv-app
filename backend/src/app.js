const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRouter = require('./routes/auth.routes');
const tasksRouter = require('./routes/tasks.routes');
const { authenticate } = require('./middleware/auth.middleware');

const app = express();

app.use(cors());
app.use(express.json());

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

// Auth: POST /auth/register and POST /auth/login (no token required)
app.use('/auth', authRouter);

// ── Protected routes ──────────────────────────────────────────────
// authenticate verifies JWT and sets req.user before every task handler
app.use('/tasks', authenticate, tasksRouter);

module.exports = app;
