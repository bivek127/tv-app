import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTask, deleteTask } from '../api/tasks';
import { getSubtasks } from '../api/subtasks';
import Checklist from './Checklist';

const PRIORITY_COLORS = {
    urgent: '#bf2600',
    high: '#ff5630',
    medium: '#ffab00',
    low: '#97a0af',
};

const PRIORITY_LABELS = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

function isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date(new Date().toDateString());
}

function TaskCard({ task, onRefresh }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'medium');
    const [status, setStatus] = useState(task.status || 'todo');
    const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [subtaskStats, setSubtaskStats] = useState({ total: 0, completed: 0 });

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    useEffect(() => {
        getSubtasks(task.id).then((data) => {
            setSubtaskStats({
                total: data.length,
                completed: data.filter((s) => s.completed).length,
            });
        }).catch(() => {});
    }, [task.id, editing]);

    const handleSave = async () => {
        if (!title.trim()) { setError('Title is required'); return; }
        setError('');
        setLoading(true);
        try {
            await updateTask(task.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                status,
                due_date: dueDate || null,
            });
            setEditing(false);
            onRefresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${task.title}"?`)) return;
        setLoading(true);
        try {
            await deleteTask(task.id);
            onRefresh();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority || 'medium');
        setStatus(task.status || 'todo');
        setDueDate(task.due_date ? task.due_date.slice(0, 10) : '');
        setError('');
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="kanban-card kanban-card-editing" ref={setNodeRef} style={style}>
                {error && <p className="error" style={{ fontSize: '0.75rem' }}>{error}</p>}
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description" />
                <div className="kanban-edit-row">
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Checklist taskId={task.id} />
                <div className="kanban-edit-actions">
                    <button onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
                    <button onClick={handleCancel} className="btn-secondary">Cancel</button>
                    <button onClick={handleDelete} className="btn-danger" disabled={loading}>Delete</button>
                </div>
            </div>
        );
    }

    const percent = subtaskStats.total === 0 ? 0 : Math.round((subtaskStats.completed / subtaskStats.total) * 100);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="kanban-card"
            {...attributes}
            {...listeners}
            onClick={() => setEditing(true)}
        >
            <div className="kanban-card-title">{task.title}</div>
            {task.description && (
                <div className="kanban-card-desc">{task.description}</div>
            )}
            {subtaskStats.total > 0 && (
                <div className="kanban-subtask-progress">
                    <div className="kanban-subtask-bar">
                        <div className="kanban-subtask-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="kanban-subtask-count">{subtaskStats.completed}/{subtaskStats.total}</span>
                </div>
            )}
            <div className="kanban-card-meta">
                <span
                    className="kanban-priority-badge"
                    style={{ background: PRIORITY_COLORS[task.priority] }}
                >
                    {PRIORITY_LABELS[task.priority]}
                </span>
                {task.due_date && (
                    <span className="kanban-due-date">
                        {task.due_date.slice(0, 10)}
                    </span>
                )}
                {isOverdue(task) && (
                    <span className="kanban-overdue">Overdue</span>
                )}
            </div>
        </div>
    );
}

export default TaskCard;
