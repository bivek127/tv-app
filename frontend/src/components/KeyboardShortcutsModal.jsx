import { useEffect } from 'react';
import './KeyboardShortcutsModal.css';

const SHORTCUTS = [
    { keys: ['N'],          description: 'New task (focus title)' },
    { keys: ['/'],          description: 'Focus search' },
    { keys: ['B'],          description: 'Switch to Board view' },
    { keys: ['L'],          description: 'Switch to List view' },
    { keys: ['⌘', 'K'],    description: 'Open command palette' },
    { keys: ['?'],          description: 'Show this help' },
    { keys: ['Esc'],        description: 'Close open modal' },
];

function KeyboardShortcutsModal({ onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="shortcuts-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="shortcuts-modal" role="dialog" aria-label="Keyboard shortcuts">
                <div className="shortcuts-header">
                    <h2>Keyboard shortcuts</h2>
                    <button className="shortcuts-close" onClick={onClose} aria-label="Close" type="button">×</button>
                </div>
                <table className="shortcuts-table">
                    <tbody>
                        {SHORTCUTS.map((row, i) => (
                            <tr key={i}>
                                <td className="shortcuts-keys">
                                    {row.keys.map((k, j) => (
                                        <span key={j}>
                                            <kbd className="shortcut-kbd">{k}</kbd>
                                            {j < row.keys.length - 1 && <span className="shortcut-plus">+</span>}
                                        </span>
                                    ))}
                                </td>
                                <td className="shortcuts-desc">{row.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default KeyboardShortcutsModal;
