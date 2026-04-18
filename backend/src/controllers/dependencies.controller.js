const dependenciesService = require('../services/dependencies.service');

async function getDependencies(req, res, next) {
    try {
        const { taskId } = req.params;
        const data = await dependenciesService.getDependencies(req.user.id, taskId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

async function addDependency(req, res, next) {
    try {
        const { taskId } = req.params;
        const { blockedTaskId } = req.body;
        if (!blockedTaskId) {
            return res.status(400).json({ success: false, error: 'blockedTaskId is required' });
        }
        await dependenciesService.addDependency(req.user.id, taskId, blockedTaskId);
        res.status(201).json({ success: true, data: { blockingTaskId: taskId, blockedTaskId } });
    } catch (err) { next(err); }
}

async function removeDependency(req, res, next) {
    try {
        const { taskId, blockedTaskId } = req.params;
        await dependenciesService.removeDependency(req.user.id, taskId, blockedTaskId);
        res.status(204).send();
    } catch (err) { next(err); }
}

module.exports = { getDependencies, addDependency, removeDependency };
