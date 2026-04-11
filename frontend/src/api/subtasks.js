import apiClient from '../lib/apiClient';

export function getSubtasks(taskId) {
    return apiClient(`/tasks/${taskId}/subtasks`);
}

export function createSubtask(taskId, title) {
    return apiClient(`/tasks/${taskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
    });
}

export function updateSubtask(taskId, subtaskId, data) {
    return apiClient(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export function deleteSubtask(taskId, subtaskId) {
    return apiClient(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' });
}
