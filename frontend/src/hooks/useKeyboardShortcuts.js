import { useEffect } from 'react';

function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
}

/**
 * Register global keyboard shortcuts.
 *
 * @param {{
 *   onNewTask?: () => void,
 *   onFocusSearch?: () => void,
 *   onBoardView?: () => void,
 *   onListView?: () => void,
 *   onEscape?: () => void,
 *   onHelp?: () => void,
 *   enabled?: boolean,
 * }} handlers
 */
export function useKeyboardShortcuts(handlers) {
    useEffect(() => {
        if (handlers.enabled === false) return;

        const onKey = (e) => {
            // Let the OS/browser keep their modifier-based shortcuts (Cmd+K etc.).
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            // Escape always fires, even when typing, so modals can close on Esc.
            if (e.key === 'Escape') {
                handlers.onEscape?.();
                return;
            }

            if (isTypingTarget(e.target)) return;

            switch (e.key) {
                case 'n':
                case 'N':
                    handlers.onNewTask?.();
                    e.preventDefault();
                    break;
                case '/':
                    handlers.onFocusSearch?.();
                    e.preventDefault();
                    break;
                case 'b':
                case 'B':
                    handlers.onBoardView?.();
                    e.preventDefault();
                    break;
                case 'l':
                case 'L':
                    handlers.onListView?.();
                    e.preventDefault();
                    break;
                case '?':
                    handlers.onHelp?.();
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handlers]);
}
