const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const subtasksController = require('../controllers/subtasks.controller');
const dependenciesController = require('../controllers/dependencies.controller');
const { validateBody, validateParams, createTaskSchema, updateTaskSchema, uuidParamSchema, createSubtaskSchema, updateSubtaskSchema } = require('../validation/schemas');

router.get('/export', tasksController.exportCsv);
router.get('/stats', tasksController.getStats);
router.get('/calendar', tasksController.getCalendarTasks);
router.get('/', tasksController.getTasks);
router.post('/', validateBody(createTaskSchema), tasksController.createTask);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateTaskSchema), tasksController.updateTask);
router.delete('/:id', validateParams(uuidParamSchema), tasksController.deleteTask);

// Subtask routes
router.get('/:taskId/subtasks', subtasksController.getSubtasks);
router.post('/:taskId/subtasks', validateBody(createSubtaskSchema), subtasksController.createSubtask);
router.patch('/:taskId/subtasks/:subtaskId', validateBody(updateSubtaskSchema), subtasksController.updateSubtask);
router.delete('/:taskId/subtasks/:subtaskId', subtasksController.deleteSubtask);

// Dependency routes
router.get('/:taskId/dependencies', dependenciesController.getDependencies);
router.post('/:taskId/dependencies', dependenciesController.addDependency);
router.delete('/:taskId/dependencies/:blockedTaskId', dependenciesController.removeDependency);

module.exports = router;
