const subtasksService = require('../services/subtasks.service');
const pool = require('../db');

// Verify task belongs to the requesting user — direct lookup, no full table scan
async function verifyTaskOwnership(taskId, userId) {
    const result = await pool.query(
        'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, userId]
    );
    return result.rows.length > 0;
}

async function getSubtasks(req, res, next) {
    try {
        const { taskId } = req.params;
        if (!await verifyTaskOwnership(taskId, req.user.id)) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        const subtasks = await subtasksService.getSubtasks(taskId);
        res.json({ success: true, data: subtasks });
    } catch (err) { next(err); }
}

async function createSubtask(req, res, next) {
    try {
        const { taskId } = req.params;
        const { title } = req.body;
        if (!await verifyTaskOwnership(taskId, req.user.id)) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        const subtask = await subtasksService.createSubtask(taskId, title);
        res.status(201).json({ success: true, data: subtask });
    } catch (err) { next(err); }
}

async function updateSubtask(req, res, next) {
    try {
        const { taskId, subtaskId } = req.params;
        if (!await verifyTaskOwnership(taskId, req.user.id)) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        const subtask = await subtasksService.updateSubtask(subtaskId, taskId, req.body);
        if (!subtask) return res.status(404).json({ success: false, error: 'Subtask not found' });
        res.json({ success: true, data: subtask });
    } catch (err) { next(err); }
}

async function deleteSubtask(req, res, next) {
    try {
        const { taskId, subtaskId } = req.params;
        if (!await verifyTaskOwnership(taskId, req.user.id)) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        const subtask = await subtasksService.deleteSubtask(subtaskId, taskId);
        if (!subtask) return res.status(404).json({ success: false, error: 'Subtask not found' });
        res.status(204).send();
    } catch (err) { next(err); }
}

module.exports = { getSubtasks, createSubtask, updateSubtask, deleteSubtask };
