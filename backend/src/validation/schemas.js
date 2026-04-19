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

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
    token:       z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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
    projectId:   z.string().uuid('Invalid project ID').optional(),
});

const updateTaskSchema = z.object({
    title:       z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional(),
    priority:    z.enum(PRIORITIES).default('medium'),
    status:      z.enum(STATUSES).default('todo'),
    due_date:    z.string().date('Invalid date format').nullable().optional(),
});

// ── Subtasks ──────────────────────────────────────────────────────

const createSubtaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
});

const updateSubtaskSchema = z.object({
    title:     z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
    completed: z.boolean().optional(),
    position:  z.number().int().min(0).optional(),
}).refine((d) => d.title !== undefined || d.completed !== undefined || d.position !== undefined, {
    message: 'At least one field (title, completed, or position) is required',
});

// ── Projects ──────────────────────────────────────────────────────

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const createProjectSchema = z.object({
    name:        z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').nullable().optional(),
    color:       z.string().regex(HEX_COLOR, 'Color must be a hex code like #6366f1').optional(),
    icon:        z.string().max(10, 'Icon too long').nullable().optional(),
});

const updateProjectSchema = z.object({
    name:        z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    description: z.string().max(500, 'Description too long').nullable().optional(),
    color:       z.string().regex(HEX_COLOR, 'Color must be a hex code like #6366f1').optional(),
    icon:        z.string().max(10, 'Icon too long').nullable().optional(),
    position:    z.number().int().min(0).optional(),
}).refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: 'At least one field is required' }
);

// ── Profile ───────────────────────────────────────────────────────

const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').nullable().optional(),
});

const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
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
    forgotPasswordSchema,
    resetPasswordSchema,
    createTaskSchema,
    updateTaskSchema,
    createSubtaskSchema,
    updateSubtaskSchema,
    createProjectSchema,
    updateProjectSchema,
    updateProfileSchema,
    updatePasswordSchema,
    uuidParamSchema,
    validateBody,
    validateParams,
};
