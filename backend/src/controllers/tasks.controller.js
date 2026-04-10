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

async function exportCsv(req, res, next) {
    try {
        const search = req.query.search || null;
        const tasks = await tasksService.getAllTasks(req.user.id, search);

        const escapeField = (val) => {
            if (val == null) return '';
            const str = String(val);
            if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const header = 'title,description,priority,status,due_date,created_at';
        const rows = tasks.map((t) =>
            [
                escapeField(t.title),
                escapeField(t.description),
                escapeField(t.priority),
                escapeField(t.status),
                escapeField(t.due_date ? t.due_date.toISOString().slice(0, 10) : null),
                escapeField(t.created_at ? t.created_at.toISOString() : null),
            ].join(',')
        );

        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
        res.send(csv);
    } catch (err) {
        next(err);
    }
}

async function getStats(req, res, next) {
    try {
        const raw = await tasksService.getTaskStats(req.user.id);
        res.json({
            success: true,
            data: {
                by_status: {
                    todo: Number(raw.status_todo),
                    in_progress: Number(raw.status_in_progress),
                    done: Number(raw.status_done),
                },
                by_priority: {
                    low: Number(raw.priority_low),
                    medium: Number(raw.priority_medium),
                    high: Number(raw.priority_high),
                    urgent: Number(raw.priority_urgent),
                },
                overdue_count: Number(raw.overdue_count),
                completed_this_week: Number(raw.completed_this_week),
                avg_completion_days: Number(raw.avg_completion_days),
            },
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getTasks, createTask, updateTask, deleteTask, exportCsv, getStats };
