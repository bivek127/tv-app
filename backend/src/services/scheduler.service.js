const cron = require('node-cron');
const webpush = require('web-push');
const logger = require('../utils/logger');
const notificationsService = require('./notifications.service');
const emailService = require('./email.service');

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@taskvault.app';

let vapidConfigured = false;
if (vapidPublic && vapidPrivate) {
    try {
        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        vapidConfigured = true;
    } catch (err) {
        logger.warn(`VAPID config invalid: ${err.message}`);
    }
} else {
    logger.warn('VAPID keys missing — push notifications will silently no-op.');
}

async function sendPushToUser(userId, payload) {
    if (!vapidConfigured) return;
    const subs = await notificationsService.getPushSubscriptions(userId);
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);
    await Promise.all(subs.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            }, body);
        } catch (err) {
            // 404/410 means the subscription is dead — remove it.
            if (err.statusCode === 404 || err.statusCode === 410) {
                try { await notificationsService.deletePushSubscription(userId, sub.endpoint); } catch (_) {}
            } else {
                logger.warn(`web-push failed for ${sub.endpoint}: ${err.message}`);
            }
        }
    }));
}

function describeWhen(dueDate) {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const diffMs = due - new Date();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 0) return ' — overdue';
    if (diffMin < 60) return ` — due in ${diffMin} min`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return ` — due in ${diffHr} hr`;
    const diffDay = Math.round(diffHr / 24);
    return ` — due in ${diffDay} day${diffDay === 1 ? '' : 's'}`;
}

/**
 * Send a single task reminder. Marks the task as sent regardless of whether
 * email/push succeeds — we'd rather skip a failed retry than spam the user.
 */
async function sendTaskReminder(row) {
    const { task_id, title, due_date, email, user_name, user_id, email_enabled, push_enabled, project_name } = row;
    const whenSuffix = describeWhen(due_date);

    if (email_enabled && email) {
        await emailService.sendReminderEmail({
            to: email,
            userName: user_name,
            tasks: [{ title, project_name, due_date }],
            // The existing template uses this only for the subject line.
            // "0" means "today" which is close enough for any pre-due reminder.
            daysUntilDue: 0,
        });
    }

    if (push_enabled) {
        await sendPushToUser(user_id, {
            title: `Reminder: ${title}`,
            body: `${project_name ? project_name + ' ' : ''}${whenSuffix.replace(/^ — /, '')}`.trim() || 'Task reminder',
            url: '/',
        });
    }

    await notificationsService.markReminderSent(task_id);
}

async function runReminderJob() {
    try {
        const pending = await notificationsService.getPendingReminders();
        if (pending.length === 0) return;
        logger.info(`Reminder scan: ${pending.length} pending`);
        for (const row of pending) {
            try {
                await sendTaskReminder(row);
            } catch (err) {
                logger.error(`Reminder for task ${row.task_id} failed: ${err.message}`);
            }
        }
    } catch (err) {
        logger.error(`runReminderJob uncaught: ${err.message}`);
    }
}

function startScheduler() {
    // Every 15 minutes on the quarter-hour. Per-task reminders have
    // minute-level precision from the user's perspective; a 15-min window
    // keeps the scan cheap without feeling laggy.
    cron.schedule('*/15 * * * *', () => {
        runReminderJob();
    });
    logger.info('Notification scheduler started (every 15 minutes).');
}

module.exports = { startScheduler, runReminderJob, sendPushToUser };
