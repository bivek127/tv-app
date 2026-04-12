import { useState, useEffect } from 'react';
import { getToken } from '../lib/apiClient';
import { getLabels } from '../api/labels';
import './FilterBar.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FilterBar({ search, onSearchChange, priority, onPriorityChange, status, onStatusChange, sort, onSortChange, labelFilter, onLabelFilterChange, onClear, taskCount }) {
    const [labels, setLabels] = useState([]);

    useEffect(() => {
        getLabels().then(setLabels).catch(() => {});
    }, []);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const url = search
                ? `${BASE_URL}/tasks/export?search=${encodeURIComponent(search)}`
                : `${BASE_URL}/tasks/export`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = 'tasks.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            alert(err.message || 'Could not export tasks');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="filter-bar">
            <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="filter-search"
            />
            <select value={priority} onChange={(e) => onPriorityChange(e.target.value)} className="filter-select">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </select>
            <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="filter-select">
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
            </select>
            {labels.length > 0 && (
                <select value={labelFilter} onChange={(e) => onLabelFilterChange(e.target.value)} className="filter-select">
                    <option value="">All Labels</option>
                    {labels.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            )}
            <select value={sort} onChange={(e) => onSortChange(e.target.value)} className="filter-select">
                <option value="">Sort: Default</option>
                <option value="due_asc">Due Date ↑</option>
                <option value="priority_desc">Priority ↓</option>
                <option value="title_asc">Title A–Z</option>
                <option value="status">Status</option>
            </select>
            {(search || priority || status || labelFilter) && (
                <button onClick={onClear} className="filter-clear">Clear</button>
            )}
            <span className="filter-count">{taskCount} tasks found</span>
            <button onClick={handleExport} disabled={exporting} className="btn-export">
                {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
        </div>
    );
}

export default FilterBar;
