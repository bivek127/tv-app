const pool = require('../db');

async function getUserProjects(userId) {
    const result = await pool.query(
        `SELECT id, name, description, color, icon, is_default, position, created_at, updated_at
         FROM projects
         WHERE user_id = $1
         ORDER BY position ASC, created_at ASC`,
        [userId]
    );
    return result.rows;
}

async function getProjectById(userId, projectId) {
    const result = await pool.query(
        `SELECT id, name, description, color, icon, is_default, position, created_at, updated_at
         FROM projects
         WHERE id = $1 AND user_id = $2`,
        [projectId, userId]
    );
    return result.rows[0] || null;
}

async function createProject(userId, { name, description, color, icon, is_default = false }) {
    const result = await pool.query(
        `INSERT INTO projects (user_id, name, description, color, icon, is_default)
         VALUES ($1, $2, $3, COALESCE($4, '#6366f1'), $5, $6)
         RETURNING id, name, description, color, icon, is_default, position, created_at, updated_at`,
        [userId, name, description ?? null, color ?? null, icon ?? null, is_default]
    );
    return result.rows[0];
}

async function updateProject(userId, projectId, { name, description, color, icon, position }) {
    const result = await pool.query(
        `UPDATE projects
         SET name        = COALESCE($1, name),
             description = COALESCE($2, description),
             color       = COALESCE($3, color),
             icon        = COALESCE($4, icon),
             position    = COALESCE($5, position),
             updated_at  = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING id, name, description, color, icon, is_default, position, created_at, updated_at`,
        [name ?? null, description ?? null, color ?? null, icon ?? null, position ?? null, projectId, userId]
    );
    return result.rows[0] || null;
}

// Returns { deleted: true } on success, { deleted: false, reason } if blocked.
async function deleteProject(userId, projectId) {
    const existing = await getProjectById(userId, projectId);
    if (!existing) return { deleted: false, reason: 'not_found' };
    if (existing.is_default) return { deleted: false, reason: 'is_default' };

    await pool.query(
        'DELETE FROM projects WHERE id = $1 AND user_id = $2',
        [projectId, userId]
    );
    return { deleted: true };
}

/**
 * Ensures the user has a default project ("My Tasks"). Idempotent — safe to
 * call on every login. Returns the default project row.
 */
async function ensureDefaultProject(userId) {
    const existing = await pool.query(
        'SELECT id FROM projects WHERE user_id = $1 AND is_default = true LIMIT 1',
        [userId]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    const result = await pool.query(
        `INSERT INTO projects (user_id, name, color, is_default)
         VALUES ($1, 'My Tasks', '#6366f1', true)
         RETURNING id, name, description, color, icon, is_default, position, created_at, updated_at`,
        [userId]
    );
    return result.rows[0];
}

module.exports = {
    getUserProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    ensureDefaultProject,
};
