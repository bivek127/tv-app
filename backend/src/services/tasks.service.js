const pool = require('../db');

/**
 * Fetch tasks belonging to a specific user with optional cursor-based pagination.
 * When limit is provided, returns { tasks, nextCursor }.
 * When limit is omitted (e.g. CSV export), returns a flat array of all tasks.
 */
async function getAllTasks(userId, { search, cursor, limit } = {}) {
    const conditions = ['t.user_id = $1'];
    const params = [userId];
    let idx = 2;

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
                    ) AS labels
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
 * Create a new task for a specific user.
 */
async function createTask(userId, title, description, priority, status, due_date) {
    const result = await pool.query(
        `INSERT INTO tasks (title, description, user_id, priority, status, due_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [title, description ?? null, userId, priority, status, due_date ?? null]
    );
    return result.rows[0];
}

/**
 * Update a task — enforces ownership via user_id.
 */
async function updateTask(taskId, userId, title, description, priority, status, due_date) {
    const result = await pool.query(
        `UPDATE tasks
         SET title       = $1,
             description = $2,
             priority    = $3,
             status      = $4,
             due_date    = $5,
             updated_at  = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [title, description ?? null, priority, status, due_date ?? null, taskId, userId]
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
 * Aggregate stats for a user's tasks in a single query.
 */
async function getTaskStats(userId) {
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
         WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

module.exports = { getAllTasks, createTask, updateTask, deleteTask, getTaskStats };
