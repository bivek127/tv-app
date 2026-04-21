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

/**
 * Which day offsets we need to consider. Kept small so the job stays cheap.
 */
const SUPPORTED_DAYS = [0, 1, 2, 3, 7];

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

async function runReminderJob() {
    logger.info('Reminder job: starting');
    for (const daysFromNow of SUPPORTED_DAYS) {
        try {
            const rows = await notificationsService.getUsersForReminder(daysFromNow);
            for (const row of rows) {
                const { user_id, email, name, email_enabled, push_enabled, tasks } = row;
                if (!tasks || tasks.length === 0) continue;

                if (email_enabled) {
                    await emailService.sendReminderEmail({
                        to: email,
                        userName: name,
                        tasks,
                        daysUntilDue: daysFromNow,
                    });
                }

                if (push_enabled) {
                    const timing = daysFromNow === 0
                        ? 'due today'
                        : daysFromNow === 1
                            ? 'due tomorrow'
                            : `due in ${daysFromNow} days`;
                    await sendPushToUser(user_id, {
                        title: `TaskVault — ${tasks.length} task${tasks.length === 1 ? '' : 's'} ${timing}`,
                        body: tasks.slice(0, 3).map((t) => t.title).join(', '),
                        url: '/',
                    });
                }
            }
        } catch (err) {
            logger.error(`Reminder job failed for offset ${daysFromNow}: ${err.message}`);
        }
    }
    logger.info('Reminder job: done');
}

function startScheduler() {
    // Every day at 8:00 AM, server local time.
    cron.schedule('0 8 * * *', () => {
        runReminderJob().catch((err) => {
            logger.error(`runReminderJob uncaught: ${err.message}`);
        });
    });
    logger.info('Notification scheduler started (daily 08:00).');
}

module.exports = { startScheduler, runReminderJob, sendPushToUser };
