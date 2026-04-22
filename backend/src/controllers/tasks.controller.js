const tasksService = require('../services/tasks.service');
const projectsService = require('../services/projects.service');
const { logActivity } = require('../services/activity.service');
const { sendToUser } = require('../services/sse.service');

// req.user is guaranteed by auth.middleware; req.body/params validated by Zod middleware.

/**
 * Resolve a project ID for this request: use the provided one if it belongs to
 * the user, otherwise fall back to the user's default project.
 * Returns null if a provided projectId is not found/owned by the user.
 */
async function resolveProjectId(userId, provided) {
    if (provided) {
        const project = await projectsService.getProjectById(userId, provided);
        return project ? project.id : null;
    }
    const def = await projectsService.ensureDefaultProject(userId);
    return def.id;
}

async function getTasks(req, res, next) {
    try {
        const { search, cursor, limit = 20, projectId: rawProjectId } = req.query;
        const projectId = await resolveProjectId(req.user.id, rawProjectId);
        if (!projectId) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        const result = await tasksService.getAllTasks(req.user.id, {
            projectId,
            search: search || null,
            cursor: cursor || null,
            limit: Number(limit),
        });
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function createTask(req, res, next) {
    try {
        const { title, description, priority, status, due_date, reminder_at, projectId: rawProjectId } = req.body;
        const projectId = await resolveProjectId(req.user.id, rawProjectId);
        if (!projectId) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        const task = await tasksService.createTask(req.user.id, {
            projectId, title, description, priority, status, due_date, reminder_at,
        });
        if (!task) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        logActivity({
            userId: req.user.id,
            action: 'task_created',
            entityType: 'task',
            entityId: task.id,
            metadata: { project_id: task.project_id, title: task.title },
        });
        sendToUser(req.user.id, 'task_created', task);
        res.status(201).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
}

async function updateTask(req, res, next) {
    try {
        const { id } = req.params;
        const { title, description, priority, status, due_date, reminder_at } = req.body;
        const task = await tasksService.updateTask(id, req.user.id, title, description, priority, status, due_date, reminder_at);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        logActivity({
            userId: req.user.id,
            action: 'task_updated',
            entityType: 'task',
            entityId: task.id,
            metadata: { project_id: task.project_id, title: task.title },
        });
        sendToUser(req.user.id, 'task_updated', task);
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
        logActivity({
            userId: req.user.id,
            action: 'task_deleted',
            entityType: 'task',
            entityId: id,
            metadata: { project_id: task.project_id, title: task.title },
        });
        sendToUser(req.user.id, 'task_deleted', { id });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

async function exportCsv(req, res, next) {
    try {
        const search = req.query.search || null;
        const projectId = await resolveProjectId(req.user.id, req.query.projectId);
        if (!projectId) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        const tasks = await tasksService.getAllTasks(req.user.id, { projectId, search });

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
        const projectId = await resolveProjectId(req.user.id, req.query.projectId);
        if (!projectId) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        const raw = await tasksService.getTaskStats(req.user.id, projectId);
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
