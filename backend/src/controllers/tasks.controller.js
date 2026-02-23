const tasksService = require('../services/tasks.service');

// req.user is guaranteed by auth.middleware; req.body/params validated by Zod middleware.

async function getTasks(req, res, next) {
    try {
        const tasks = await tasksService.getAllTasks(req.user.id);
        res.json({ success: true, data: tasks });
    } catch (err) {
        next(err);
    }
}

async function createTask(req, res, next) {
    try {
        const { title, description } = req.body;
        const task = await tasksService.createTask(req.user.id, title, description);
        res.status(201).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
}

async function updateTask(req, res, next) {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const task = await tasksService.updateTask(id, req.user.id, title, description);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
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
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
