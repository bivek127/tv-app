const pool = require('../db');

async function getSubtasks(taskId) {
    const result = await pool.query(
        'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY position ASC, created_at ASC',
        [taskId]
    );
    return result.rows;
}

async function createSubtask(taskId, title) {
    const posResult = await pool.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM subtasks WHERE task_id = $1',
        [taskId]
    );
    const position = posResult.rows[0].next_pos;
    const result = await pool.query(
        'INSERT INTO subtasks (task_id, title, position) VALUES ($1, $2, $3) RETURNING *',
        [taskId, title, position]
    );
    return result.rows[0];
}

async function updateSubtask(subtaskId, taskId, { title, completed }) {
    const result = await pool.query(
        `UPDATE subtasks SET title = COALESCE($1, title), completed = COALESCE($2, completed)
         WHERE id = $3 AND task_id = $4 RETURNING *`,
        [title ?? null, completed ?? null, subtaskId, taskId]
    );
    return result.rows[0] || null;
}

async function deleteSubtask(subtaskId, taskId) {
    const result = await pool.query(
        'DELETE FROM subtasks WHERE id = $1 AND task_id = $2 RETURNING *',
        [subtaskId, taskId]
    );
    return result.rows[0] || null;
}

module.exports = { getSubtasks, createSubtask, updateSubtask, deleteSubtask };
