const { z } = require('zod');

// ── Auth ──────────────────────────────────────────────────────────

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ── Tasks ─────────────────────────────────────────────────────────

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['todo', 'in_progress', 'done'];

const createTaskSchema = z.object({
    title:       z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional(),
    priority:    z.enum(PRIORITIES).default('medium'),
    status:      z.enum(STATUSES).default('todo'),
    due_date:    z.string().date('Invalid date format').nullable().optional(),
});

const updateTaskSchema = z.object({
    title:       z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional(),
    priority:    z.enum(PRIORITIES).default('medium'),
    status:      z.enum(STATUSES).default('todo'),
    due_date:    z.string().date('Invalid date format').nullable().optional(),
});

// ── Params ────────────────────────────────────────────────────────

const uuidParamSchema = z.object({
    id: z.string().uuid('Invalid task ID format'),
});

// ── Middleware factory ─────────────────────────────────────────────

/**
 * Returns an Express middleware that validates req.body against the given schema.
 * On failure: responds 400 { success: false, error: [...messages] }.
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const messages = result.error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        req.body = result.data; // use coerced/cleaned data
        next();
    };
}

/**
 * Returns an Express middleware that validates req.params against the given schema.
 */
function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const messages = result.error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        req.params = result.data;
        next();
    };
}

module.exports = {
    registerSchema,
    loginSchema,
    createTaskSchema,
    updateTaskSchema,
    uuidParamSchema,
    validateBody,
    validateParams,
};
