const BASE_URL = 'http://localhost:3001';
export const TOKEN_KEY = 'tv_access_token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// ── Internal fetch wrapper ─────────────────────────────────────────

function buildHeaders(extraHeaders = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function parseResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return res.json();
    return null;
}

async function doFetch(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: 'include',          // always send cookies (refresh token)
        headers: buildHeaders(options.headers),
    });
    return res;
}

// ── Silent token refresh ───────────────────────────────────────────

let isRefreshing = false;
let refreshQueue = [];  // requests waiting while refresh is in-flight

function drainQueue(error, newToken) {
    refreshQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(newToken)
    );
    refreshQueue = [];
}

async function attemptRefresh() {
    if (isRefreshing) {
        // Another request is already refreshing — wait in queue
        return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;
    try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!res.ok) throw new Error('Refresh failed');

        const data = await res.json();
        setToken(data.accessToken);
        drainQueue(null, data.accessToken);
        return data.accessToken;
    } catch (err) {
        drainQueue(err, null);
        removeToken();
        window.location.href = '/login';
        throw err;
    } finally {
        isRefreshing = false;
    }
}

// ── Public API client ──────────────────────────────────────────────

async function apiClient(path, options = {}) {
    let res = await doFetch(path, options);

    // If access token expired → try to refresh silently and retry once
    if (res.status === 401) {
        try {
            await attemptRefresh();
            // Retry original request with new access token in headers
            res = await doFetch(path, options);
        } catch {
            // attemptRefresh already redirected to /login
            throw new Error('Session expired');
        }
    }

    const data = await parseResponse(res);

    if (!res.ok) {
        const message = (data && data.error) || `Request failed with status ${res.status}`;
        throw new Error(message);
    }

    return data;
}

export default apiClient;
