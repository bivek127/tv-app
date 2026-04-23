const pool = require('../db');

/**
 * Fetch tasks scoped to a (user, project) with optional cursor-based pagination.
 * When limit is provided, returns { tasks, nextCursor }.
 * When limit is omitted (e.g. CSV export), returns a flat array of all tasks.
 */
async function getAllTasks(userId, { projectId, search, cursor, limit } = {}) {
    const conditions = ['t.user_id = $1', 't.project_id = $2'];
    const params = [userId, projectId];
    let idx = 3;

    if (search) {
        conditions.push(`(t.title ILIKE $${idx} OR t.description ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
    }

    if (cursor) {
        conditions.push(`t.created_at < $${idx}`);
        params.push(cursor);
        idx++;
    }

    const clampedLimit = limit ? Math.min(Math.max(Number(limit), 1), 100) : null;

    const query = `SELECT t.*,
                    COALESCE(
                        json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color))
                        FILTER (WHERE l.id IS NOT NULL), '[]'
                    ) AS labels,
                    COALESCE((
                        SELECT COUNT(*)::int
                        FROM task_dependencies td
                        JOIN tasks blocker ON blocker.id = td.blocking_task_id
                        WHERE td.blocked_task_id = t.id AND blocker.status != 'done'
                    ), 0) AS blocked_by_count,
                    EXISTS (
                        SELECT 1 FROM task_dependencies td
                        JOIN tasks blocker ON blocker.id = td.blocking_task_id
                        WHERE td.blocked_task_id = t.id AND blocker.status != 'done'
                    ) AS is_blocked
                 FROM tasks t
                 LEFT JOIN task_labels tl ON tl.task_id = t.id
                 LEFT JOIN labels l ON l.id = tl.label_id
                 WHERE ${conditions.join(' AND ')}
                 GROUP BY t.id
                 ORDER BY t.created_at DESC${clampedLimit ? ` LIMIT $${idx}` : ''}`;

    if (clampedLimit) params.push(clampedLimit);

    const result = await pool.query(query, params);
    const tasks = result.rows;

    // When no limit requested (e.g. CSV export), return flat array for backwards compat
    if (!clampedLimit) return tasks;

    const nextCursor = tasks.length === clampedLimit
        ? tasks[tasks.length - 1].created_at.toISOString()
        : null;

    return { tasks, nextCursor };
}

/**
 * Create a new task inside the given project. Returns null if the project does
 * not belong to the user (prevents cross-user task insertion).
 */
async function createTask(userId, { projectId, title, description, priority, status, due_date, reminder_at }) {
    const result = await pool.query(
        `INSERT INTO tasks (title, description, user_id, priority, status, due_date, project_id, reminder_at)
         SELECT $1, $2, $3, $4, $5, $6, $7, $8
         WHERE EXISTS (SELECT 1 FROM projects WHERE id = $7 AND user_id = $3)
         RETURNING *`,
        [title, description ?? null, userId, priority, status, due_date ?? null, projectId, reminder_at ?? null]
    );
    return result.rows[0] || null;
}

/**
 * Update a task — enforces ownership via user_id. Tasks do not move between
 * projects in this version, so project_id is not modified here.
 *
 * When `reminder_at` changes (including being cleared), we also reset
 * `reminder_sent_at` so a rescheduled reminder actually fires again.
 */
async function updateTask(taskId, userId, title, description, priority, status, due_date, reminder_at) {
    const result = await pool.query(
        `UPDATE tasks
         SET title       = $1,
             description = $2,
             priority    = $3,
             status      = $4,
             due_date    = $5,
             reminder_at = $6,
             reminder_sent_at = CASE
                 WHEN reminder_at IS DISTINCT FROM $6 THEN NULL
                 ELSE reminder_sent_at
             END,
             updated_at  = NOW()
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [title, description ?? null, priority, status, due_date ?? null, reminder_at ?? null, taskId, userId]
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

/**
 * Aggregate stats for a user's tasks in a single query, scoped to one project.
 */
async function getTaskStats(userId, projectId) {
    const result = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE status = 'todo')        AS status_todo,
            COUNT(*) FILTER (WHERE status = 'in_progress') AS status_in_progress,
            COUNT(*) FILTER (WHERE status = 'done')        AS status_done,
            COUNT(*) FILTER (WHERE priority = 'low')       AS priority_low,
            COUNT(*) FILTER (WHERE priority = 'medium')    AS priority_medium,
            COUNT(*) FILTER (WHERE priority = 'high')      AS priority_high,
            COUNT(*) FILTER (WHERE priority = 'urgent')    AS priority_urgent,
            COUNT(*) FILTER (
                WHERE due_date < CURRENT_DATE AND status != 'done'
            ) AS overdue_count,
            COUNT(*) FILTER (
                WHERE status = 'done'
                  AND updated_at >= date_trunc('week', CURRENT_DATE)
            ) AS completed_this_week,
            COALESCE(
                ROUND(AVG(
                    EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
                ) FILTER (WHERE status = 'done'), 1),
                0
            ) AS avg_completion_days
         FROM tasks
         WHERE user_id = $1 AND project_id = $2`,
        [userId, projectId]
    );
    return result.rows[0];
}

/**
 * Fetch tasks with a due_date falling inside the calendar viewport for the
 * given month. Includes a ~1-week buffer on each side so leading/trailing
 * grid cells from adjacent months are populated too.
 *
 * Month is 1-indexed (1 = January).
 */
async function getTasksForCalendar(userId, projectId, year, month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    start.setUTCDate(start.getUTCDate() - 7);
    const end = new Date(Date.UTC(year, month, 0));
    end.setUTCDate(end.getUTCDate() + 7);

    const result = await pool.query(
        `SELECT t.*,
                COALESCE(
                    json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color))
                    FILTER (WHERE l.id IS NOT NULL), '[]'
                ) AS labels,
                COALESCE((
                    SELECT COUNT(*)::int FROM subtasks WHERE task_id = t.id
                ), 0) AS subtasks_total,
                COALESCE((
                    SELECT COUNT(*)::int FROM subtasks WHERE task_id = t.id AND completed = true
                ), 0) AS subtasks_done
         FROM tasks t
         LEFT JOIN task_labels tl ON tl.task_id = t.id
         LEFT JOIN labels l ON l.id = tl.label_id
         WHERE t.user_id = $1
           AND t.project_id = $2
           AND t.due_date IS NOT NULL
           AND t.due_date >= $3
           AND t.due_date <= $4
         GROUP BY t.id
         ORDER BY t.due_date ASC, t.created_at ASC`,
        [userId, projectId, start, end]
    );
    return result.rows;
}

module.exports = { getAllTasks, createTask, updateTask, deleteTask, getTaskStats, getTasksForCalendar };
