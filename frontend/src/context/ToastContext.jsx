import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 3000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
        const id = ++idRef.current;
        setToasts((prev) => {
            const next = [...prev, { id, message, type }];
            // Cap visible toasts — drop oldest if we exceed the ceiling.
            return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
        });
        if (duration > 0) setTimeout(() => dismissToast(id), duration);
        return id;
    }, [dismissToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
            {children}
            <Toast toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
