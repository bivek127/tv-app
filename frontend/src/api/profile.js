import apiClient from '../lib/apiClient';

export const getProfile = () => apiClient('/profile');
export const updateProfile = (data) => apiClient('/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const updatePassword = (data) => apiClient('/profile/password', { method: 'PATCH', body: JSON.stringify(data) });
