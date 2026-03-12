/**
 * Authorization middleware — restricts access by user role.
 * Must be used AFTER authenticate middleware (req.user must exist).
 *
 * Usage: requireRole('admin')
 */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden — insufficient permissions',
            });
        }
        next();
    };
}

module.exports = requireRole;
