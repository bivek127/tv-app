const projectsService = require('../services/projects.service');

async function getProjects(req, res, next) {
    try {
        const projects = await projectsService.getUserProjects(req.user.id);
        res.json({ success: true, data: projects });
    } catch (err) {
        next(err);
    }
}

async function getProject(req, res, next) {
    try {
        const project = await projectsService.getProjectById(req.user.id, req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({ success: true, data: project });
    } catch (err) {
        next(err);
    }
}

async function createProject(req, res, next) {
    try {
        const project = await projectsService.createProject(req.user.id, req.body);
        res.status(201).json({ success: true, data: project });
    } catch (err) {
        next(err);
    }
}

async function updateProject(req, res, next) {
    try {
        const project = await projectsService.updateProject(req.user.id, req.params.id, req.body);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({ success: true, data: project });
    } catch (err) {
        next(err);
    }
}

async function deleteProject(req, res, next) {
    try {
        const result = await projectsService.deleteProject(req.user.id, req.params.id);
        if (!result.deleted) {
            if (result.reason === 'is_default') {
                return res.status(400).json({ success: false, error: 'Cannot delete the default project' });
            }
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
