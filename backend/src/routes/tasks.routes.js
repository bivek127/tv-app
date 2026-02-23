const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const { validateBody, validateParams, createTaskSchema, updateTaskSchema, uuidParamSchema } = require('../validation/schemas');

router.get('/', tasksController.getTasks);
router.post('/', validateBody(createTaskSchema), tasksController.createTask);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateTaskSchema), tasksController.updateTask);
router.delete('/:id', validateParams(uuidParamSchema), tasksController.deleteTask);

module.exports = router;
