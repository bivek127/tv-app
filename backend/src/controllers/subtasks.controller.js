const subtasksService = require('../services/subtasks.service');
const tasksService = require('../services/tasks.service');

// Verify task belongs to the requesting user before any subtask operation
async function verifyTaskOwnership(taskId, userId) {
    const tasks = await tasksService.getAllTasks(userId);
    return tasks.some((t) => t.id === taskId);
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
