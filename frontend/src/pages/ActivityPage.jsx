import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import './ActivityPage.css';

// ── Action metadata ────────────────────────────────────────────────
const ACTION_MAP = {
    task_created:      { label: 'Created a task',          icon: '✚', cls: 'icon-created' },
    task_updated:      { label: 'Updated a task',          icon: '✎', cls: 'icon-updated' },
    task_deleted:      { label: 'Deleted a task',          icon: '✕', cls: 'icon-deleted' },
    user_login:        { label: 'Signed in',               icon: '→', cls: 'icon-login'   },
    user_login_google: { label: 'Signed in with Google',   icon: 'G', cls: 'icon-login'   },
    user_logout:       { label: 'Signed out',              icon: '←', cls: 'icon-logout'  },
};

// ── Relative time helper ───────────────────────────────────────────
function relativeTime(dateString) {
    const diff = Date.now() - new Date(dateString).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60)                       return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)                       return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)                         return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30)                          return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12)                        return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${Math.floor(months / 12)} yr ago`;
}

// ── Skeleton ───────────────────────────────────────────────────────
function Skeleton() {
    return (
        <div className="activity-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
                <div className="skeleton-item" key={i}>
                    <div className="skeleton-circle" />
                    <div className="skeleton-bar" />
                </div>
            ))}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────
function ActivityPage() {
    const [logs, setLogs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        apiClient('/activity')
            .then((data) => setLogs(Array.isArray(data) ? data : []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="app">
            <header className="app-header">
                <h1>TaskVault</h1>
                <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Link to="/" style={{ color: '#fff', fontSize: '0.875rem', textDecoration: 'none', opacity: 0.85 }}>
                        Dashboard
                    </Link>
                </nav>
            </header>

            <main className="activity-page">
                <h2>Activity</h2>

                {loading && <Skeleton />}

                {!loading && error && (
                    <p className="error banner">{error}</p>
                )}

                {!loading && !error && logs.length === 0 && (
                    <p className="activity-empty">No activity yet.</p>
                )}

                {!loading && !error && logs.length > 0 && (
                    <ul className="activity-timeline">
                        {logs.map((log) => {
                            const meta = ACTION_MAP[log.action] || {
                                label: log.action,
                                icon: '•',
                                cls: 'icon-logout',
                            };
                            const title = log.metadata?.title || null;

                            return (
                                <li className="activity-item" key={log.id}>
                                    <span className={`activity-icon ${meta.cls}`} aria-hidden="true">
                                        {meta.icon}
                                    </span>
                                    <div className="activity-body">
                                        <p className="activity-label">
                                            {meta.label}
                                            {title && (
                                                <span className="activity-title"> — {title}</span>
                                            )}
                                        </p>
                                        <p className="activity-time">{relativeTime(log.created_at)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
        </div>
    );
}

export default ActivityPage;
