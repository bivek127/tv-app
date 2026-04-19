const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const { validateBody, validateParams, createProjectSchema, updateProjectSchema, uuidParamSchema } = require('../validation/schemas');

router.get('/', projectsController.getProjects);
router.post('/', validateBody(createProjectSchema), projectsController.createProject);
router.get('/:id', validateParams(uuidParamSchema), projectsController.getProject);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateProjectSchema), projectsController.updateProject);
router.delete('/:id', validateParams(uuidParamSchema), projectsController.deleteProject);

module.exports = router;
