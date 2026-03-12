const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const authRouter = require('./routes/auth.routes');
const tasksRouter = require('./routes/tasks.routes');
const adminRouter = require('./routes/admin.routes');
const { authenticate } = require('./middleware/auth.middleware');
const requireRole = require('./middleware/requireRole');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// ── Core middleware ───────────────────────────────────────────────
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Public routes ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'OK' } });
});

app.get('/db-test', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

// Auth: register, login, refresh, logout (all public)
app.use('/auth', authRouter);

// ── Protected routes ──────────────────────────────────────────────
app.use('/tasks', authenticate, tasksRouter);
app.use('/admin', authenticate, requireRole('admin'), adminRouter);

// ── Global error handler (must be last) ──────────────────────────
app.use(errorMiddleware);

module.exports = app;
