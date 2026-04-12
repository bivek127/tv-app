const pool = require('../db');

async function getUserLabels(userId) {
    const result = await pool.query(
        'SELECT id, name, color, created_at FROM labels WHERE user_id = $1 ORDER BY created_at ASC',
        [userId]
    );
    return result.rows;
}

async function createLabel(userId, name, color) {
    const result = await pool.query(
        `INSERT INTO labels (user_id, name, color)
         VALUES ($1, $2, $3)
         RETURNING id, name, color, created_at`,
        [userId, name, color || '#6366f1']
    );
    return result.rows[0];
}

async function deleteLabel(userId, labelId) {
    const result = await pool.query(
        'DELETE FROM labels WHERE id = $1 AND user_id = $2 RETURNING *',
        [labelId, userId]
    );
    return result.rows[0] || null;
}

async function verifyTaskOwnership(taskId, userId) {
    const result = await pool.query(
        'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, userId]
    );
    return result.rows.length > 0;
}

async function addLabelToTask(userId, taskId, labelId) {
    if (!await verifyTaskOwnership(taskId, userId)) return null;
    await pool.query(
        'INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [taskId, labelId]
    );
    return { task_id: taskId, label_id: labelId };
}

async function removeLabelFromTask(userId, taskId, labelId) {
    if (!await verifyTaskOwnership(taskId, userId)) return null;
    const result = await pool.query(
        'DELETE FROM task_labels WHERE task_id = $1 AND label_id = $2 RETURNING *',
        [taskId, labelId]
    );
    return result.rows[0] || null;
}

async function getLabelsForTask(taskId) {
    const result = await pool.query(
        `SELECT l.id, l.name, l.color
         FROM labels l
         JOIN task_labels tl ON tl.label_id = l.id
         WHERE tl.task_id = $1
         ORDER BY l.name ASC`,
        [taskId]
    );
    return result.rows;
}

module.exports = { getUserLabels, createLabel, deleteLabel, addLabelToTask, removeLabelFromTask, getLabelsForTask };
