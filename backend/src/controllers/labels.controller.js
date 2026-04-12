const labelsService = require('../services/labels.service');

async function getLabels(req, res, next) {
    try {
        const labels = await labelsService.getUserLabels(req.user.id);
        res.json({ success: true, data: labels });
    } catch (err) {
        next(err);
    }
}

async function createLabel(req, res, next) {
    try {
        const { name, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Label name is required' });
        }
        const label = await labelsService.createLabel(req.user.id, name.trim(), color);
        res.status(201).json({ success: true, data: label });
    } catch (err) {
        next(err);
    }
}

async function deleteLabel(req, res, next) {
    try {
        const { labelId } = req.params;
        const label = await labelsService.deleteLabel(req.user.id, labelId);
        if (!label) {
            return res.status(404).json({ success: false, error: 'Label not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

async function addLabelToTask(req, res, next) {
    try {
        const { taskId, labelId } = req.params;
        const result = await labelsService.addLabelToTask(req.user.id, taskId, labelId);
        if (!result) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function removeLabelFromTask(req, res, next) {
    try {
        const { taskId, labelId } = req.params;
        const result = await labelsService.removeLabelFromTask(req.user.id, taskId, labelId);
        if (!result) {
            return res.status(404).json({ success: false, error: 'Task or label assignment not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

async function getTaskLabels(req, res, next) {
    try {
        const { taskId } = req.params;
        const labels = await labelsService.getLabelsForTask(taskId);
        res.json({ success: true, data: labels });
    } catch (err) {
        next(err);
    }
}

module.exports = { getLabels, createLabel, deleteLabel, getTaskLabels, addLabelToTask, removeLabelFromTask };
