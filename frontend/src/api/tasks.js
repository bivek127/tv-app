import apiClient from '../lib/apiClient';

export function getTasks() {
    return apiClient('/tasks');
}

export function createTask(data) {
    return apiClient('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function updateTask(id, data) {
    return apiClient(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteTask(id) {
    return apiClient(`/tasks/${id}`, { method: 'DELETE' });
}
