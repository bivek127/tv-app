import { useState, useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { createProject, updateProject, deleteProject } from '../api/projects';
import { useToast } from '../context/ToastContext';
import './ProjectsSidebar.css';

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#ec4899', '#f43f5e', '#64748b',
];

const ICON_OPTIONS = ['📋', '✅', '🎯', '🚀', '💡', '🔥', '⚡', '🎨', '📚', '💼', '🏠', '🌟'];

function ProjectForm({ initial, onSave, onCancel, saving }) {
    const [name, setName] = useState(initial?.name || '');
    const [color, setColor] = useState(initial?.color || '#6366f1');
    const [icon, setIcon] = useState(initial?.icon || '📋');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) { setError('Name is required'); return; }
        setError('');
        try {
            await onSave({ name: trimmed, color, icon });
        } catch (err) {
            setError(err.message || 'Could not save project');
        }
    };

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="project-form-input"
                autoFocus
            />
            <div className="project-form-label">Color</div>
            <div className="project-color-grid">
                {PRESET_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`project-color-swatch ${color === c ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setColor(c)}
                        aria-label={`Color ${c}`}
                    >
                        {color === c && <span className="project-color-check">✓</span>}
                    </button>
                ))}
            </div>
            <div className="project-form-label">Icon</div>
            <div className="project-icon-grid">
                {ICON_OPTIONS.map((em) => (
                    <button
                        key={em}
                        type="button"
                        className={`project-icon-option ${icon === em ? 'selected' : ''}`}
                        onClick={() => setIcon(em)}
                    >
                        {em}
                    </button>
                ))}
            </div>
            {error && <p className="project-form-error">{error}</p>}
            <div className="project-form-actions">
                <button type="button" onClick={onCancel} className="project-form-cancel" disabled={saving}>
                    Cancel
                </button>
                <button type="submit" className="project-form-save" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}

function ProjectRow({ project, isActive, onSelect, onStartEdit, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    return (
        <div
            className={`project-item ${isActive ? 'active' : ''}`}
            style={{ '--project-color': project.color }}
            onClick={() => onSelect(project)}
            onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
        >
            <span className="project-icon">{project.icon || '📋'}</span>
            <span className="project-name" title={project.name}>{project.name}</span>
            <div className="project-menu-anchor" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button
                    className="project-menu-btn"
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Project options"
                    type="button"
                >⋯</button>
                {menuOpen && (
                    <div className="project-menu">
                        <button
                            type="button"
                            onClick={() => { setMenuOpen(false); onStartEdit(project); }}
                        >Edit</button>
                        <button
                            type="button"
                            onClick={() => { setMenuOpen(false); onDelete(project); }}
                            disabled={project.is_default}
                            title={project.is_default ? 'Default project cannot be deleted' : ''}
                        >Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProjectsSidebar() {
    const { projects, activeProject, setActiveProject, refetchProjects } = useProject();
    const { showToast } = useToast();
    const [mode, setMode] = useState('list'); // list | create | edit
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const openCreate = () => { setEditing(null); setMode('create'); };
    const closeForm  = () => { setMode('list'); setEditing(null); };

    // Close the modal on Escape.
    useEffect(() => {
        if (mode === 'list') return;
        const onKey = (e) => { if (e.key === 'Escape') closeForm(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mode]);

    const handleCreate = async (data) => {
        setSaving(true);
        try {
            const created = await createProject(data);
            await refetchProjects();
            setActiveProject(created);
            setMode('list');
            showToast(`Project "${created.name}" created`, 'success');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (data) => {
        if (!editing) return;
        setSaving(true);
        try {
            await updateProject(editing.id, data);
            await refetchProjects();
            setMode('list');
            setEditing(null);
            showToast('Project updated', 'success');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (project) => {
        if (project.is_default) {
            showToast('The default project cannot be deleted.', 'warning');
            return;
        }
        if (!window.confirm(`Delete project "${project.name}"? All tasks inside it will be deleted too.`)) return;
        try {
            await deleteProject(project.id);
            if (activeProject?.id === project.id) {
                const fallback = projects.find((p) => p.is_default) || null;
                setActiveProject(fallback);
            }
            await refetchProjects();
            showToast(`Project "${project.name}" deleted`, 'success');
        } catch (err) {
            showToast(err.message || 'Could not delete project', 'error');
        }
    };

    const modalOpen = mode === 'create' || (mode === 'edit' && editing);

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">📋</div>
                    <span className="sidebar-logo-text">TaskVault</span>
                </div>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">Projects</h2>
                    <button
                        className="sidebar-add-btn"
                        onClick={openCreate}
                        aria-label="New project"
                        title="New project"
                        type="button"
                    >+</button>
                </div>

                <div className="project-list">
                    {projects.map((p) => (
                        <ProjectRow
                            key={p.id}
                            project={p}
                            isActive={activeProject?.id === p.id}
                            onSelect={setActiveProject}
                            onStartEdit={(proj) => { setEditing(proj); setMode('edit'); }}
                            onDelete={handleDelete}
                        />
                    ))}
                    {projects.length === 0 && (
                        <p className="sidebar-empty">No projects yet.</p>
                    )}
                </div>

                <button
                    className="sidebar-new-btn"
                    onClick={openCreate}
                    type="button"
                >+ New project</button>
            </aside>

            {modalOpen && (
                <div
                    className="project-modal-backdrop"
                    onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
                >
                    <div className="project-modal" role="dialog" aria-modal="true">
                        <div className="project-modal-header">
                            <h3>{mode === 'edit' ? 'Edit project' : 'New project'}</h3>
                            <button
                                type="button"
                                className="project-modal-close"
                                onClick={closeForm}
                                aria-label="Close"
                            >×</button>
                        </div>
                        <ProjectForm
                            initial={mode === 'edit' ? editing : null}
                            onSave={mode === 'edit' ? handleUpdate : handleCreate}
                            onCancel={closeForm}
                            saving={saving}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export default ProjectsSidebar;
