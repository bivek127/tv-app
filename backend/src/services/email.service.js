const { Resend } = require('resend');
const logger = require('../utils/logger');

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'TaskVault <onboarding@resend.dev>';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const resend = apiKey ? new Resend(apiKey) : null;

if (!resend) {
    logger.warn('RESEND_API_KEY missing — email sends will silently no-op.');
}

async function sendReminderEmail({ to, userName, tasks, daysUntilDue }) {
    if (!resend) return;
    try {
        const greeting = userName ? `Hi ${userName},` : 'Hi,';
        const timing = daysUntilDue === 0
            ? 'due today'
            : daysUntilDue === 1
                ? 'due tomorrow'
                : `due in ${daysUntilDue} days`;

        const taskRows = tasks.map((t) => `
            <li style="margin-bottom: 8px;">
                <strong>${escapeHtml(t.title)}</strong>
                ${t.project_name ? `<span style="color:#5e6c84;"> — ${escapeHtml(t.project_name)}</span>` : ''}
            </li>
        `).join('');

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #172b4d;">
                <h2 style="color: #0052cc; margin-top: 0;">TaskVault reminder</h2>
                <p>${greeting}</p>
                <p>You have <strong>${tasks.length}</strong> task${tasks.length === 1 ? '' : 's'} ${timing}:</p>
                <ul style="padding-left: 20px;">${taskRows}</ul>
                <p style="margin-top: 24px;">
                    <a href="${frontendUrl}"
                       style="display:inline-block;background:#0052cc;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
                        Open TaskVault
                    </a>
                </p>
                <p style="color:#5e6c84;font-size:12px;margin-top:32px;">
                    You can manage reminders from your profile page.
                </p>
            </div>
        `;

        await resend.emails.send({
            from: fromEmail,
            to,
            subject: `TaskVault — ${tasks.length} task${tasks.length === 1 ? '' : 's'} ${timing}`,
            html,
        });
    } catch (err) {
        logger.error(`sendReminderEmail failed: ${err.message}`);
    }
}

async function sendPasswordResetEmail({ to, resetUrl }) {
    if (!resend) return;
    try {
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #172b4d;">
                <h2 style="color: #0052cc; margin-top: 0;">Reset your password</h2>
                <p>We received a request to reset the password on your TaskVault account. Click the button below to choose a new password. This link expires in 1 hour.</p>
                <p style="margin: 24px 0;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#0052cc;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
                        Reset password
                    </a>
                </p>
                <p style="color:#5e6c84;font-size:12px;">
                    If the button doesn't work, copy this link into your browser:<br />
                    <span style="word-break: break-all;">${resetUrl}</span>
                </p>
                <p style="color:#5e6c84;font-size:12px;margin-top:24px;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `;

        await resend.emails.send({
            from: fromEmail,
            to,
            subject: 'Reset your TaskVault password',
            html,
        });
    } catch (err) {
        logger.error(`sendPasswordResetEmail failed: ${err.message}`);
    }
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = { sendReminderEmail, sendPasswordResetEmail };
