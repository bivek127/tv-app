import { useState, useEffect, useRef } from 'react';
import { getDependencies, addDependency, removeDependency } from '../api/dependencies';
import './DependencyManager.css';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function DependencyRow({ task, onRemove }) {
    return (
        <li className="dep-row">
            <span className="dep-title" title={task.title}>{task.title}</span>
            <span className={`badge priority-badge priority-${task.priority}`}>
                {PRIORITY_LABELS[task.priority]}
            </span>
            <span className={`badge status-badge status-${task.status}`}>
                {STATUS_LABELS[task.status]}
            </span>
            <button className="dep-remove" onClick={() => onRemove(task.id)} title="Remove">×</button>
        </li>
    );
}

function DependencyManager({ taskId, allTasks = [] }) {
    const [blocking, setBlocking] = useState([]);
    const [blockedBy, setBlockedBy] = useState([]);
    const [query, setQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mode, setMode] = useState('blocking'); // 'blocking' (this blocks X) or 'blockedBy'
    const [error, setError] = useState('');
    const searchRef = useRef(null);

    const load = () => {
        getDependencies(taskId)
            .then((data) => {
                setBlocking(data.blocking || []);
                setBlockedBy(data.blockedBy || []);
            })
            .catch(() => {});
    };

    useEffect(() => { load(); }, [taskId]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    const excludedIds = new Set([
        taskId,
        ...blocking.map((t) => t.id),
        ...blockedBy.map((t) => t.id),
    ]);

    const matches = query.trim()
        ? allTasks.filter((t) =>
              !excludedIds.has(t.id) &&
              t.title.toLowerCase().includes(query.trim().toLowerCase())
          ).slice(0, 8)
        : [];

    const handleAdd = async (chosen) => {
        setError('');
        try {
            if (mode === 'blocking') {
                // This task blocks the chosen one
                await addDependency(taskId, chosen.id);
            } else {
                // The chosen task blocks this one
                await addDependency(chosen.id, taskId);
            }
            setQuery('');
            setDropdownOpen(false);
            load();
        } catch (err) {
            setError(err.message || 'Could not add dependency');
        }
    };

    const handleRemoveBlocking = async (blockedId) => {
        try {
            await removeDependency(taskId, blockedId);
            load();
        } catch {}
    };

    const handleRemoveBlockedBy = async (blockerId) => {
        try {
            await removeDependency(blockerId, taskId);
            load();
        } catch {}
    };

    return (
        <div className="dep-manager">
            <div className="dep-header">
                <span className="dep-label">Dependencies</span>
            </div>

            <div className="dep-section">
                <div className="dep-section-title">Blocked by ({blockedBy.length})</div>
                {blockedBy.length === 0 ? (
                    <p className="dep-empty">Nothing blocking this task.</p>
                ) : (
                    <ul className="dep-list">
                        {blockedBy.map((t) => (
                            <DependencyRow key={t.id} task={t} onRemove={handleRemoveBlockedBy} />
                        ))}
                    </ul>
                )}
            </div>

            <div className="dep-section">
                <div className="dep-section-title">Blocking ({blocking.length})</div>
                {blocking.length === 0 ? (
                    <p className="dep-empty">This task isn't blocking anything.</p>
                ) : (
                    <ul className="dep-list">
                        {blocking.map((t) => (
                            <DependencyRow key={t.id} task={t} onRemove={handleRemoveBlocking} />
                        ))}
                    </ul>
                )}
            </div>

            <div className="dep-add" ref={searchRef}>
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="dep-mode-select"
                >
                    <option value="blocking">This blocks…</option>
                    <option value="blockedBy">This is blocked by…</option>
                </select>
                <div className="dep-search-wrapper">
                    <input
                        type="text"
                        placeholder="Search tasks by title…"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); setError(''); }}
                        onFocus={() => setDropdownOpen(true)}
                        className="dep-search-input"
                    />
                    {dropdownOpen && matches.length > 0 && (
                        <ul className="dep-dropdown">
                            {matches.map((t) => (
                                <li
                                    key={t.id}
                                    className="dep-dropdown-item"
                                    onClick={() => handleAdd(t)}
                                >
                                    {t.title}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {error && <p className="dep-error">{error}</p>}
        </div>
    );
}

export default DependencyManager;
