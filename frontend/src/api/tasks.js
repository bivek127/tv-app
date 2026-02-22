import { getToken, removeToken } from './auth';

const BASE_URL = 'http://localhost:3001';

/**
 * Builds headers with Authorization token.
 * If no token exists the request is sent without one — backend will return 401.
 */
function authHeaders() {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

/**
 * Handle 401 globally: remove token and redirect to /login.
 */
function handleUnauthorized(res) {
    if (res.status === 401) {
        removeToken();
        window.location.href = '/login';
    }
    return res;
}

export async function getTasks() {
    const res = handleUnauthorized(
        await fetch(`${BASE_URL}/tasks`, { headers: authHeaders() })
    );
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
}

export async function createTask(data) {
    const res = handleUnauthorized(
        await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data),
        })
    );
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
}

export async function updateTask(id, data) {
    const res = handleUnauthorized(
        await fetch(`${BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data),
        })
    );
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
}

export async function deleteTask(id) {
    const res = handleUnauthorized(
        await fetch(`${BASE_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        })
    );
    if (!res.ok) throw new Error('Failed to delete task');
}
