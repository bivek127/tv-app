import { useState, useEffect } from 'react';
import { updateTask, deleteTask } from '../api/tasks';
import { getLabelsForTask } from '../api/labels';
import Checklist from './Checklist';
import LabelManager from './LabelManager';
import DependencyManager from './DependencyManager';
import { useToast } from '../context/ToastContext';
import './TaskModal.css';

const PRIORITY_COLORS = {
    urgent: '#bf2600',
    high: '#ff5630',
    medium: '#ffab00',
    low: '#97a0af',
};

function TaskModal({ task, onClose, onRefresh, allTasks = [] }) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'medium');
    const [status, setStatus] = useState(task.status || 'todo');
    const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : '');
    const [loading, setLoading] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [taskLabels, setTaskLabels] = useState(task.labels || []);
    const { showToast } = useToast();

    const refreshLabels = () => {
        getLabelsForTask(task.id).then(setTaskLabels).catch(() => {});
    };

    useEffect(() => { refreshLabels(); }, [task.id]);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const markDirty = (setter) => (val) => { setter(val); setDirty(true); };

    const handleSave = async () => {
        if (!title.trim()) { showToast('Title is required', 'warning'); return; }
        setLoading(true);
        try {
            await updateTask(task.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                status,
                due_date: dueDate || null,
            });
            setDirty(false);
            showToast('Task saved', 'success');
            onRefresh();
        } catch (err) {
            showToast(err.message || 'Could not save task', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${task.title}"?`)) return;
        setLoading(true);
        try {
            await deleteTask(task.id);
            showToast('Task deleted', 'success');
            onRefresh();
            onClose();
        } catch (err) {
            showToast(err.message || 'Could not delete task', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <input
                        className="modal-title-input"
                        value={title}
                        onChange={(e) => markDirty(setTitle)(e.target.value)}
                        placeholder="Task title"
                    />
                    <button className="modal-close" onClick={onClose} title="Close">×</button>
                </div>

                <div className="modal-body">
                    {/* Left column — task details */}
                    <div className="modal-left">
                        <label className="modal-label">Description</label>
                        <textarea
                            className="modal-desc"
                            value={description}
                            onChange={(e) => markDirty(setDescription)(e.target.value)}
                            placeholder="Add a description..."
                            rows={4}
                        />

                        <div className="modal-fields">
                            <div className="modal-field">
                                <label className="modal-label">Status</label>
                                <select value={status} onChange={(e) => markDirty(setStatus)(e.target.value)}>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div className="modal-field">
                                <label className="modal-label">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => markDirty(setPriority)(e.target.value)}
                                    style={{ borderLeft: `3px solid ${PRIORITY_COLORS[priority]}` }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div className="modal-field">
                                <label className="modal-label">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => markDirty(setDueDate)(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={handleSave} disabled={loading || !dirty}>
                                {loading ? 'Saving…' : 'Save changes'}
                            </button>
                            <button onClick={handleDelete} className="btn-danger" disabled={loading}>
                                Delete task
                            </button>
                        </div>
                    </div>

                    {/* Right column — checklist + labels + dependencies */}
                    <div className="modal-right">
                        <Checklist taskId={task.id} />
                        <LabelManager taskId={task.id} taskLabels={taskLabels} onLabelsChange={refreshLabels} />
                        <DependencyManager taskId={task.id} allTasks={allTasks} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskModal;
