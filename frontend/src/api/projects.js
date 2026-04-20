import apiClient from '../lib/apiClient';

export function getProjects() {
    return apiClient('/projects');
}

export function getProject(id) {
    return apiClient(`/projects/${id}`);
}

export function createProject(data) {
    return apiClient('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function updateProject(id, data) {
    return apiClient(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteProject(id) {
    return apiClient(`/projects/${id}`, { method: 'DELETE' });
}
