const pool = require('../db');

async function verifyTaskOwnership(taskId, userId) {
    const result = await pool.query(
        'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, userId]
    );
    return result.rows.length > 0;
}

function ownershipError() {
    const err = new Error('Task not found');
    err.status = 404;
    return err;
}

/**
 * Returns { blocking, blockedBy } for a task.
 *  - blocking   = tasks that THIS task is blocking (this task must be done first)
 *  - blockedBy  = tasks that are blocking THIS task
 */
async function getDependencies(userId, taskId) {
    if (!await verifyTaskOwnership(taskId, userId)) {
        throw ownershipError();
    }

    const blockingResult = await pool.query(
        `SELECT t.* FROM task_dependencies td
         JOIN tasks t ON t.id = td.blocked_task_id
         WHERE td.blocking_task_id = $1
         ORDER BY t.created_at DESC`,
        [taskId]
    );

    const blockedByResult = await pool.query(
        `SELECT t.* FROM task_dependencies td
         JOIN tasks t ON t.id = td.blocking_task_id
         WHERE td.blocked_task_id = $1
         ORDER BY t.created_at DESC`,
        [taskId]
    );

    return { blocking: blockingResult.rows, blockedBy: blockedByResult.rows };
}

/**
 * Walk the dependency graph starting from `startId` following blocking_task_id → blocked_task_id.
 * Returns true if `targetId` is reachable (meaning adding startId→targetId would close a cycle).
 */
async function wouldCreateCycle(blockingTaskId, blockedTaskId) {
    // If blockedTaskId already (directly or indirectly) blocks blockingTaskId, a cycle exists.
    // Recursive CTE: starting from blockedTaskId, follow the chain of blocked-things.
    const result = await pool.query(
        `WITH RECURSIVE reachable AS (
             SELECT blocked_task_id AS task_id
             FROM task_dependencies
             WHERE blocking_task_id = $1
           UNION
             SELECT td.blocked_task_id
             FROM task_dependencies td
             JOIN reachable r ON td.blocking_task_id = r.task_id
         )
         SELECT 1 FROM reachable WHERE task_id = $2 LIMIT 1`,
        [blockedTaskId, blockingTaskId]
    );
    return result.rows.length > 0;
}

async function addDependency(userId, blockingTaskId, blockedTaskId) {
    if (blockingTaskId === blockedTaskId) {
        const err = new Error('A task cannot block itself');
        err.status = 400;
        throw err;
    }

    const [ownsBlocking, ownsBlocked] = await Promise.all([
        verifyTaskOwnership(blockingTaskId, userId),
        verifyTaskOwnership(blockedTaskId, userId),
    ]);
    if (!ownsBlocking || !ownsBlocked) {
        throw ownershipError();
    }

    if (await wouldCreateCycle(blockingTaskId, blockedTaskId)) {
        const err = new Error('Circular dependency detected');
        err.status = 400;
        throw err;
    }

    await pool.query(
        `INSERT INTO task_dependencies (blocking_task_id, blocked_task_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [blockingTaskId, blockedTaskId]
    );
}

async function removeDependency(userId, blockingTaskId, blockedTaskId) {
    if (!await verifyTaskOwnership(blockingTaskId, userId)) {
        throw ownershipError();
    }

    await pool.query(
        `DELETE FROM task_dependencies
         WHERE blocking_task_id = $1 AND blocked_task_id = $2`,
        [blockingTaskId, blockedTaskId]
    );
}

module.exports = { getDependencies, addDependency, removeDependency };
