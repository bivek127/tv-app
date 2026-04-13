import { useState } from 'react';
import { getActivity } from '../api/activity';
import './ActivityFeed.css';

const ACTION_ICONS = {
    task_created:    '✅',
    task_updated:    '✏️',
    task_deleted:    '🗑️',
    task_completed:  '🎉',
    login:           '🔐',
    subtask_created: '➕',
    subtask_updated: '✏️',
    subtask_deleted: '🗑️',
};

function actionIcon(action) {
    return ACTION_ICONS[action] || '📋';
}

function actionDescription(item) {
    const { action, entity_type, metadata } = item;
    const title = metadata?.title || metadata?.name || entity_type;

    switch (action) {
        case 'task_created':    return `Created task "${title}"`;
        case 'task_updated':    return `Updated task "${title}"`;
        case 'task_deleted':    return `Deleted task "${title}"`;
        case 'task_completed':  return `Completed task "${title}"`;
        case 'subtask_created': return `Added subtask "${title}"`;
        case 'subtask_updated': return `Updated subtask "${title}"`;
        case 'subtask_deleted': return `Removed subtask "${title}"`;
        case 'login':           return 'Signed in';
        default:                return `${action.replace(/_/g, ' ')} (${entity_type})`;
    }
}

function relativeTime(dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60)         return 'just now';
    if (diff < 3600)       return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)      return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 172800)     return 'yesterday';
    if (diff < 604800)     return `${Math.floor(diff / 86400)} days ago`;
    // Fall back to locale date for older entries
    return new Date(dateStr).toLocaleDateString();
}

function SkeletonRow() {
    return (
        <div className="activity-item activity-skeleton">
            <div className="skeleton-icon" />
            <div className="skeleton-lines">
                <div className="skeleton-line long" />
                <div className="skeleton-line short" />
            </div>
        </div>
    );
}

function ActivityFeed() {
    const [open, setOpen]       = useState(false);
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [fetched, setFetched] = useState(false);

    const handleToggle = async () => {
        const willOpen = !open;
        setOpen(willOpen);

        if (willOpen && !fetched) {
            setLoading(true);
            try {
                const data = await getActivity();
                setItems(Array.isArray(data) ? data : []);
                setFetched(true);
            } catch (err) {
                setError(err.message || 'Could not load activity.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="activity-panel">
            <button className="activity-toggle" onClick={handleToggle}>
                <span>Recent Activity</span>
                <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
            </button>

            {open && (
                <div className="activity-body">
                    {loading && (
                        <>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </>
                    )}

                    {error && <p className="activity-error">{error}</p>}

                    {!loading && !error && items.length === 0 && (
                        <p className="activity-empty">No activity yet.</p>
                    )}

                    {!loading && items.length > 0 && (
                        <ul className="activity-list">
                            {items.map((item) => (
                                <li key={item.id} className="activity-item">
                                    <span className="activity-icon" aria-hidden="true">
                                        {actionIcon(item.action)}
                                    </span>
                                    <div className="activity-content">
                                        <span className="activity-desc">{actionDescription(item)}</span>
                                        <span className="activity-time">{relativeTime(item.created_at)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default ActivityFeed;
