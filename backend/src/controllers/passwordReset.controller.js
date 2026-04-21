const usersService = require('../services/users.service');
const passwordResetService = require('../services/passwordReset.service');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * POST /auth/forgot-password
 * Accepts { email }. Always returns generic success to prevent user enumeration.
 */
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const user = await usersService.findUserByEmail(email);

        if (user) {
            const rawToken = await passwordResetService.createPasswordResetToken(user.id);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

            // Fire-and-forget — any failure (including missing API key) still
            // returns generic success so enumeration isn't possible.
            emailService.sendPasswordResetEmail({ to: email, resetUrl }).catch((err) => {
                logger.warn(`password reset email failed for ${email}: ${err.message}`);
            });

            if (process.env.NODE_ENV !== 'production') {
                logger.info(`[DEV] Password reset URL for ${email}: ${resetUrl}`);
            }
        }

        // Always respond with generic success — prevents user enumeration
        res.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /auth/reset-password
 * Accepts { token, newPassword }. Validates token and updates password.
 */
async function resetPassword(req, res, next) {
    try {
        const { token, newPassword } = req.body;
        await passwordResetService.resetPassword(token, newPassword);
        res.json({ success: true, data: { message: 'Password updated successfully.' } });
    } catch (err) {
        next(err);
    }
}

module.exports = { forgotPassword, resetPassword };
