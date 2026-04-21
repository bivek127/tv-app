import apiClient from '../lib/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function getPreferences() {
    return apiClient('/notifications/preferences');
}

export function updatePreferences(patch) {
    return apiClient('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
}

export function savePushSubscription(subscription) {
    return apiClient('/notifications/push-subscription', {
        method: 'POST',
        body: JSON.stringify(subscription),
    });
}

export function deletePushSubscription(endpoint) {
    return apiClient('/notifications/push-subscription', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
    });
}

/**
 * Public endpoint — no auth required. Uses a plain fetch so we don't trip
 * the apiClient's 401-refresh flow for an unauthenticated call.
 */
export async function getVapidPublicKey() {
    const res = await fetch(`${BASE_URL}/notifications/vapid-public-key`);
    if (!res.ok) throw new Error('Could not fetch VAPID key');
    const body = await res.json();
    if (!body.success) throw new Error(body.error || 'VAPID key unavailable');
    return body.data.publicKey;
}
