import { useEffect, useState } from 'react';
import { getToken } from '../api/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSSE(onEvent) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const url = `${BASE_URL}/events?token=${encodeURIComponent(token)}`;
        const evtSource = new EventSource(url);

        evtSource.onopen = () => setIsConnected(true);

        evtSource.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                onEvent(data);
            } catch { /* ignore malformed payloads */ }
        };

        evtSource.onerror = () => {
            // EventSource auto-reconnects; onopen will flip state back to true.
            setIsConnected(false);
        };

        return () => evtSource.close();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { isConnected };
}
