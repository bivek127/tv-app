const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notifications.controller');
const {
    validateBody,
    updateNotificationPreferencesSchema,
    pushSubscriptionSchema,
    deletePushSubscriptionSchema,
} = require('../validation/schemas');

const publicRouter = express.Router();
const protectedRouter = express.Router();

// Public — frontend needs this before authenticating push.
publicRouter.get('/vapid-public-key', ctrl.getVapidPublicKey);

// Protected
protectedRouter.get('/preferences', authenticate, ctrl.getPreferences);
protectedRouter.patch('/preferences', authenticate, validateBody(updateNotificationPreferencesSchema), ctrl.updatePreferences);
protectedRouter.post('/push-subscription', authenticate, validateBody(pushSubscriptionSchema), ctrl.createPushSubscription);
protectedRouter.delete('/push-subscription', authenticate, validateBody(deletePushSubscriptionSchema), ctrl.removePushSubscription);

module.exports = { publicRouter, protectedRouter };
