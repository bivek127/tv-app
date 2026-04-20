import './Toast.css';

const ICONS = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
};

function Toast({ toasts, onDismiss }) {
    return (
        <div className="toast-container" role="region" aria-label="Notifications">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type || 'info'}`} role="status">
                    <span className="toast-icon" aria-hidden="true">{ICONS[t.type] || ICONS.info}</span>
                    <span className="toast-message">{t.message}</span>
                    <button
                        className="toast-close"
                        onClick={() => onDismiss(t.id)}
                        aria-label="Dismiss notification"
                        type="button"
                    >×</button>
                </div>
            ))}
        </div>
    );
}

export default Toast;
