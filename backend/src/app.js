const express = require('express');
const cors = require('cors');
const pool = require('./db');
const tasksRouter = require('./routes/tasks.routes');

const app = express();

app.use(cors());
app.use(express.json());

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

app.use('/tasks', tasksRouter);

module.exports = app;
