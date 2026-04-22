import { useCallback, useEffect, useState } from 'react';
import {
    getVapidPublicKey,
    savePushSubscription,
    deletePushSubscription,
} from '../api/notifications';

const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;

function urlBase64ToUint8Array(base64String) {
    if (!base64String || !/^[A-Za-z0-9_-]+$/.test(base64String)) {
        throw new Error('Push notifications are not configured on the server.');
    }
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((ch) => ch.charCodeAt(0)));
}

function serializeSubscription(sub) {
    const json = sub.toJSON();
    return {
        endpoint: json.endpoint,
        keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
        },
    };
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [permissionState, setPermissionState] = useState(
        isSupported ? Notification.permission : 'unsupported'
    );

    // Inspect existing subscription on mount so the UI reflects real state.
    useEffect(() => {
        if (!isSupported) return;
        let cancelled = false;
        (async () => {
            try {
                const reg = await navigator.serviceWorker.ready;
                const existing = await reg.pushManager.getSubscription();
                if (!cancelled) setIsSubscribed(!!existing);
            } catch (_) {
                if (!cancelled) setIsSubscribed(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported) throw new Error('Push notifications are not supported in this browser.');
        setIsRequesting(true);
        try {
            const permission = await Notification.requestPermission();
            setPermissionState(permission);
            if (permission !== 'granted') {
                throw new Error(permission === 'denied'
                    ? 'Notification permission was denied.'
                    : 'Notification permission was not granted.');
            }

            const publicKey = await getVapidPublicKey();
            if (!publicKey) throw new Error('Push notifications are not configured on the server.');

            const reg = await navigator.serviceWorker.ready;
            let subscription = await reg.pushManager.getSubscription();
            if (!subscription) {
                subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                });
            }

            await savePushSubscription(serializeSubscription(subscription));
            setIsSubscribed(true);
            return subscription;
        } finally {
            setIsRequesting(false);
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return;
        setIsRequesting(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
                try { await deletePushSubscription(subscription.endpoint); } catch (_) {}
                await subscription.unsubscribe();
            }
            setIsSubscribed(false);
        } finally {
            setIsRequesting(false);
        }
    }, []);

    return {
        isSupported,
        isSubscribed,
        isRequesting,
        permissionState,
        subscribe,
        unsubscribe,
    };
}
