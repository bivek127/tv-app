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
async function createTask(userId, title, description) {
    const result = await pool.query(
        'INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3) RETURNING *',
        [title, description, userId]
    );
    return result.rows[0];
}

/**
 * Update a task — enforces ownership via user_id.
 */
async function updateTask(taskId, userId, title, description) {
    const result = await pool.query(
        `UPDATE tasks
         SET title       = $1,
             description = $2,
             updated_at  = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [title, description, taskId, userId]
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
