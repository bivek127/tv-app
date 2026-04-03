const { getActivityByUserId } = require('../services/activity.service');

async function getUserActivity(req, res, next) {
    try {
        const logs = await getActivityByUserId(req.user.id);
        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
}

module.exports = { getUserActivity };
