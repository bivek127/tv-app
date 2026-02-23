const BASE_URL = 'http://localhost:3001';
const TOKEN_KEY = 'tv_token';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Central API client.
 * - Automatically attaches Authorization header if token exists.
 * - Safely parses JSON (returns null for empty responses like 204).
 * - Throws a plain Error with the server's error message on non-2xx responses.
 * - Throws specifically on 401 so callers / global handlers can react.
 */
async function apiClient(path, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    // Parse JSON safely (204 No Content has no body)
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    }

    if (!res.ok) {
        if (res.status === 401) {
            // Clear stale token and redirect — handled globally here
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
        }
        const message = (data && data.error) || `Request failed with status ${res.status}`;
        throw new Error(message);
    }

    return data;
}

export default apiClient;
