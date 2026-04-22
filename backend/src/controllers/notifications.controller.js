const notificationsService = require('../services/notifications.service');

async function getVapidPublicKey(req, res) {
    res.json({
        success: true,
        data: { publicKey: process.env.VAPID_PUBLIC_KEY || null },
    });
}

async function getPreferences(req, res, next) {
    try {
        const prefs = await notificationsService.getPreferences(req.user.id);
        res.json({ success: true, data: { preferences: prefs } });
    } catch (err) {
        next(err);
    }
}

async function updatePreferences(req, res, next) {
    try {
        const current = await notificationsService.getPreferences(req.user.id);
        const merged = {
            email_enabled: req.body.email_enabled ?? current.email_enabled,
            push_enabled:  req.body.push_enabled  ?? current.push_enabled,
        };
        const prefs = await notificationsService.upsertPreferences(req.user.id, merged);
        res.json({ success: true, data: { preferences: prefs } });
    } catch (err) {
        next(err);
    }
}

async function createPushSubscription(req, res, next) {
    try {
        const { endpoint, keys } = req.body;
        await notificationsService.savePushSubscription(req.user.id, {
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
        });
        res.status(201).json({ success: true, data: { endpoint } });
    } catch (err) {
        next(err);
    }
}

async function removePushSubscription(req, res, next) {
    try {
        const { endpoint } = req.body;
        await notificationsService.deletePushSubscription(req.user.id, endpoint);
        res.json({ success: true, data: { endpoint } });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getVapidPublicKey,
    getPreferences,
    updatePreferences,
    createPushSubscription,
    removePushSubscription,
};
