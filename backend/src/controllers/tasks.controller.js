const tasksService = require('../services/tasks.service');

async function getTasks(req, res) {
    try {
        const tasks = await tasksService.getAllTasks();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function createTask(req, res) {
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const task = await tasksService.createTask(title, description);
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateTask(req, res) {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const task = await tasksService.updateTask(id, title, description);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function deleteTask(req, res) {
    const { id } = req.params;

    try {
        const task = await tasksService.deleteTask(id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
