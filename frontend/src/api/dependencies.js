import apiClient from '../lib/apiClient';

export function getDependencies(taskId) {
    return apiClient(`/tasks/${taskId}/dependencies`);
}

export function addDependency(taskId, blockedTaskId) {
    return apiClient(`/tasks/${taskId}/dependencies`, {
        method: 'POST',
        body: JSON.stringify({ blockedTaskId }),
    });
}

export function removeDependency(taskId, blockedTaskId) {
    return apiClient(`/tasks/${taskId}/dependencies/${blockedTaskId}`, {
        method: 'DELETE',
    });
}
