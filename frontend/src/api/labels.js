import apiClient from '../lib/apiClient';

export const getLabels = () => apiClient('/labels');
export const createLabel = (name, color) => apiClient('/labels', { method: 'POST', body: JSON.stringify({ name, color }) });
export const deleteLabel = (labelId) => apiClient(`/labels/${labelId}`, { method: 'DELETE' });
export const getLabelsForTask = (taskId) => apiClient(`/tasks/${taskId}/labels`);
export const addLabelToTask = (taskId, labelId) => apiClient(`/tasks/${taskId}/labels/${labelId}`, { method: 'POST' });
export const removeLabelFromTask = (taskId, labelId) => apiClient(`/tasks/${taskId}/labels/${labelId}`, { method: 'DELETE' });
