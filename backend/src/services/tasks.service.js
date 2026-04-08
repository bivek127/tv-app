const pool = require('../db');

/**
 * Fetch all tasks belonging to a specific user.
 */
async function getAllTasks(userId) {
    const result = await pool.query(
        'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
}

/**
 * Create a new task for a specific user.
 */
async function createTask(userId, title, description, priority, status, due_date) {
    const result = await pool.query(
        `INSERT INTO tasks (title, description, user_id, priority, status, due_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [title, description ?? null, userId, priority, status, due_date ?? null]
    );
    return result.rows[0];
}

/**
 * Update a task — enforces ownership via user_id.
 */
async function updateTask(taskId, userId, title, description, priority, status, due_date) {
    const result = await pool.query(
        `UPDATE tasks
         SET title       = $1,
             description = $2,
             priority    = $3,
             status      = $4,
             due_date    = $5,
             updated_at  = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [title, description ?? null, priority, status, due_date ?? null, taskId, userId]
    );
    return result.rows[0] || null;
}

/**
 * Delete a task — enforces ownership via user_id.
 */
async function deleteTask(taskId, userId) {
    const result = await pool.query(
        'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
        [taskId, userId]
    );
    return result.rows[0] || null;
}

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
