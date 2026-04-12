const express = require('express');
const router = express.Router();
const labelsController = require('../controllers/labels.controller');

router.get('/labels', labelsController.getLabels);
router.post('/labels', labelsController.createLabel);
router.delete('/labels/:labelId', labelsController.deleteLabel);
router.get('/tasks/:taskId/labels', labelsController.getTaskLabels);
router.post('/tasks/:taskId/labels/:labelId', labelsController.addLabelToTask);
router.delete('/tasks/:taskId/labels/:labelId', labelsController.removeLabelFromTask);

module.exports = router;
