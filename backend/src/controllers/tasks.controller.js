const tasksService = require('../services/tasks.service');
const { logActivity } = require('../services/activity.service');

// req.user is guaranteed by auth.middleware; req.body/params validated by Zod middleware.

async function getTasks(req, res, next) {
    try {
        const search = req.query.search || null;
        const tasks = await tasksService.getAllTasks(req.user.id, search);
        res.json({ success: true, data: tasks });
    } catch (err) {
        next(err);
    }
}

async function createTask(req, res, next) {
    try {
        const { title, description, priority, status, due_date } = req.body;
        const task = await tasksService.createTask(req.user.id, title, description, priority, status, due_date);
        logActivity({ userId: req.user.id, action: 'task_created', entityType: 'task', entityId: task.id });
        res.status(201).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
}

async function updateTask(req, res, next) {
    try {
        const { id } = req.params;
        const { title, description, priority, status, due_date } = req.body;
        const task = await tasksService.updateTask(id, req.user.id, title, description, priority, status, due_date);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        logActivity({ userId: req.user.id, action: 'task_updated', entityType: 'task', entityId: task.id });
        res.json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
}

async function deleteTask(req, res, next) {
    try {
        const { id } = req.params;
        const task = await tasksService.deleteTask(id, req.user.id);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        logActivity({ userId: req.user.id, action: 'task_deleted', entityType: 'task', entityId: id });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };

