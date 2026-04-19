import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useTheme } from '../context/ThemeContext';
import './CommandPalette.css';

/**
 * Case-insensitive substring match. Returns null when no match, or an array
 * of [matched, char] segments that the renderer can bold.
 */
function highlight(text, query) {
    if (!query) return [[false, text]];
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return null;
    return [
        [false, text.slice(0, i)],
        [true,  text.slice(i, i + query.length)],
        [false, text.slice(i + query.length)],
    ];
}

function CommandPalette({ open, onClose, tasks, onOpenTask, onFocusNewTask, onSetView }) {
    const [query, setQuery] = useState('');
    const [cursor, setCursor] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const { projects, setActiveProject, activeProject } = useProject();
    const { toggleTheme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            setQuery('');
            setCursor(0);
            // Defer until the modal has mounted.
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    const actions = useMemo(() => ([
        { id: 'action:new-task',  label: 'Create new task', hint: 'Focus task form', run: () => onFocusNewTask?.() },
        { id: 'action:board',     label: 'Switch to Board view', run: () => onSetView?.('board') },
        { id: 'action:list',      label: 'Switch to List view',  run: () => onSetView?.('list') },
        { id: 'action:profile',   label: 'Go to Profile', run: () => navigate('/profile') },
        { id: 'action:theme',     label: 'Toggle dark mode', run: () => toggleTheme() },
    ]), [onFocusNewTask, onSetView, navigate, toggleTheme]);

    const results = useMemo(() => {
        const q = query.trim();

        const matchedTasks = tasks
            .map((t) => ({ t, hl: highlight(t.title, q) }))
            .filter(({ hl }) => q === '' ? true : hl !== null)
            .slice(0, 20)
            .map(({ t, hl }) => ({
                id: `task:${t.id}`,
                category: 'Tasks',
                label: t.title,
                hl,
                onRun: () => onOpenTask?.(t),
            }));

        const matchedProjects = projects
            .map((p) => ({ p, hl: highlight(p.name, q) }))
            .filter(({ hl }) => q === '' ? true : hl !== null)
            .map(({ p, hl }) => ({
                id: `project:${p.id}`,
                category: 'Projects',
                label: p.name,
                icon: p.icon || '📋',
                hl,
                hint: p.id === activeProject?.id ? 'Active' : undefined,
                onRun: () => setActiveProject(p),
            }));

        const matchedActions = actions
            .map((a) => ({ ...a, hl: highlight(a.label, q) }))
            .filter(({ hl }) => q === '' ? true : hl !== null)
            .map((a) => ({
                id: a.id,
                category: 'Actions',
                label: a.label,
                hint: a.hint,
                hl: a.hl,
                onRun: a.run,
            }));

        return [...matchedActions, ...matchedProjects, ...matchedTasks];
    }, [query, tasks, projects, activeProject, actions, onOpenTask, setActiveProject]);

    useEffect(() => {
        // Reset cursor when results change; keep it in range.
        setCursor((c) => Math.min(c, Math.max(results.length - 1, 0)));
    }, [results.length]);

    useEffect(() => {
        // Scroll the active row into view on arrow navigation.
        const el = listRef.current?.querySelector(`[data-index="${cursor}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [cursor]);

    if (!open) return null;

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = results[cursor];
            if (item) {
                item.onRun();
                onClose();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    // Group header rendering — emit category label once per group.
    let lastCategory = null;

    return (
        <div className="palette-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="palette" role="dialog" aria-label="Command palette">
                <input
                    ref={inputRef}
                    type="text"
                    className="palette-input"
                    placeholder="Search tasks, projects, and actions…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="palette-results" ref={listRef}>
                    {results.length === 0 && (
                        <div className="palette-empty">No matches</div>
                    )}
                    {results.map((item, i) => {
                        const showCat = item.category !== lastCategory;
                        lastCategory = item.category;
                        return (
                            <div key={item.id}>
                                {showCat && <div className="palette-category">{item.category}</div>}
                                <button
                                    type="button"
                                    className={`palette-row ${i === cursor ? 'selected' : ''}`}
                                    data-index={i}
                                    onMouseEnter={() => setCursor(i)}
                                    onClick={() => { item.onRun(); onClose(); }}
                                >
                                    {item.icon && <span className="palette-icon">{item.icon}</span>}
                                    <span className="palette-label">
                                        {item.hl
                                            ? item.hl.map(([matched, text], j) =>
                                                matched
                                                    ? <mark key={j}>{text}</mark>
                                                    : <span key={j}>{text}</span>
                                            )
                                            : item.label}
                                    </span>
                                    {item.hint && <span className="palette-hint">{item.hint}</span>}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="palette-footer">
                    <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> select</span>
                    <span><kbd>esc</kbd> close</span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
