import apiClient from '../lib/apiClient';

export function getTasks({ cursor, limit, search } = {}) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit)  params.set('limit', String(limit));
    if (search) params.set('search', search);
    const qs = params.toString();
    return apiClient(`/tasks${qs ? `?${qs}` : ''}`);
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
