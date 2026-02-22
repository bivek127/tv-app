const pool = require('../db');

async function getAllTasks() {
    const result = await pool.query(
        'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    return result.rows;
}

async function createTask(title, description) {
    const result = await pool.query(
        'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
        [title, description]
    );
    return result.rows[0];
}

async function updateTask(id, title, description) {
    const result = await pool.query(
        `UPDATE tasks
         SET title = $1,
             description = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [title, description, id]
    );
    return result.rows[0] || null;
}

async function deleteTask(id) {
    const result = await pool.query(
        'DELETE FROM tasks WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
}

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
