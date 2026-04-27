import apiClient from '../lib/apiClient';

export function getTasks({ cursor, limit, search, projectId } = {}) {
    const params = new URLSearchParams();
    if (cursor)    params.set('cursor', cursor);
    if (limit)     params.set('limit', String(limit));
    if (search)    params.set('search', search);
    if (projectId) params.set('projectId', projectId);
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

export function getCalendarTasks({ projectId, year, month } = {}) {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (year)      params.set('year', String(year));
    if (month)     params.set('month', String(month));
    const qs = params.toString();
    return apiClient(`/tasks/calendar${qs ? `?${qs}` : ''}`);
}
